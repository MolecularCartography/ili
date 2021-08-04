'use strict';

define([
    'eventsource', 'scene3dbase', 'three', 'threejsutils', 'utils', 'colormaps', 'volumerendermesh', 'bounds', 'spotscontrollerbase'
],
function(EventSource, Scene3DBase, THREE, ThreeUtils, Utils, ColorMaps, VolumeRenderMesh, Bounds, SpotsControllerBase) {
    function Scene3D(workspace, spotsController) {
        Scene3DBase.call(this, spotsController);

        this._workspace = workspace;
        this._volumeRenderMesh = new VolumeRenderMesh();

        this._shapeColorMapId = 'GC';

        this._slicing = { minX: 0, maxX: 1, minY: 0, maxY: 1, minZ: 0, maxZ: 1 };
        this._light = { ambient: 0.3, diffuse: 0.6, specular: 0.3 };
        this._adjustment = { x: 0, y: 0, z: 0 };

        this.slicing = this._slicing;
        this.light = this._light;

        this.reset();

        this._meshContainer.add(this._volumeRenderMesh.mesh);
    };

    Object.assign(Scene3D, Scene3DBase);

    Scene3D.prototype = Object.create(EventSource.prototype, {
        clone: {
            value: function(eventName, listener) {
                // Clone is too expensive for the scene.
                return null;
            }
        },

        vertexShader: {
            get: function() {
                return this._volumeRenderMesh.vertexShader;
            },
            set: function(value) {
                this._volumeRenderMesh.vertexShader = value;
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        fragmentShader: {
            get: function() {
                return this._volumeRenderMesh.fragmentShader;
            },
            set: function(value) {
                this._volumeRenderMesh.fragmentShader = value;
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        _manageMeshVisibility: {
            value: function() {
                this._volumeRenderMesh.visible = this.vertexShader && this.fragmentShader;
            }
        },

        _onMappingChange: {
            value: function() {
                this._volumeRenderMesh.intensityColorMap = this._spotsController.colorMap;
                this._volumeRenderMesh.intensityBoundsScaled = new Bounds(this._spotsController.minValue, this._spotsController.maxValue);
                const realScale = 
                    this._spotsController.scale == SpotsControllerBase.Scale.LINEAR ? 0 :
                    this._spotsController.scale == SpotsControllerBase.Scale.LOG ? 2 : 0;
                this._volumeRenderMesh.scale = realScale;
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        _onAttrChange: {
            value: function() {
                this._volumeRenderMesh.proportionalOpacityEnabled = this._spotsController.dataDependentOpacity;
                this._volumeRenderMesh.intensityOpacity = this._spotsController.globalSpotOpacity;
                this._volumeRenderMesh.intensityBoundsScaled = new Bounds(
                    this._spotsController.minValue,
                    this._spotsController.maxValue);
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

        isBorderVisible: {
            get: function() {
                return this._volumeRenderMesh.isBorderVisible;
            },
            set: function(value) {
                this._volumeRenderMesh.isBorderVisible = value;
                this._notify(Scene3D.Events.CHANGE);
            }
        },
   
        isSliceBorderVisible: {
            get: function() {
                return this._volumeRenderMesh.isSliceBorderVisible;
            },
            set: function(value) {
                this._volumeRenderMesh.isSliceBorderVisible = value;
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        intensityTexture: {
            get: function() {
                return this._volumeRenderMesh.intensityTexture;
            },
            set: function(value) {
                this._volumeRenderMesh.intensityTexture = value;
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        intensityOpacityTexture: {
            get: function() {
                return this._volumeRenderMesh.intensityOpacityTexture;
            },
            set: function(value) {
                this._volumeRenderMesh.intensityOpacityTexture = value;
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        normalsTexture: {
            get: function() {
                return this._volumeRenderMesh.normalsTexture;
            },
            set: function(value) {
                this._volumeRenderMesh.normalsTexture = value;
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

        adjustment: Utils.makeProxyProperty('_adjustment', ['x', 'y', 'z'],
            function() {
                this._applyAdjustment();
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

        min_intensity_threshold: {
            get: function() {
                return this._volumeRenderMesh.minShapeIntensityThreshold;
            },
            set: function(value) {
                this._volumeRenderMesh.minShapeIntensityThreshold = value;
                this._notify(Scene3D.Events.CHANGE);
            },
        },

        max_intensity_threshold: {
            get: function() {
                return this._volumeRenderMesh.maxShapeIntensityThreshold;
            },
            set: function(value) {
                this._volumeRenderMesh.maxShapeIntensityThreshold = value;
                this._notify(Scene3D.Events.CHANGE);
            },
        },

        isIntensityEnabled: {
            get: function() {
                return this._volumeRenderMesh.isIntensityEnabled;
            },
            set: function(value) {
                this._volumeRenderMesh.isIntensityEnabled = value;
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
                if (value) {
                    this._workspace.requestNormalTexture();
                }  
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

        position: {
            get: function() {
                return this._scene.position.clone();
            }
        },

        render: {
            value: function(renderer, camera, orientationWidget) {
                orientationWidget.myTransform = `translateZ(-300px)  ${Scene3DBase.prototype.getCameraCSSMatrix(camera.matrixWorldInverse)}`;
                renderer.render(this._scene, camera);
            }
        },

        resetSlicing: {
            value: function() {
                this.slicing.minX = 0; 
                this.slicing.maxX = 1; 
                this.slicing.minY = 0; 
                this.slicing.maxY = 1;
                this.slicing.minZ = 0; 
                this.slicing.maxZ = 1; 
            }
        },
        
        resetAdjustment: {
            value: function() {
                this.adjustment.x = 0; 
                this.adjustment.y = 0; 
                this.adjustment.z = 0;
            }
        },

        reset: {
            value: function() {
                this._volumeRenderMesh.reset();
                this.opacity = 1.0;
                this.filling = 0.5;
                this.spacing = 1.0;
                this.proportionalOpacityEnabled = false;
                this.isIntensityEnabled = true;
                this.resetAdjustment();
                this.resetSlicing();
                this._onAttrChange();
                this.shadingEnabled = false;
            }
        },

        _applyAdjustment: {
            value: function() {
                this._volumeRenderMesh.coordinatesAdjustment = this._adjustment;
            }
        }
    });

    return Scene3D;
});
