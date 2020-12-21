'use strict';

define([
    'eventsource', 'volumespotscontroller', 'three', 'utils'
],
function(EventSource, SpotsController, THREE, Utils) {
    function Scene3D(spotsController) {
        EventSource.call(this, Scene3D.Events);

        this._spotsController = spotsController;
        this._scene = new THREE.Scene();

        this._meshContainer = new THREE.Object3D();
        this._backgroundColor = new THREE.Color('black');
        this._opacity = 1;
        this._filling = 0.5;
        this._shadingEnabled = false;
        this._spacing = 1;

        this._slicing = { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
        this.slicing = Utils.makeProxyProperty(this, '_slicing', ['minX', 'maxX', 'minY', 'maxY', 'minZ', 'maxZ'],
            function() {
                // TODO:
                if (this._mesh) {
                    this._applySlicing();
                    this._notify(Scene3D.Events.CHANGE);
                }
            }),

        this._light = { ambient: 0.3, diffuse: 0.6, specular: 0.3 };
        this.light = Utils.makeProxyProperty(this, '_light', ['ambient', 'diffuse', 'specular'],
            function() {
                // TODO:
                if (this._mesh) {
                    
                    this._notify(Scene3D.Events.CHANGE);
                }
            }),

        this._mapping = null;

        this._scene.add(this._meshContainer);

        this._spotsController.addEventListener(SpotsController.Events.SPOTS_CHANGE, this._onSpotsChange.bind(this));
        this._spotsController.addEventListener(SpotsController.Events.ATTR_CHANGE, this._onGeometryColorChange.bind(this));
        this._spotsController.addEventListener(SpotsController.Events.INTENSITIES_CHANGE, this._onIntensitiesChange.bind(this));
        this._spotsController.addEventListener(SpotsController.Events.MAPPING_CHANGE, this._onIntensitiesChange.bind(this));
    };

    Scene3D.Events = {
        CHANGE: 'change',
    };

    Scene3D.RecoloringMode = {
        USE_COLORMAP: 'colormap',
        NO_COLORMAP: 'no-colormap'
    };

    Scene3D._makeLightProperty = function(field) {
        return Scene3D._makeProxyProperty(field, ['intensity'], function() {
            this._notify(Scene3D.Events.CHANGE);
        });
    };

    Scene3D.prototype = Object.create(EventSource.prototype, {
        clone: {
            value: function(eventName, listener) {
                var result = new Scene3D(this._spotsController);
                result.frontLight = this.frontLight;
                result.color = this.color;
                result.backgroundColor = this.backgroundColor;
                result.slicing = this.slicing;
                result._meshMaterialName = this._meshMaterialName;
                result._meshMaterials = this._meshMaterials.map(function (m) { return m.clone(); });
                result.geometry = this.geometry.clone();
                result.mapping = this.mapping;
                result.axisHelper = this.axisHelper;
                return result;
            }
        },

        _onGeometryColorChange: {
            value: function() {

            }
        },

        opacity: {
            get: function() {
                return this._opacity;
            },
            set: function(value) {
                this._opacity = value;
            }
        },

        filling: {
            get: function() {
                return this._filling;
            },
            set: function(value) {
                this._filling = value;
            }
        },

        spacing: {
            get: function() {
                return this._spacing;
            },
            set: function(value) {
                this._spacing = value;
            }
        },

        shadingEnabled: {
            get: function() {
                return this._shadingEnabled;
            },
            set: function(value) {
                this._shadingEnabled = value;
            }
        },

        backgroundColor: {
            get: function() {
                return '#' + this._backgroundColor.getHexString();
            },

            set: function(value) {
                var color = new THREE.Color(value);
                if (!color.equals(this._backgroundColor)) {
                    this._backgroundColor.set(color);
                    this._notify(Scene3D.Events.CHANGE);
                }
            }
        },

        backgroundColorValue: {
            get: function() {
                return this._backgroundColor;
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
                return this._mesh ? this._mesh.geometry : null;
            },

            set: function(geometry) {
                if (!this._mesh && !geometry) return;
                if (this._mesh) this._meshContainer.remove(this._mesh);
                this._mapping = null;
                if (geometry) {
                    geometry.computeBoundingBox();
                    this._mesh = new THREE.Mesh(geometry, this._getMeshMaterial(this._meshMaterialName));
                    this._meshScaleFactor = this._MAX_MESH_SIZE / geometry.boundingBox.getSize().length();
                    // bounding box is invalid after the scaling below. Needs to be recomputed for further use
                    this._mesh.scale.set(this._meshScaleFactor, this._meshScaleFactor, this._meshScaleFactor);
                    this._mesh.position.copy(geometry.boundingBox.getCenter().negate().multiplyScalar(this._meshScaleFactor));
                    this._meshContainer.add(this._mesh);
                    this._applySlicing();
                    this._recolor();
                } else {
                    this._mesh = null;
                }
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        position: {
            get: function() {
                return this._scene.position.clone();
            }
        },

        render: {
            value: function(renderer, camera) {
                this._frontLight.position.set(camera.position.x, camera.position.y, camera.position.z);
                renderer.render(this._scene, camera);
            }
        },

        _applySlicing: {
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
