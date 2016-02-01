'use strict';

/**
 * Main application workspace. It works in 3 modes:
 * 1. UNDEFINED. In may have measures but with no visual representation.
 * 2. MODE_2D. It has image. Spots are mapped on this image using X and Y
 *    coordinates (Z ignored).
 * 3. MODE_3D. It has a THREE.js scene with a mesh, light souces ets.
 *
 * Workspace tracks changes in measures, images and meshes and fires appropriates
 * events to allow updates. Workspace may have multiple views (2D and 3D view
 * shouldn't be mixed). Different 3D view for instance may show the same scene
 * from different perspectives.
 *
 * 'status'/'status-change' intended to inform
 * the user on progress in long-running tasks.
 *
 * 'measures'/'intensities-change' lets to update the map-list.
 */
function Workspace() {
    EventSource.call(this, Workspace.Events);

    this._mode = Workspace.Mode.UNDEFINED;
    this._errors = [];
    this._spots = null;
    this._mapping = null;
    this._measures = null;
    this._activeMeasure = null;
    this._colorMap = ColorMap.Maps.VIRIDIS;
    this._scale = Workspace.Scale.LINEAR;
    this._hotspotQuantile = 1.0;
    this._spotBorder = 0.0;
    this._autoMinMax = true;
    this._minValue = 0.0;
    this._maxValue = 0.0;
    this._scene3d = new Scene3D();
    this._scene2d = new Scene2D();
    this._scene3d.colorMap = this._colorMap;
    this._scene2d.colorMap = this._colorMap;

    this._status = '';
    this._tasks = {};
}

Workspace.Events = {
    STATUS_CHANGE: 'status-change',
    MODE_CHANGE: 'mode-change',
    MAPPING_CHANGE: 'mapping-change',
    INTENSITIES_CHANGE: 'intensities-change',
    ERRORS_CHANGE: 'errors-change',
    AUTO_MAPPING_CHANGE: 'auto-mapping-change',
}

Workspace.Mode = {
    UNDEFINED: 1,
    MODE_2D: 2,
    MODE_3D: 3,
};

Workspace.Scale = {
    LOG: {
        id: 'log',
        function: Math.log10,
        filter: function(x) { return x > 0.0 && x < Infinity; },
        legend: 'log',
    },

    LINEAR: {
        id: 'linear',
        function: function(x) {
            return x;
        },
        filter: function(x) { return x > -Infinity && x < Infinity; },
        legend: '',
    }
};

Workspace.getScaleById = function(id) {
    for (var i in Workspace.Scale) {
        if (Workspace.Scale[i].id == id) return Workspace.Scale[i];
    }
    throw 'Invalid scale id: ' + id;
};

/**
 * Asynchromous tasks. At most one task with the same key may run
 * (no 2 images could be loading simultaniously). Newer task cancels older one.
 * 'worker' is name of JS file in 'js/workers' or constructor of a Worker-like
 * class.
 */
Workspace.TaskType = {
    DOWNLOAD: {
        key: 'download',
        worker: 'Downloader.js'
    },

    LOAD_IMAGE: {
        key: 'load-image',
        worker: null // Workspace.ImageLoader
    },

    LOAD_MESH: {
        key: 'load-mesh',
        worker: 'MeshLoader.js'
    },

    LOAD_MEASURES: {
        key: 'load-measures',
        worker: 'MeasuresLoader.js'
    },

    MAP: {
        key: 'map',
        worker: 'Mapper.js'
    },
};

