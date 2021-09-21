'use strict';

define([
    'scene3dbase', 'three', 'utils', 'surfacespotscontroller'
],
function(Scene3DBase, THREE, Utils, SpotsController) {
    function Scene3D(spotsController) {
        Scene3DBase.call(this, spotsController);

        this._frontLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
        this._frontLight1.position.set(0, 0, -1);

        this._frontLight2 = new THREE.DirectionalLight(0xffffff, 1.0);
        this._frontLight2.position.set(0, 0, 1);

        this._mesh = null;
        this._meshScaleFactor = 1.0;
        this._MAX_MESH_SIZE = 80;
        this._color = new THREE.Color('#575757');
        this._backgroundColor = new THREE.Color('black');
        this._meshMaterials = [];
        this._defaultMeshMaterial = new THREE.MeshLambertMaterial({
            transparent: true,
            opacity: 0.9,
            flatShading: true,
            vertexColors: THREE.VertexColors
        });
        // this property should be used to select correct material if mesh contains multiple ones
        this._meshMaterialName = null;

        this._adjustment = { x: 0, y: 0, z: 0, alpha: 0, beta: 0, gamma: 0 };

        this._mapping = null;
        this.lightIntensity = 1.0;

        this._raycastWorker = new Worker(require.toUrl('js/surface/workers/Raycaster.js'));

        this._axisHelper = new THREE.AxesHelper(1);
        this._scene.add(this._axisHelper);
        this._scene.add(this._frontLight1);
        this._scene.add(this._frontLight2);

        this._spotsController.addEventListener(SpotsController.Events.SPOTS_CHANGE, this._onSpotsChange.bind(this));
        this._spotsController.addEventListener(SpotsController.Events.ATTR_CHANGE, this._onAttrChange.bind(this));
        this._spotsController.addEventListener(SpotsController.Events.INTENSITIES_CHANGE, this._onIntensitiesChange.bind(this));
        this._spotsController.addEventListener(SpotsController.Events.MAPPING_CHANGE, this._onMappingChange.bind(this));
    };

    Object.assign(Scene3D, Scene3DBase);

    Scene3D.prototype = Object.create(Scene3DBase.prototype, {

        lightIntensity: {
            get: function() {
                return this._lightIntensity;
            },
            set: function(value) {
                this._lightIntensity = value;
                this._frontLight1.intensity = 1.5 * this._lightIntensity;
                this._frontLight2.intensity = 1.5 * this._lightIntensity;
            }
        },

        getDataBoundingBox: {
            value: function() {
                if (!this._geometry) {
                    return null;
                }
                return this._geometry.boundingBox;
            }
        },

        clone: {
            value: function(eventName, listener) {
                var result = new Scene3D(this._spotsController);
                result.frontLight = this.frontLight;
                result.color = this.color;
                result.backgroundColor = this.backgroundColor;
                result.adjustment = this.adjustment;
                result._meshMaterialName = this._meshMaterialName;
                result._meshMaterials = this._meshMaterials.map(function (m) { return m.clone(); });
                result.geometry = this.geometry.clone();
                result.mapping = this.mapping;
                result.axisHelper = this.axisHelper;
                return result;
            }
        },

        frontLight: Utils.makeProxyProperty('_frontLight', ['intensity'], function() {
            this._notify(Scene3D.Events.CHANGE);
        }),

        color: {
            get: function() {
                return '#' + this._color.getHexString();
            },

            set: function(value) {
                var color = new THREE.Color(value);
                if (!color.equals(this._color)) {
                    this._color.set(color);
                    this._onGeometryColorChange();
                }
            }
        },

        _onMappingChange: {
            value: function() {
                this._onIntensitiesChange();
            }
        },

        _onAttrChange: {
            value: function() {
                if (this._mesh) {
                    this._recolor(Scene3D.RecoloringMode.NO_COLORMAP);
                    this._notify(Scene3D.Events.CHANGE);
                }
            }
        },

        _onSpotsChange: {
            value: function () {
                if (this._mapping) {
                    this._mapping = null; // Mapping is obsolete.
                }
                if (this._mesh) {
                    this._recolor(Scene3D.RecoloringMode.USE_COLORMAP);
                    this._notify(Scene3D.Events.CHANGE);
                }
            }
        },

        axisHelper: {
            get: function() {
                return -1 != this._scene.children.indexOf(this._axisHelper);
            },

            set: function (value) {
                if (value && !this.axisHelper) {
                    this._scene.add(this._axisHelper);
                } else if (!value) {
                    this._scene.remove(this._axisHelper);
                }
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        adjustment: Utils.makeProxyProperty('_adjustment', ['x', 'y', 'z', 'alpha', 'beta', 'gamma'],
            function() {
                if (this._mesh) {
                    this._applyAdjustment();
                    this._notify(Scene3D.Events.CHANGE);
                }
            }),

        refreshSpots: {
            value: function () {
                this._recolor(Scene3D.RecoloringMode.NO_COLORMAP);
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        _onIntensitiesChange: {
            value: function(spots) {
                if (this._mesh && this._mapping) {
                    this._recolor(Scene3D.RecoloringMode.USE_COLORMAP);
                    this._notify(Scene3D.Events.CHANGE);
                }
            }
        },

        mapping: {
            get: function() {
                return this._mapping;
            },

            set: function (value) {
                if (this._mapping === null && value === null) {
                    return;
                }
                if (!this._spotsController.spots) {
                    console.log('Potential programming error: setting mapping with invalid spots data');
                    return;
                }
                this._mapping = {
                    closestSpotIndeces: value.closestSpotIndeces,
                    closestSpotDistances: value.closestSpotDistances,
                };
                if (this._mesh) {
                    this._recolor(value.recoloringMode);
                    this._notify(Scene3D.Events.CHANGE);
                }
            }
        },

        geometry: {
            get: function() {
                return this._geometry;
            },

            set: function(geometry) {
                this._geometry = geometry;
                if (!this._mesh && !geometry) return;
                if (this._mesh) this._meshContainer.remove(this._mesh); 
                this._mapping = null;
                if (geometry) {
                    geometry.computeBoundingBox();
                    this._mesh = new THREE.Mesh(geometry, this._getMeshMaterial(this._meshMaterialName));
                    this._frontLight1.target = this._mesh;
                    this._frontLight2.target = this._mesh;

                    this._axisHelper.scale.copy(geometry.boundingBox.getSize(new THREE.Vector3()));
                    this._axisHelper.position.copy(geometry.boundingBox.min);
                    this._axisHelper.updateMatrix();

                    this._meshScaleFactor = 1.0; 
                    this._meshContainer.add(this._mesh);
                    this._applyAdjustment();
                    this._recolor();
                } else {
                    this._mesh = null;
                }
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        materialName: {
            set: function (materialName) {
                this._meshMaterialName = materialName || null;
            }
        },

        _getMeshMaterial: {
            value: function (materialName) {
                var result = undefined;
                if (materialName) {
                    result = this._meshMaterials.find(function (material) {
                        return material.name === materialName;
                    });
                    if (result) {
                        result.vertexColors = THREE.VertexColors;
                    }
                }
                return result || this._defaultMeshMaterial;
            }
        },

        materials: {
            set: function (materials) {
                this._meshMaterials = materials;
                if (this._mesh && this._meshMaterialName) {
                    this._mesh.material = this._getMeshMaterial(this._meshMaterialName);
                }
            }
        },

        raycast: {
            value: function(raycaster) {
                console.log("raycast");
                if (!this._mesh || !this._spotsController.spots || !this._mapping) {
                    return null;
                }
                var message = {
                    positions: this._mesh.geometry.attributes.position.array,
                    origin: new THREE.Vector3().copy(raycaster.ray.origin),
                    direction: new THREE.Vector3().copy(raycaster.ray.direction),
                    matrixWorld: new THREE.Matrix4().copy(this._mesh.matrixWorld),
                };
                var closestSpotIndeces = this._mapping.closestSpotIndeces;
                var spots = this._spotsController.spots;

                var promise = new Promise(function(accept, reject) {
                    this._raycastWorker.onmessage = function(event) {
                        if (!event.data) {
                            return;
                        }
                        if (event.data.status == 'completed') {
                            var face = event.data;
                            var spotIndex = -1;
                            for (var i in (face || {})) {
                                if (closestSpotIndeces[face[i]] >= 0) {
                                    spotIndex = closestSpotIndeces[face[i]];
                                    break;
                                }
                            }
                            accept(spots[spotIndex]);
                        }
                    };
                    this._raycastWorker.onerror = function(event) {
                        console.log('Raycasting failed', event);
                        reject();
                    };
                }.bind(this));

                Object.defineProperty(promise, 'cancel', {
                    value: function() {
                        // TODO:
                    }
                });

                this._raycastWorker.postMessage(message);

                return promise;
            }
        },
        
        spotToWorld: {
            value: function(spot) {
                if (!this._mesh) {
                    return null;
                }
                var position = new THREE.Vector3(spot.x, spot.y, spot.z);
                position.applyMatrix4(this._mesh.matrixWorld);
                return position;
            }
        },

        _recolor: {
            value: function(recoloringMode) {
                var startTime = new Date();
                var geometry = this.geometry;
                var mapping = this.mapping;
                var spots = this._spotsController.spots;
                var globalSpotsOpacity = this._spotsController.globalSpotOpacity;

                var position = geometry.getAttribute('position');
                var positionCount = position.array.length / position.itemSize;

                if (mapping && recoloringMode === Scene3D.RecoloringMode.USE_COLORMAP) {
                    var colorMap = this._spotsController.colorMap;
                    var currentSpot = null;
                    for (var i = 0; i < spots.length; i++) {
                        currentSpot = spots[i];
                        if (!isNaN(currentSpot.intensity)) {
                            colorMap.map(currentSpot.color, currentSpot.intensity);
                        }
                    }
                }

                if (!geometry.getAttribute('color')) {
                    geometry.setAttribute('color', new THREE.BufferAttribute(
                        new Float32Array(positionCount * 3), 3));
                }
                var color = geometry.getAttribute('color').array;

                // Fill |color| with this._color.
                if (positionCount) {
                    var CHUNK_SIZE = 64;
                    var last = 0;
                    if (positionCount > CHUNK_SIZE) {
                        for (var i = 0; i < CHUNK_SIZE; i++) {
                            this._color.toArray(color, i * 3);
                        }
                        var chunk = new Float32Array(color.buffer, 0, CHUNK_SIZE * 3);
                        for (var i = CHUNK_SIZE; i <= positionCount - CHUNK_SIZE; last = i, i += CHUNK_SIZE) {
                            color.set(chunk, i * 3);
                        }
                    }
                    for (var i = last; i < positionCount; i++) {
                        this._color.toArray(color, i * 3);
                    }
                }

                if (mapping) {
                    var spotBorder = 1.0 - this._spotsController.spotBorder;
                    var closestSpotIndeces = mapping.closestSpotIndeces;
                    var closestSpotDistances = mapping.closestSpotDistances;
                    for (var i = 0; i < positionCount; i++) {
                        var index = closestSpotIndeces[i];
                        if (index >= 0) {
                            var spot = spots[index];
                            if (!isNaN(spot.intensity)) {
                                var alpha = (1.0 - spotBorder * closestSpotDistances[i]) * spot.opacity * globalSpotsOpacity;
                                var base = i * 3;
                                color[base + 0] += (spot.color.r - color[base + 0]) * alpha;
                                color[base + 1] += (spot.color.g - color[base + 1]) * alpha;
                                color[base + 2] += (spot.color.b - color[base + 2]) * alpha;
                            }
                        }
                    }
                }

                geometry.getAttribute('color').needsUpdate = true;

                var endTime = new Date();
                console.log('Recoloring time: ' +
                    (endTime.valueOf() - startTime.valueOf()) / 1000);
            }
        },

        _applyAdjustment: {
            value: function() {
                this._meshContainer.rotation.x = this._adjustment.alpha * Math.PI / 180;
                this._meshContainer.rotation.y = this._adjustment.beta * Math.PI / 180;
                this._meshContainer.rotation.z = this._adjustment.gamma * Math.PI / 180;
                this._meshContainer.position.copy(this._adjustment);
                this._meshContainer.updateMatrix();
            }
        }
    });

    return Scene3D;
});
