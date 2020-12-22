'use strict';

define([
    'eventsource', 'scene3dbase', 'volumespotscontroller', 'colormaptexturerenderer', 'shaderloader', 'three', 'threejsutils', 'utils', 'colormaps', 'volumeshaders', 'volumerendermesh'
],
function(EventSource, Scene3DBase, SpotsController, ColorMapTextureRenderer, ShaderLoader, THREE, ThreeUtils, Utils, ColorMaps, VolumeShaders, VolumeRenderMesh) {
    function Scene3D(spotsController) {
        Scene3DBase.call(this, spotsController);

        this._volumeRenderMesh = new VolumeRenderMesh(VolumeShaders);
        this._volumeRenderMesh.shapeColorMap = ColorMaps.Maps.GC;

        this._slicing = { minX: 0, maxX: 1, minY: 0, maxY: 1, minZ: 0, maxZ: 1 };
        this._light = { ambient: 0.3, diffuse: 0.6, specular: 0.3 };

        this._mapping = null;

        this.opacity = 1;
        this.filling = 0.5;
        this.spacing = 0.5;
        this.proportionalOpacityEnabled = false;
        this.shadingEnabled = false;

        this._meshContainer.add(this._volumeRenderMesh.mesh);
    };

    Object.assign(Scene3D, Scene3DBase);

    Scene3D.prototype = Object.create(EventSource.prototype, {
        clone: {
            value: function(eventName, listener) {
                console.warn("Clone is bad now.");
                var result = new Scene3D(this._spotsController);
                result.color = this.color;
                result.backgroundColor = this.backgroundColor;
                result.slicing = this.slicing;
                return result;
            }
        },

        _onMappingChange: {
            value: function() {
                this._volumeRenderMesh.intensityColorMap = this._spotsController.colorMap;
            }
        },

        _onAttrChange: {
            value: function() {

            }
        },

        _onSpotsChange: {
            value: function() {

            }
        },

        _onIntensitiesChange: {
            value: function() {
                this._tryRemapVolume();
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
                // TODO:
                if (this._mesh) {
                    this._applySlicing();
                    this._notify(Scene3D.Events.CHANGE);
                }
            }),

        light: Utils.makeProxyProperty('_light', ['ambient', 'diffuse', 'specular'],
            function() {
                // TODO:
                if (this._mesh) {
                    
                    this._notify(Scene3D.Events.CHANGE);
                }
            }),

        opacity: {
            get: function() {
                return this._volumeRenderMesh.uniformalOpacity;
            },
            set: function(value) {
                this._volumeRenderMesh.uniformalOpacity = value;
            }
        },

        filling: {
            get: function() {
                return this._volumeRenderMesh.uniformalStepOpacity;
            },
            set: function(value) {
                this._volumeRenderMesh.uniformalStepOpacity = value;
            }
        },

        spacing: {
            get: function() {
                return this._volumeRenderMesh.relativeStepSize;
            },
            set: function(value) {
                this._volumeRenderMesh.relativeStepSize = value;
            }
        },

        proportionalOpacityEnabled: {
            get: function() {
                return this._volumeRenderMesh.proportionalOpacityEnabled;
            },
            set: function(value) {
                this._volumeRenderMesh.proportionalOpacityEnabled = value;
            }
        },

        shadingEnabled: {
            get: function() {
                return this._volumeRenderMesh.lightingEnabled;
            },
            set: function(value) {
                this._volumeRenderMesh.lightingEnabled = value;
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
                    //this._recolor(Scene3D.RecoloringMode.USE_COLORMAP);
                    this._notify(Scene3D.Events.CHANGE);
                }
            }
        },

        refreshSpots: {
            value: function () {
                //this._recolor(Scene3D.RecoloringMode.NO_COLORMAP);
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        _onIntensitiesChange: {
            value: function(spots) {
                if (this._mesh && this._mapping) {
                    //this._recolor(Scene3D.RecoloringMode.USE_COLORMAP);
                    this._notify(Scene3D.Events.CHANGE);
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
                //this._frontLight.position.set(camera.position.x, camera.position.y, camera.position.z);
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
