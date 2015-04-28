'use strict';

/**
 * Main application model. It works in 3 modes:
 * 1. UNDEFINED. In may have measures but with no visual representation.
 * 2. MODE_2D. It has image. Spots are mapped on this image using X and Y
 *    coordinates (Z ignored). It can buildSVG which represents the image and
 *    the spots (must be rebuild on '2d-scene-change'). If ony spots colors
 *    changed then the '2d-scene-needs-recoloring' event fires and previously
 *    built SVG could be updated via recolorSVG (faster than rebuilding SVG
 *    from the ground).
 * 3. MODE_3D. It has a THREE.js scene with a mesh, light souces ets.
 *    Canvas must be redrawn then '3d-scene-change' fired.
 *
 * Model tracks changes in measures, images and meshes and fires appropriates
 * events to allow updates. Model may have multiple views (2D and 3D view
 * shouldn't be mixed). Different 3D view for instance may show the same scene
 * from different perspectives.
 *
 * 'status'/'status-change' intended to inform
 * the user on progress in long-running tasks.
 *
 * 'measures'/'intensities-change' lets to update the map-list.
 */
function Model() {
    this._listeners = {
        'status-change': [],
        'mode-change': [],
        '2d-scene-change': [],
        '2d-scene-needs-recoloring': [],
        '3d-scene-change': [],
        'intensities-change': [],
    };
    this._mode = Model.Mode.UNDEFINED;
    this._mesh = null;
    this._spots = null;
    this._mapping = null;
    this._measures = null;
    this._image = null;
    this._activeMeasure = null;
    this._color = new THREE.Color('#001eb2');
    this._backgroundColor = new THREE.Color('black');
    this._colorMap = new JetColorMap();
    this._scale = Model.Scale.LOG;
    this._hotspotQuantile = 0.995;
    this._spotBorder = 0.05;

    // 3D scene
    this._scene = new THREE.Scene();
    this._material = new THREE.MeshLambertMaterial({
        vertexColors: THREE.VertexColors,
        transparent: true,
        opacity: 0.9,
        shininess: 3,
        shading: THREE.SmoothShading
    });
    this._light1 = new THREE.PointLight(0xffffff, 1, 0);
    this._light1.position.set(-100, 100, 500);
    this._light2 = new THREE.DirectionalLight(0xffffff, 0.8);
    this._light2.position.set(0, 1, 0);
    this._light3 = new THREE.DirectionalLight(0xffffff, 1);
    this._light3.position.set(0, -1, 0);
    this._scene.add(this._light1);
    this._scene.add(this._light2);
    this._scene.add(this._light3);
    this._scene.add(new THREE.AxisHelper(20));

    this._status = '';
    this._tasks = {};
}

Model.Mode = {
    UNDEFINED: '',
    MODE_2D: '2d',
    MODE_3D: '3d',
};

Model.Scale = {
    LOG: {
        id: 'log',
        function: Math.log,
    },

    LINEAR: {
        id: 'linear',
        function: function(x) {
            return x;
        }
    }
};

Model.getScaleById = function(id) {
    for (var i in Model.Scale) {
        if (Model.Scale[i].id == id) return Model.Scale[i];
    }
    throw 'Invalid scale id: ' + id;
};

/**
 * Asynchromous tasks. At most one task with the same key may run
 * (no 2 images could be loading simultaniously). Newer task cancels older one.
 * 'worker' is name of JS file in 'js/workers' or constructor of a Worker-like
 * class.
 */