Workspace.prototype = Object.create(EventSource.prototype, {
    /**
     * Switches the workspace to MODE_2D and starts image loading.
     */
    loadImage: {
        value: function(blob) {
            this.mode = Workspace.Mode.MODE_2D;

            this._scene2d.resetImage();
            this._doTask(Workspace.TaskType.LOAD_IMAGE, blob).
                    then(function(result) {
                this._scene2d.setImage(result.url, result.width, result.height);
            }.bind(this));
        }
    },

    /**
     * Switches the workspace to MODE_3D and starts mesh loading.
     */
    loadMesh: {
        value: function(blob) {
            this.mode = Workspace.Mode.MODE_3D;

            this.mesh = null;
            this._doTask(Workspace.TaskType.LOAD_MESH, blob).then(function(result) {
                var geometry = new THREE.BufferGeometry();
                for (var name in result.attributes) {
                    var attribute = result.attributes[name];
                    geometry.addAttribute(name, new THREE.BufferAttribute(
                            attribute.array, attribute.itemSize));
                }
                this._scene3d.geometry = geometry;
                if (this._spots) {
                    this._scene3d.spots = this._spots;
                    this._mapMesh();
                }
            }.bind(this));
        }
    },

    /**
     * Starts loading intensities file.
     */
    loadIntensities: {
        value: function(blob) {
            this._doTask(Workspace.TaskType.LOAD_MEASURES, blob).
                    then(function(result) {
                this._spots = result.spots;
                this._measures = result.measures;
                this._activeMeasure = null;
                if (this._mode == Workspace.Mode.MODE_3D) {
                    this._scene3d.spots = this._spots;
                    this._mapMesh();
                } else if (this._mode == Workspace.Mode.MODE_2D) {
                    this._scene2d.spots = this._spots;
                }
                this._notify(Workspace.Events.INTENSITIES_CHANGE);
            }.bind(this));
        }
    },

    download: {
        value: function(fileNames) {
            if (!fileNames) return;

            fileNames = fileNames.filter(function(name) { return name != ''; });
            if (!fileNames.length) return;

            this._doTask(Workspace.TaskType.DOWNLOAD, fileNames).
                    then(function(result) {
                for (var i = 0; i < result.items.length; i++) {
                    var blob = result.items[i].blob;
                    switch (blob.type) {
                        case 'application/vnd.ms-excel':
                        case 'text/csv':
                            this.loadIntensities(blob);
                            break;

                        case 'image/jpeg':
                        case 'image/png':
                            this.loadImage(blob);
                            break;

                        default: {
                            var fileName = result.items[i].fileName;
                            if (/\.stl$/i.test(fileName)) {
                                this.loadMesh(blob);
                            } else {
                                console.info('Unrecognized file type: ' + fileName +
                                             ' (' + blob.type + ')');
                            }
                        }
                    }
                }
            }.bind(this));
        }
    },

    /*
     * @param {index} Index in the this.measures list.
     */
    selectMap: {
        value: function(index) {
            if (!this._measures) return;

            this._activeMeasure = this._measures[index];
            if (this._autoMinMax) this._updateMinMaxValues();
            this._updateIntensities();
        }
    },

    mapName: {
        get: function() {
            return this._activeMeasure ? this._activeMeasure.name : '';
        }
    },

    autoMinMax: {
        get: function() {
            return this._autoMinMax;
        },

        set: function(value) {
            this._autoMinMax = !!value;
            if (this._autoMinMax) {
                this._updateMinMaxValues() && this._updateIntensities();
            }
            this._notify(Workspace.Events.AUTO_MAPPING_CHANGE);
        }
    },

    minValue: {
        get: function() {
            return this._minValue;
        },

        set: function(value) {
            if (this._autoMinMax) return;
            this._minValue = Number(value);
            this._updateIntensities();
            this._notify(Workspace.Events.MAPPING_CHANGE);
        }
    },

    maxValue: {
        get: function() {
            return this._maxValue;
        },

        set: function(value) {
            if (this._autoMinMax) return;
            this._maxValue = Number(value);
            this._updateIntensities();
            this._notify(Workspace.Events.MAPPING_CHANGE);
        }
    },

    errors: {
        get: function() {
            return this._errors;
        }
    },

    clearErrors: {
        value: function() {
            this._errors = [];
            this._notify(Workspace.Events.ERRORS_CHANGE);
        }
    },

    _addError: {
        value: function(message) {
            this._errors.push(message);
            this._notify(Workspace.Events.ERRORS_CHANGE);
        }
    },

    /**
     * Prepares this._mapping for fast recoloring the mesh.
     */
    _mapMesh: {
        value: function() {
            if (!this._scene3d.geometry || !this._spots) return;
            var args = {
                verteces: this._scene3d.geometry.getAttribute('position').array,
                spots: this._spots
            };
            this._doTask(Workspace.TaskType.MAP, args).then(function(results) {
                this._scene3d.mapping = {
                        closestSpotIndeces: results.closestSpotIndeces,
                        closestSpotDistances: results.closestSpotDistances
                };
            }.bind(this));
        }
    },

    _cancelTask: {
        value: function(taskType) {
            if (taskType.key in this._tasks) {
                this._tasks[taskType.key].worker.terminate();
                delete this._tasks[taskType.key];
            }
        }
    },

    /**
     * Starts a new task (cancels an old one it it's running).
     *
     * @param {Workspace.TaskType} taskType Task to run.
     * @param {Object} args Arguments to post to the task's worker.
     * @return {Promise}
     **/
    _doTask: {
        value: function(taskType, args) {
            if (taskType.key in this._tasks) this._cancelTask(taskType);

            var task = {
                worker: typeof taskType.worker == 'function' ?
                        new taskType.worker() :
                        new Worker('js/workers/' + taskType.worker),
                status: '',
                cancel: this._cancelTask.bind(this, taskType),
                startTime: new Date().valueOf(),
            };
            this._tasks[taskType.key] = task;
            var setStatus = this._setStatus.bind(this);
            var addError = this._addError.bind(this);

            task.worker.postMessage(args);
            return new Promise(function(resolve, reject) {
                task.worker.onmessage = function(event) {
                    if (event.data.status == 'completed') {
                        setStatus('');
                        resolve(event.data);
                        task.cancel();
                        console.info('Task ' + taskType.key + ' completed in ' +
                                     (new Date().valueOf() - task.startTime) /
                                     1000 + ' sec');
                    } else if (event.data.status == 'failed') {
                        reject(event.data);
                        task.cancel();
                        setStatus('');
                        addError('Operation failed: ' + event.data.message);
                    } else if (event.data.status == 'working') {
                        setStatus(event.data.message);
                    }
                };
                task.worker.onerror = function(event) {
                    setStatus('');
                    addError('Operation failed. See log for details.');
                }.bind(this);
            }.bind(this));
        }
    },

    _updateMinMaxValues: {
        value: function() {
            var values =  this._activeMeasure ? this._activeMeasure.values : [];

            var values = Array.prototype.filter.call(values, this._scale.filter).sort(function(a, b) {
                return a - b;
            });

            var minValue = values.length > 0 ? this._scale.function(values[0]) : 0.0;
            var maxValue = values.length > 0 ?
                    this._scale.function(values[Math.ceil((values.length - 1) *
                           this._hotspotQuantile)]) :
                    0.0;

            if (this._minValue != minValue || this._maxValue != maxValue) {
                this._minValue = minValue;
                this._maxValue = maxValue;
                this._notify(Workspace.Events.AUTO_MAPPING_CHANGE);
                this._notify(Workspace.Events.MAPPING_CHANGE);
                return true;
            } else {
                return false;
            }
        }
    },

    _updateIntensities: {
        value: function() {
            if (!this._spots) return;

            for (var i = 0; i < this._spots.length; i++) {
                var scaledValue = this._activeMeasure &&
                        this._scale.function(this._activeMeasure.values[i]);
                var intensity = NaN;

                if (scaledValue >= this._maxValue) {
                    intensity = 1.0;
                } else if (scaledValue >= this._minValue) {
                    intensity = (scaledValue - this._minValue) / (this._maxValue - this._minValue);
                }
                this._spots[i].intensity = intensity;
            }
            this._scene3d.updateIntensities(this._spots);
            this._scene2d.updateIntensities(this._spots);
        }
    },

    _setStatus: {
        value: function(status) {
            this._status = status;
            this._notify(Workspace.Events.STATUS_CHANGE);
        }
    },

    mode: {
        get: function() {
            return this._mode;
        },

        set: function(value) {
            if (this._mode == value) return;
            this._mode = value;

            if (this._mode == Workspace.Mode.MODE_2D) {
                this._scene2d.spots = this._spots;
            }
            if (this._mode != Workspace.Mode.MODE_2D) {
                this._scene2d.resetImage();
                this._scene2d.spots = null;
                this._cancelTask(Workspace.TaskType.LOAD_IMAGE);
            }
            if (this._mode == Workspace.Mode.MODE_3D) {
                this._scene3d.spots = this._spots;
            }
            if (this._mode != Workspace.Mode.MODE_3D) {
                this._scene3d.geometry = null;
                this._scene3d.spots = null;
                this._cancelTask(Workspace.TaskType.LOAD_MESH);
            }

            this._notify(Workspace.Events.MODE_CHANGE);
        }
    },

    scene2d: {
        get: function() {
            return this._scene2d;
        }
    },

    scene3d: {
        get: function() {
            return this._scene3d;
        }
    },

    status: {
        get: function() {
            return this._status;
        }
    },

    measures: {
        get: function() {
            return this._measures || [];
        }
    },

    hotspotQuantile: {
        get: function() {
            return this._hotspotQuantile;
        },

        set: function(value) {
            if (this._hotspotQuantile == value) return;
            if (value < 0.0) value = 0.0;
            if (value > 1.0) value = 1.0;
            this._hotspotQuantile = value;
            if (this._autoMinMax) {
                this._updateMinMaxValues() && this._updateIntensities();
            }
        }
    },

    spotBorder: {
        get: function() {
            return this._spotBorder;
        },

        set: function(value) {
            if (this._spotBorder == value) return;
            if (value < 0.0) value = 0.0;
            if (value > 1.0) value = 1.0;
            this._spotBorder = value;
            this._recolor();
        }
    },

    scale: {
        get: function() {
            return this._scale;
        }
    },

    scaleId: {
        get: function() {
            return this._scale.id;
        },

        set: function(value) {
            if (this._scale.id == value) return;
            this._scale = Workspace.getScaleById(value);
            if (this._autoMinMax) this._updateMinMaxValues();
            this._updateIntensities();
            this._notify(Workspace.Events.MAPPING_CHANGE);
        }
    },

    colorMap: {
        get: function() {
            return this._colorMap;
        }
    },

    colorMapId: {
        get: function() {
            for (var i in ColorMap.Maps) {
                if (this._colorMap === ColorMap.Maps[i]) return i;
            }

        },

        set: function(value) {
            if (value in ColorMap.Maps) {
                this._colorMap = ColorMap.Maps[value];
                this._scene2d.colorMap = this._colorMap;
                this._scene3d.colorMap = this._colorMap;
                this._notify(Workspace.Events.MAPPING_CHANGE);
            }
        }
    }
});

