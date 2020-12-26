'use strict';

define([
    'eventsource', 'scene3dbase', 'three', 'threejsutils', 'utils', 'colormaps', 'volumeshaders', 'volumerendermesh', 'bounds'
],
function(EventSource, Scene3DBase, THREE, ThreeUtils, Utils, ColorMaps, VolumeShaders, VolumeRenderMesh, Bounds) {
    function Scene3D(spotsController) {
        Scene3DBase.call(this, spotsController);

        this._volumeRenderMesh = new VolumeRenderMesh(VolumeShaders);

        this._shapeColorMapId = 'GC';

        this._slicing = { minX: 0, maxX: 1, minY: 0, maxY: 1, minZ: 0, maxZ: 1 };
        this._light = { ambient: 0.3, diffuse: 0.6, specular: 0.3 };

        this._mapping = null;

        this.slicing = this._slicing;
        this.light = this._light;
        this.opacity = 1.0;
        this.filling = 0.5;
        this.spacing = 1.0;
        this.proportionalOpacityEnabled = false;
        this.intensityOpacity = 1.0;
        this.shadingEnabled = true;
        
        this._meshContainer.add(this._volumeRenderMesh.mesh);
    };

    Object.assign(Scene3D, Scene3DBase);

    Scene3D.prototype = Object.create(EventSource.prototype, {
        clone: {
            value: function(eventName, listener) {
                console.warn("Clone is bad now.");
                return null;
            }
        },

        _onMappingChange: {
            value: function() {
                this._volumeRenderMesh.intensityColorMap = this._spotsController.colorMap;
                this._volumeRenderMesh.intensityBounds = new Bounds(this._spotsController.minValue, this._spotsController.maxValue);
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        _onAttrChange: {
            value: function() {
                this._volumeRenderMesh.proportionalOpacityEnabled = this._spotsController.dataDependentOpacity;
                this._volumeRenderMesh.intensityOpacity = this._spotsController.spotOpacity;
                this._notify(Scene3D.Events.CHANGE);

            }
        },

        _onSpotsChange: {
            value: function() {

            }
        },

        _onIntensitiesChange: {
            value: function() {
                
            }
        },

        intensityData: {
            get: function() {
                return this._volumeRenderMesh.intensityData;
            },
            set: function(value) {
                this._volumeRenderMesh.intensityData = value;
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        normalsData: {
            get: function() {
                return this._volumeRenderMesh.normalsData;
            },
            set: function(value) {
                this._volumeRenderMesh.normalsData = value;
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        shapeColorMapId: {
            get: function() {
                return this._shapeColorMapId;
            },
            set: function(value) {
                this._shapeColorMapId = value;
                this._volumeRenderMesh.shapeColorMap = ColorMaps.Maps[value];
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        shapeData: {
            get: function() {
                return this._volumeRenderMesh.shapeData;
            },
            set: function(value) {
                this._volumeRenderMesh.shapeData = value;
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        slicing: Utils.makeProxyProperty('_slicing', ['minX', 'maxX', 'minY', 'maxY', 'minZ', 'maxZ'],
            function() {
                this._volumeRenderMesh.slicing = this._slicing;
                this._notify(Scene3D.Events.CHANGE);   
            }),

        light: Utils.makeProxyProperty('_light', ['ambient', 'diffuse', 'specular'],
            function() {
                this._volumeRenderMesh.light = this._light;
                this._notify(Scene3D.Events.CHANGE);  
            }),

        opacity: {
            get: function() {
                return this._volumeRenderMesh.uniformalOpacity;
            },
            set: function(value) {
                this._volumeRenderMesh.uniformalOpacity = value;
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        filling: {
            get: function() {
                return this._volumeRenderMesh.uniformalStepOpacity;
            },
            set: function(value) {
                this._volumeRenderMesh.uniformalStepOpacity = value;
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        spacing: {
            get: function() {
                return this._volumeRenderMesh.relativeStepSize;
            },
            set: function(value) {
                this._volumeRenderMesh.relativeStepSize = value;
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        proportionalOpacityEnabled: {
            get: function() {
                return this._volumeRenderMesh.proportionalOpacityEnabled;
            },
            set: function(value) {
                this._volumeRenderMesh.proportionalOpacityEnabled = value;
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        shadingEnabled: {
            get: function() {
                return this._volumeRenderMesh.lightingEnabled;
            },
            set: function(value) {
                this._volumeRenderMesh.lightingEnabled = value;
                this._notify(Scene3D.Events.CHANGE);
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

        refreshSpots: {
            value: function () {
                //this._recolor(Scene3D.RecoloringMode.NO_COLORMAP);
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
                console.log('rendering...');
                renderer.render(this._scene, camera);
            }
        },

        _applySlicing: {
            value: function() {
                // TODO: update uniforms.
            }
        },


    });

    return Scene3D;
});
