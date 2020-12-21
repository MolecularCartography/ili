'use strict';

define([
    'eventsource', 'surfacespotscontroller', 'three', 
],
function(EventSource, SpotsController, THREE) {
    function Scene3DBase(spotsController) {
        EventSource.call(this, Scene3DBase.Events);

        this._spotsController = spotsController;
        this._scene = new THREE.Scene();
        this._meshContainer = new THREE.Object3D();
   
        this._backgroundColor = new THREE.Color('black');
        this._mapping = null;

        this._spotsController.addEventListener(SpotsController.Events.SPOTS_CHANGE, this._onSpotsChange.bind(this));
        this._spotsController.addEventListener(SpotsController.Events.ATTR_CHANGE, this._onGeometryColorChange.bind(this));
        this._spotsController.addEventListener(SpotsController.Events.INTENSITIES_CHANGE, this._onIntensitiesChange.bind(this));
        this._spotsController.addEventListener(SpotsController.Events.MAPPING_CHANGE, this._onIntensitiesChange.bind(this));
    };

    Scene3DBase.Events = {
        CHANGE: 'change',
    };

    Scene3DBase.RecoloringMode = {
        USE_COLORMAP: 'colormap',
        NO_COLORMAP: 'no-colormap'
    };

    Scene3DBase._makeLightProperty = function(field) {
        return Scene3DBase._makeProxyProperty(field, ['intensity'], function() {
            this._notify(Scene3DBase.Events.CHANGE);
        });
    };

    Scene3DBase._makeProxyProperty = function(field, properties, callback) {
        var proxyName = 'proxy' + field;
        this[proxyName] = null;
        return {
            get: function() {
                if (this[proxyName]) return this[proxyName];
                this[proxyName] = {};
                for (var i = 0; i < properties.length; i++) {
                    Object.defineProperty(this[proxyName], properties[i], {
                        get: function(prop) {
                            return this[field][prop]
                        }.bind(this, properties[i]),

                        set: function(prop, value) {
                            this[field][prop] = value;
                            callback.call(this);
                        }.bind(this, properties[i])
                    });
                }
                return this[proxyName];
            },

            set: function(value) {
                for (var i = 0; i < properties.length; i++) {
                    var prop = properties[i];
                    this[field][prop] = value[prop];
                }
                callback.call(this);
            }
        }
    };

    Scene3DBase.prototype = Object.create(EventSource.prototype, {
        backgroundColor: {
            get: function() {
                return '#' + this._backgroundColor.getHexString();
            },

            set: function(value) {
                var color = new THREE.Color(value);
                if (!color.equals(this._backgroundColor)) {
                    this._backgroundColor.set(color);
                    this._notify(Scene3DBase.Events.CHANGE);
                }
            }
        },

        backgroundColorValue: {
            get: function() {
                return this._backgroundColor;
            }
        },

        _onGeometryColorChange: {
            value: function () {
                if (this._mesh) {
                    this._recolor(Scene3DBase.RecoloringMode.NO_COLORMAP);
                    this._notify(Scene3DBase.Events.CHANGE);
                }
            }
        },

        _onSpotsChange: {
            value: function () {
                if (this._mapping) {
                    this._mapping = null; // Mapping is obsolete.
                }
                if (this._mesh) {
                    this._recolor(Scene3DBase.RecoloringMode.USE_COLORMAP);
                    this._notify(Scene3DBase.Events.CHANGE);
                }
            }
        },

        refreshSpots: {
            value: function () {
                this._recolor(Scene3DBase.RecoloringMode.NO_COLORMAP);
                this._notify(Scene3DBase.Events.CHANGE);
            }
        },

        _onIntensitiesChange: {
            value: function(spots) {
                if (this._mesh && this._mapping) {
                    this._recolor(Scene3DBase.RecoloringMode.USE_COLORMAP);
                    this._notify(Scene3DBase.Events.CHANGE);
                }
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
    });

    return Scene3DBase;
});