/**
 * Worker-like object what loads an image and calculate it sizes
 * (can't be a worker because uses Image).
 */
Workspace.ImageLoader = function() {
    this.onmessage = null;
    this._reader = new FileReader();
    this._reader.onload = this._onFileLoad.bind(this);
    this._reader.onerror = this._onError.bind(this);
    this._image = new Image();
    this._image.onload = this._onImageLoad.bind(this);
    this._image.onerror = this._onError.bind(this);
    this._terminated = false;
    this._url = null;
    this._fileType = null;
};

Workspace.TaskType.LOAD_IMAGE.worker = Workspace.ImageLoader;

Workspace.ImageLoader.prototype = {
    terminate: function() {
        this._terminated = true;
        if (this._reader.readyState == 1) {
            this._reader.abort();
        }
        if (this._url) {
            URL.revokeObjectURL(this._url);
            this._url = null;
        }
    },

    postMessage: function(blob) {
        this._fileType = blob.type;
        this._reader.readAsArrayBuffer(blob);
    },

    _send: function(message) {
        if (!this._terminated && this.onmessage)
            this.onmessage({data: message});
    },

    _onFileLoad: function(event) {
        var blob = new Blob([event.target.result], {type: this._fileType});
        this._url = URL.createObjectURL(blob);
        this._image.src = this._url;
    },

    _onImageLoad: function(event) {
        var url = this._url;
        this._url = null; // Ownership transfered.
        this._send({
                status: 'completed',
                url: url,
                width: this._image.width,
                height: this._image.height
        });
    },

    _onError: function(event) {
        console.info('Failure loading image', event);
        this._send({
                status: 'failed',
                message: 'Can not read image. See log for details.',
        });
    },
};
