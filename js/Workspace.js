'use strict';

define([
    'colormaps', 'eventsource', 'imageloader', 'inputfilesprocessor', 'materialloader',
    'scene2d', 'scene3d', 'spotscontroller', 'three'
],
function (ColorMap, EventSource, ImageLoader, InputFilesProcessor, MaterialLoader,
    Scene2D, Scene3D, SpotsController, THREE)
{
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
     */
    function Workspace(spotsController) {
        EventSource.call(this, Workspace.Events);

        this._mode = Workspace.Mode.UNDEFINED;
        this._errors = [];
        this._spotsController = spotsController;
        this._scene3d = new Scene3D(spotsController);
        this._scene2d = new Scene2D(spotsController);
        this._loadedSettings = null;
        this._inputFilesProcessor = new InputFilesProcessor(this);

        this._status = '';
        this._tasks = {};
        this._settingsToLoad = null;

        this._spotsController.addEventListener(SpotsController.Events.SCALE_CHANGE, this._onSpotScaleChange.bind(this));
    }

    Workspace.Events = {
        STATUS_CHANGE: 'status-change',
        MODE_CHANGE: 'mode-change',
        ERRORS_CHANGE: 'errors-change',
        SETTINGS_CHANGE: 'settings-change'
    };

    Workspace.Mode = {
        UNDEFINED: 1,
        MODE_2D: 2,
        MODE_3D: 3,
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
            worker: ImageLoader
        },

        LOAD_MESH: {
            key: 'load-mesh',
            worker: 'MeshLoader.js'
        },

        LOAD_MATERIAL: {
            key: 'load-material',
            worker: MaterialLoader
        },

        LOAD_MEASURES: {
            key: 'load-measures',
            worker: 'MeasuresLoader.js'
        },

        LOAD_SETTINGS: {
            key: 'load-settings',
            worker: 'SettingsLoader.js'
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
                this._doTask(Workspace.TaskType.LOAD_IMAGE, blob[0]).
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

                this._doTask(Workspace.TaskType.LOAD_MESH, blob[0]).then(function(result) {
                    var geometry = new THREE.BufferGeometry();
                    for (var name in result.attributes.geometry) {
                        var attribute = result.attributes.geometry[name];
                        geometry.addAttribute(name, new THREE.BufferAttribute(attribute.array, attribute.itemSize));
                    }
                    this._scene3d.materialName = result.attributes.materialName;
                    this._scene3d.geometry = geometry;
                    if (this._spotsController.spots) {
                        this._mapMesh(Scene3D.RecoloringMode.USE_COLORMAP);
                    }
                }.bind(this));
            }
        },

        loadMaterial: {
            value: function (blob) {
                this.mode = Workspace.Mode.MODE_3D;

                this._doTask(Workspace.TaskType.LOAD_MATERIAL, blob).then(function (result) {
                    this._scene3d.materials = result.materials;
                }.bind(this));
            }
        },

        /**
         * Starts loading intensities file.
         */
        loadIntensities: {
            value: function(blob) {
                this._doTask(Workspace.TaskType.LOAD_MEASURES, blob[0]).
                    then(function (result) {
                        this._spotsController.spots = result.spots;
                        this._spotsController.measures = result.measures;

                        if (this._mode == Workspace.Mode.MODE_3D) {
                            this._mapMesh(Scene3D.RecoloringMode.USE_COLORMAP);
                        }
                    }.bind(this));
            }
        },

        loadSettings: {
            value: function (blob) {
                this._settingsToLoad = blob[0];
                this._loadPendingSettings();
            }
        },

        loadFiles: {
            value: function(files) {
                this._inputFilesProcessor.process(files);
            }
        },

        download: {
            value: function(fileNames) {
                if (!fileNames) return;

                fileNames = fileNames.filter(function(name) {
                    return name != '';
                });
                if (!fileNames.length) {
                    return;
                }

                this._doTask(Workspace.TaskType.DOWNLOAD, fileNames).
                    then(function (result) {
                        this.loadFiles(result.items);
                    }.bind(this));
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
            value: function(recoloringMode) {
                if (!this._scene3d.geometry || !this._spotsController.spots) {
                    return;
                }
                var args = {
                    vertices: this._scene3d.geometry.getAttribute('position').array,
                    spots: this._spotsController.spots,
                    scale: this._spotsController.globalSpotScale
                };
                this._doTask(Workspace.TaskType.MAP, args).then(function(results) {
                    this._scene3d.mapping = {
                        closestSpotIndeces: results.closestSpotIndeces,
                        closestSpotDistances: results.closestSpotDistances,
                        recoloringMode: recoloringMode
                    };
                }.bind(this));
            }
        },

        _cancelTask: {
            value: function(taskType) {
                if (taskType.key in this._tasks) {
                    this._tasks[taskType.key].worker.onerror = null;
                    this._tasks[taskType.key].worker.terminate();
                    delete this._tasks[taskType.key];
                }
                if (Object.keys(this._tasks).length < 1) {
                    this._loadPendingSettings();
                }
            }
        },

        _loadPendingSettings: {
            value: function () {
                if (Object.keys(this._tasks).length < 1 && this._settingsToLoad !== null) {
                    this._doTask(Workspace.TaskType.LOAD_SETTINGS, this._settingsToLoad).
                        then(function (result) {
                            this._loadedSettings = result.settings;
                            this._notify(Workspace.Events.SETTINGS_CHANGE);
                        }.bind(this));
                    this._settingsToLoad = null;
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
                        new Worker(require.toUrl('js/workers/' + taskType.worker)),
                    status: '',
                    cancel: this._cancelTask.bind(this, taskType),
                    startTime: new Date().valueOf(),
                };
                this._tasks[taskType.key] = task;
                var setStatus = this._setStatus.bind(this);
                var addError = this._addError.bind(this);

                if (typeof taskType.worker == 'function') {
                    task.worker.postMessage(args);
                }
                return new Promise(function(resolve, reject) {
                    task.worker.onmessage = function(event) {
                        switch (event.data.status) {
                            case 'completed':
                                setStatus('');
                                resolve(event.data);
                                task.cancel();
                                console.info('Task ' + taskType.key + ' completed in ' +
                                    (new Date().valueOf() - task.startTime) /
                                    1000 + ' sec');
                                break;
                            case 'failed':
                                reject(event.data);
                                task.cancel();
                                setStatus('');
                                addError('Operation failed: ' + event.data.message);
                                break;
                            case 'working':
                                setStatus(event.data.message);
                                break;
                            case 'ready':
                                this.postMessage(args);
                                break;
                        };
                    };
                    task.worker.onerror = function(event) {
                        setStatus('');
                        addError('Operation failed. See log for details.');
                    }.bind(this);
                }.bind(this));
            }
        },

        _setStatus: {
            value: function(status) {
                this._status = status;
                this._notify(Workspace.Events.STATUS_CHANGE);
            }
        },

        _onSpotScaleChange: {
            value: function () {
                if (this.mode == Workspace.Mode.MODE_3D) {
                    this._mapMesh(Scene3D.RecoloringMode.NO_COLORMAP);
                }
            }
        },

        mode: {
            get: function() {
                return this._mode;
            },

            set: function(value) {
                if (this._mode == value) {
                    return;
                }
                this._mode = value;

                if (this._mode == Workspace.Mode.MODE_3D) {
                    this._scene2d.resetImage();
                    this._cancelTask(Workspace.TaskType.LOAD_IMAGE);
                }
                if (this._mode == Workspace.Mode.MODE_2D) {
                    this._scene3d.geometry = null;
                    this._cancelTask(Workspace.TaskType.LOAD_MESH);
                }

                this._notify(Workspace.Events.MODE_CHANGE);
            }
        },

        spotsController: {
            get: function () {
                return this._spotsController;
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

        loadedSettings: {
            get: function () {
                return this._loadedSettings;
            }
        }
    });

    return Workspace;
});