Model.TaskType = {
    LOAD_IMAGE: {
        key: 'load-image',
        worker: null // Model.ImageLoader
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

Model.prototype = Object.create(null, {
    addEventListener: {
        value: function(eventName, listener) {
            this._listeners[eventName].push(listener);
        }
    },

    /**
     * Switches the model to MODE_2D and starts image loading.
     */
    loadImage: {
        value: function(file) {
            this.mode = Model.Mode.MODE_2D;

            this._setImage(null);
            this._doTask(Model.TaskType.LOAD_IMAGE, file).
                    then(function(result) {
                this._setImage(result.url, result.width, result.height);
            }.bind(this));
        }
    },

    /**
     * Switches the model to MODE_3D and starts mesh loading.
     */
    loadMesh: {
        value: function(file) {
            this.mode = Model.Mode.MODE_3D;

            this.mesh = null;
            this._doTask(Model.TaskType.LOAD_MESH, file).then(function(result) {
                var geometry = new THREE.BufferGeometry();
                for (var name in event.data.attributes) {
                    var attribute = event.data.attributes[name];
                    geometry.addAttribute(name, new THREE.BufferAttribute(
                            attribute.array, attribute.itemSize));
                }
                this._recolorGeometry(geometry, null, null);
                this.mesh = new THREE.Mesh(geometry, this._material);
                this._mapMesh();
            }.bind(this));
        }
    },

    /**
     * Starts loading intensities file.
     */
    loadIntensities: {
        value: function(file) {
            this._doTask(Model.TaskType.LOAD_MEASURES, file).
                    then(function(result) {
                this._spots = result.spots;
                this._measures = result.measures;
                this._activeMeasure = null;
                if (this._mode == Model.Mode.MODE_3D) {
                    this._mapping = null;
                    this._recolor();
                    this._mapMesh();
                } else if (this._mode == Model.Mode.MODE_2D) {
                    this._notifyChange('2d-scene-change');
                }
                this._notifyChange('intensities-change');
            }.bind(this));
        }
    },

    /*
     * @param {index} Index in the this.measures list.
     */
    selectMeasure: {
        value: function(index) {
            if (!this._measures) return;

            this._activeMeasure = this._measures[index];
            this._updateIntensities();
        }
    },

    /**
     * Build SVG for 2D mode (see Model class description). Since SVG elements
     * couldn't be shared among views each view should build it's own.
     *
     * @return {SVGGElement}
     */
    buildSVG: {
        value: function(document) {
            if (!this._image) return null;
            var SVGNS = 'http://www.w3.org/2000/svg';
            var groupElement = document.createElementNS(SVGNS, 'g');
            var imageElement = document.createElementNS(SVGNS, 'image');
            imageElement.href.baseVal = this._image.url;
            imageElement.width.baseVal.value = this._image.width;
            imageElement.height.baseVal.value = this._image.height;
            groupElement.appendChild(imageElement);

            var defsElement = document.createElementNS(SVGNS, 'defs');
            groupElement.appendChild(defsElement);

            var spotsGroupElement = document.createElementNS(SVGNS, 'g');
            var labelsGroupElement = document.createElementNS(SVGNS, 'g');
            groupElement.appendChild(spotsGroupElement);
            groupElement.appendChild(labelsGroupElement);

            if (this._spots) {
                this._createSVGSpots(
                        spotsGroupElement, labelsGroupElement, defsElement);
                this.recolorSVG(groupElement);
            }

            return groupElement;
        }
    },

    /**
     * Updates SVG to reflect current colors.
     *
     * @param {SVGGElement} Element previously built by 'buildSVG'.
     */
    recolorSVG: {
        value: function(svg) {
            var startTime = new Date();

            var gradients = svg.getElementsByTagName('radialGradient');
            var intensityColor = new THREE.Color();
            for (var i = 0; i < gradients.length; i++) {
                var g = gradients[i];
                var stop0 = gradients[i].children[0];
                var stop1 = gradients[i].children[1];

                var spot = this._spots[i];
                if (spot && !isNaN(spot.intensity)) {
                    this._colorMap.map(intensityColor, spot.intensity);
                    stop0.style.stopColor = stop1.style.stopColor =
                            intensityColor.getStyle();
                    stop0.style.stopOpacity = 1.0;
                    stop1.style.stopOpacity = this._spotBorder;
                } else {
                    stop0.style.stopColor = stop1.style.stopColor = '';
                    stop0.style.stopOpacity = stop1.style.stopOpacity = 0;
                }
            }

            var endTime = new Date();
            console.log('Recoloring time: ' +
                    (endTime.valueOf() - startTime.valueOf()) / 1000);
        }
    },

    /**
     * Prepares this._mapping for fast recoloring the mesh.
     */
    _mapMesh: {
        value: function() {
            if (!this._mesh || !this._spots) return;
            var args = {
                verteces: this._mesh.geometry.getAttribute(
                        'original-position').array,
                spots: this._spots
            };
            this._doTask(Model.TaskType.MAP, args).then(function(results) {
                this._mapping = {
                        closestSpotIndeces: event.data.closestSpotIndeces,
                        closestSpotDistances: event.data.closestSpotDistances
                };
                this._recolor();
                this._mapper = null;
            }.bind(this));
        }
    },

    _createSVGSpots: {
        value: function(spotsGrpupElement, lablesGroupElement, defsElement) {
            var SVGNS = 'http://www.w3.org/2000/svg';

            var document = spotsGrpupElement.ownerDocument;

            for (var i = 0; i < this._spots.length; i++) {
                var spot = this._spots[i];

                var gradientElement = document.createElementNS(
                    SVGNS, 'radialGradient');
                gradientElement.cx.baseVal = "50%";
                gradientElement.cy.baseVal = "50%";
                gradientElement.r.baseVal = "50%";
                gradientElement.fx.baseVal = "50%";
                gradientElement.fy.baseVal = "50%";
                gradientElement.id = "spot" + i;

                gradientElement.innerHTML = '<stop offset="0%" />' +
                                            '<stop offset="100%" />';
                defsElement.appendChild(gradientElement);

                var spotElement = document.createElementNS(SVGNS, 'ellipse');
                spotElement.rx.baseVal.value = spot.r;
                spotElement.ry.baseVal.value = spot.r;
                spotElement.cx.baseVal.value = spot.x;
                spotElement.cy.baseVal.value = spot.y;
                spotElement.style.fill = 'url(#spot' + i + ')';
                spotsGrpupElement.appendChild(spotElement);

                var labelElement = document.createElementNS(SVGNS, 'text');
                labelElement.textContent = spot.name;
                labelElement.setAttribute('x', spot.x + 5);
                labelElement.setAttribute('y', spot.y);
                lablesGroupElement.appendChild(labelElement);
            }
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
     * @param {Model.TaskType} taskType Task to run.
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
                        alert('Operation failed: ' + event.message);
                    } else if (event.data.status == 'working') {
                        setStatus(event.data.message);
                    }
                };
                task.worker.onerror = function(event) {
                    alert('Operation failed. See log for details.');
                };
            });
        }
    },

    _setImage: {
        value: function(url, width, height) {
            if (this._image) {
                URL.revokeObjectURL(this._image.url);
            }
            if (url) {
                this._image = {
                    url: url,
                    width: width,
                    height: height,
                };
            } else {
                this._image = null;
            }
            this._notifyChange('2d-scene-change');
        }
    },

    _updateIntensities: {
        value: function() {
            if (!this._activeMeasure || !this._spots) return;

            function compareNumbers(a, b) {
                return a - b;
            }

            // Apply the scale function.
            var values = Array.prototype.slice.call(
                    this._activeMeasure.values, 0, this._spots.length);
            values = values.map(this._scale.function);

            // Make a copy without NaNs and inifinities. Sort it.
            var sorted = values.filter(function(x) {
                return x > -Infinity && x < Infinity;
            }).sort(compareNumbers);
            var min = sorted.length > 0 ? sorted[0] : NaN;
            var max = sorted.length > 0 ?
                    sorted[Math.ceil((sorted.length - 1) *
                           this._hotspotQuantile)] :
                    NaN;

            for (var i = 0; i < values.length; i++) {
                var v = values[i];
                this._spots[i].intensity = isNaN(v) || v == -Infinity ?
                        NaN : Math.min(1.0, (v - min) / (max - min));
            }
            this._recolor();
        }
    },

    _recolor: {
        value: function() {
            if (this._mode == Model.Mode.MODE_3D && this._mesh) {
                this._recolorGeometry(
                        this._mesh.geometry, this._mapping, this._spots);
                this._notifyChange('3d-scene-change');
            } else if (this._mode == Model.Mode.MODE_2D) {
                this._notifyChange('2d-scene-needs-recoloring');
            }
        }
    },

    _recolorGeometry: {
        value: function(geometry, mapping, spots) {
            if (!geometry) return;

            var startTime = new Date();

            var position = geometry.getAttribute('position');
            var positionCount = position.array.length / position.itemSize;

            var intensityColor = new THREE.Color();
            var currentColor = new THREE.Color();

            if (!geometry.getAttribute('color')) {
                geometry.addAttribute('color', new THREE.BufferAttribute(
                        new Float32Array(positionCount * 3), 3));
            }
            var color = geometry.getAttribute('color').array;

            for (var i = 0; i < positionCount; i++) {
                var index = mapping ? mapping.closestSpotIndeces[i] : -1;
                currentColor.set(this._color);
                if (index >= 0 && !isNaN(spots[index].intensity)) {
                    this._colorMap.map(
                            intensityColor, spots[index].intensity);
                    var alpha = 1.0 - (1.0 - this._spotBorder) *
                            mapping.closestSpotDistances[i];
                    alpha = alpha;
                    currentColor.lerp(intensityColor, alpha);
                }

                color[i * 3] = currentColor.r;
                color[i * 3 + 1] = currentColor.g;
                color[i * 3 + 2] = currentColor.b;
            }

            geometry.getAttribute('color').needsUpdate = true;

            var endTime = new Date();
            console.log('Recoloring time: ' +
                    (endTime.valueOf() - startTime.valueOf()) / 1000);
        }
    },

    _setStatus: {
        value: function(status) {
            this._status = status;
            this._notifyChange('status-change');
        }
    },

    _notifyChange: {
        value: function(eventName) {
            var listeners = this._listeners[eventName];
            for (var i = 0; i < listeners.length; i++) {
                listeners[i]();
            }
        }
    },

    mode: {
        get: function() {
            return this._mode;
        },

        set: function(value) {
            if (this._mode == value) return;
            this._mode = value;

            if (this._mode != Model.Mode.MODE_2D) {
                this._setImage(null);
                this._cancelTask(Model.TaskType.LOAD_IMAGE);
            }
            if (this._mode != Model.Mode.MODE_3D) {
                this.mesh = null;
                this._cancelTask(Model.TaskType.LOAD_MESH);
            }

            this._notifyChange('mode-change');
        }
    },

    color: {
        get: function() {
            return '#' + this._color.getHexString();
        },

        set: function(value) {
            var color = new THREE.Color(value);
            if (color.equals(this._color)) return;
            this._color.set(color);
            if (this._mesh) this._recolor();
        }
    },

    backgroundColor: {
        get: function() {
            return '#' + this._backgroundColor.getHexString();
        },

        set: function(value) {
            var color = new THREE.Color(value);
            if (color.equals(this._backgroundColor)) return;
            this._backgroundColor.set(color);
            if (this._mode == Model.Mode.MODE_3D) {
                this._notifyChange('3d-scene-change');
            }
        }
    },

    backgroundColorValue: {
        get: function() {
            return this._backgroundColor;
        }
    },

    scene: {
        get: function() {
            return this._scene;
        }
    },

    mesh: {
        get: function() {
            return this._mesh;
        },

        set: function(value) {
            if (this._mesh === value) return;
            if (this._mesh) this._scene.remove(this._mesh);
            if (value) this._scene.add(value);
            this._mesh = value;
            this._notifyChange('3d-scene-change');
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

    imageSize: {
        get: function() {
            return this._image && {
                width: this._image.width,
                height: this._image.height
            };
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
            this._updateIntensities();
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

    scaleId: {
        get: function() {
            return this._scale.id;
        },

        set: function(value) {
            if (this._scale.id == value) return;
            this._scale = Model.getScaleById(value);
            this._updateIntensities();
        }
    },

    lightIntensity1: {
        get: function() {
            return this._light1.intensity;
        },

        set: function(value) {
            this._light1.intensity = value;
            this._notifyChange('3d-scene-change');
        }
    },

    lightIntensity2: {
        get: function() {
            return this._light2.intensity;
        },

        set: function(value) {
            this._light2.intensity = value;
            this._notifyChange('3d-scene-change');
        }
    },

    lightIntensity3: {
        get: function() {
            return this._light3.intensity;
        },

        set: function(value) {
            return this._light3.intensity = value;
            this._notifyChange('3d-scene-change');
        }
    },

    colorMapGradient: {
        get: function() {
            return this._colorMap.gradient;
        }
    }
});

/**
 * Worker-like object what loads an image and calculate it sizes
 * (can't be a worker because uses Image).
 */
Model.ImageLoader = function() {
    this.onmessage = null;
    this._reader = new FileReader();
    this._reader.onload = this._onFileLoad.bind(this);
    this._image = new Image();
    this._image.onload = this._onImageLoad.bind(this);
    this._terminated = false;
    this._url = null;
    this._fileType = null;
};

Model.TaskType.LOAD_IMAGE.worker = Model.ImageLoader;

Model.ImageLoader.prototype = {
    terminate: function() {
        this._terminated = true;
        this._reader.abort();
        if (this._url) {
            URL.revokeObjectURL(this._url);
            this._url = null;
        }
    },

    postMessage: function(file) {
        this._fileType = file.type;
        this._reader.readAsArrayBuffer(file);
    },

    _send: function(message) {
        if (!this._terminated || this.onmessage)
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
        this._image.src = '';
    },
};
