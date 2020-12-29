
'use strict';

define([
    'three', 'threejsutils', 'colormaptexturerenderer', 'rawvolumedata'
],
    function(THREE, ThreeUtils, ColorMapTextureRenderer, RawVolumeData) {

        const RenderStyle = {
            raycast: 0,
            steps_debug: 1,
        };
        Object.freeze(RenderStyle);

        const shapeColorMapTextureSize = 100;
        const intensityColorMapTextureSize = 100;

        function VolumeRenderMesh(volumeShaders) {
            // define render technique uniforms.
            this._uniforms = {
                u_shape_size: { value: new THREE.Vector3(0, 0, 0)},
                u_shape_data: { value: new THREE.DataTexture3D(null, 1, 1, 1) },
                u_shape_cmdata: { value: new THREE.DataTexture(null, 1, 1) },
                u_shape_bounds: { value: new THREE.Vector2(0, 0)},
                u_shape_slice_min: { value: new THREE.Vector3(0, 0, 0) },
                u_shape_slice_max: { value: new THREE.Vector3(1, 1, 1) },

                u_intensity_size: {value: new THREE.Vector3(0, 0, 0) },
                u_intensity_data: {value: new THREE.DataTexture3D(null, 1, 1, 1) },
                u_intensity_cmdata: {value: new THREE.DataTexture(null, 1, 1) },
                u_intensity_bounds_scaled: {value: new THREE.Vector2(0, 0) },
                u_intensity_opacity: {value: 1.0},
                u_intensity_enabled: {value: 0},

                u_normals_size: {value: new THREE.Vector3(0, 0, 0) },
                u_normals_data: {value: new THREE.DataTexture3D(null, 1, 1, 1) },

                u_slicing_min: {value: new THREE.Vector3(0, 0, 0)},
                u_slicing_max: {value: new THREE.Vector3(1, 1, 1)},

                u_ambient_intensity: {value: 0.4},
                u_diffuse_intensity: {value: 0.5},
                u_specular_intensity: {value: 0.5},
                u_rim_intensity: {value: 0},

                u_renderstyle: {value: RenderStyle.raycast},

                u_relative_step_size: {value: 1.0 },
                u_uniformal_opacity: {value: 1.0},
                u_uniformal_step_opacity: {value: 0.5},

                u_proportional_opacity_enabled: {value: 1.0},
                u_lighting_enabled: {value: 1.0},

                u_scalemode: {value: 0},
            };

            // color map texture renderers.
            this._shapeColorMapRenderer = new ColorMapTextureRenderer(shapeColorMapTextureSize);
            this._intensityColorMapRenderer = new ColorMapTextureRenderer(intensityColorMapTextureSize);

            // define custom material.
            this._material = new THREE.ShaderMaterial({
                uniforms: this._uniforms,
                vertexShader: volumeShaders.vertex,
                fragmentShader: volumeShaders.fragment,
                side: THREE.BackSide,
                transparent: true,
            });

            // create geometry and mesh.
            this._geometry = new THREE.BoxBufferGeometry(1, 1, 1);
            this._mesh = new THREE.Mesh(this._geometry, this._material);

            // Create border cube.
            this._borderCubeMaterial = new THREE.MeshBasicMaterial( {
                color: 0xffffff,
                wireframe: true
            });
            this._borderCube = new THREE.Mesh(this._geometry, this._borderCubeMaterial);
            this._borderCube.visible = false;

            // Create slice border cube.
            this._sliceBorderCubeMaterial = new THREE.MeshBasicMaterial( {
                color: 0x00ff00,
                wireframe: true
            });
            this._sliceBorderCube = new THREE.Mesh(this._geometry, this._sliceBorderCubeMaterial);
            this._sliceBorderCube.visible = false;

            // Create common container.
            this._container = new THREE.Object3D();
            this._container.add(this._mesh);
            this._container.add(this._borderCube);
            this._container.add(this._sliceBorderCube);

            return this;
        }

        VolumeRenderMesh.prototype = Object.create(null, {

            dispose: {
                value: function() {
                    if (this._shapeTexture) {
                        this._shapeTexture.dispose();
                    }
                    if (this._intensityTexture) {
                        this._intensityTexture.dispose();
                    }
                    if (this._normalsTexture) {
                        this._normalsTexture.dipose();
                    }
                    if (this._geometry) {
                        this._geometry.dispose();
                    }
                    if (this._material) {
                        this._material.dispose();
                    }
                }
            },

            mesh: {
                get: function() {
                    return this._container;
                }
            },

            isBorderVisible: {
                get: function() {
                    return this._isBorderVisible;
                },
                set: function(value) {
                    this._isBorderVisible = value;
                    this._borderCube.visible = value;
                }
            },

            isBorderVisible: {
                get: function() {
                    return this._isSliceBorderVisible;
                },
                set: function(value) {
                    this._isSliceBorderVisible = value;
                    this._sliceBorderCube.visible = value;
                   
                }
            },

            light: {
                get: function() {
                    return this._light;
                },
                set: function(value) {
                    this._light = value;
                    this._setUniform('u_ambient_intensity', value.ambient);
                    this._setUniform('u_diffuse_intensity', value.diffuse);
                    this._setUniform('u_specular_intensity', value.specular);
                }
            },

            slicing: {
                get: function() {
                    return this._slicing;
                },
                set: function(value) {
                    this._slicing = value;
                    this._setUniform('u_shape_slice_min', new THREE.Vector3(value.minX, value.minY, value.minZ));
                    this._setUniform('u_shape_slice_max', new THREE.Vector3(value.maxX, value.maxY, value.maxZ));
                }
            },

            intensityOpacity: {
                get: function() {
                    return this._intensityOpacity;
                },
                set: function(value) {
                    this._intensityOpacity = value;
                    this._setUniform('u_intensity_opacity', value);
                }
            },

            scale: {
                get: function() {
                    return this._scale;
                },
                set: function(value) {
                    this._scale = value;
                    this._setUniform('u_scalemode', value);
                }
            },

            lightingEnabled: {
                get: function() {
                    return this._lightingEnabled;
                },
                set: function(value) {
                    this._lightingEnabled = value;
                    this._setUniform('u_lighting_enabled', value ? 1 : 0);
                }
            },

            proportionalOpacityEnabled: {
                get: function() {
                    return this._proportionalOpacityEnabled;
                },
                set: function(value) {
                    this._proportionalOpacityEnabled = value;
                    this._setUniform('u_proportional_opacity_enabled', value ? 1 : 0);
                }
            },

            uniformalStepOpacity: {
                get: function() {
                    return this._uniformalStepOpacity;
                },
                set: function(value) {
                    this._uniformalStepOpacity = value;
                    this._setUniform('u_uniformal_step_opacity', value);
                }
            },

            uniformalOpacity: {
                get: function() {
                    return this._uniformalOpacity;
                },
                set: function(value) {
                    this._uniformalOpacity = value;
                    this._setUniform('u_uniformal_opacity', value);
                }
            },

            relativeStepSize: {
                get: function() {
                    return this._relativeStepSize;
                },
                set: function(value) {
                    this._relativeStepSize = value;
                    this._setUniform('u_relative_step_size', value);
                }
            },

            shapeColorMap: {
                get: function() {
                    return this._shapeColorMap;
                },
                set: function(value) {
                    this._shapeColorMap = value;
                    this._shapeColorMapRenderer.update(this._shapeColorMap);
                    this._setUniform('u_shape_cmdata', this._shapeColorMapRenderer.texture);
                }
            },

            shapeData: {
                get: function() {
                    return this._shapeData;
                },
                set: function(value) {
                    if (this._shapeTexture) {
                        this._shapeTexture.dispose();
                    }
                    this._shapeData = value;
                    if (this._shapeData) {
                        const shapeSize = new THREE.Vector3(value.sizeX, value.sizeY, value.sizeZ);

                        this._borderCube.scale.x = value.sizeX;
                        this._borderCube.scale.y = value.sizeY;
                        this._borderCube.scale.z = value.sizeZ;

                        this._setUniform('u_shape_size', shapeSize);
                        this._setUniform('u_shape_bounds', new THREE.Vector2(value.bounds.min, value.bounds.max)); 
                        this._shapeTexture = ThreeUtils.createFloatTexture3D(value);
                        this._setUniform('u_shape_data', this._shapeTexture);
                    }
                }
            },

            intensityBoundsScaled: {
                get: function() {
                    return this._intensityBoundsScaled;
                },
                set: function(value) {
                    this._intensityBoundsScaled = value;
                    this._setUniform('u_intensity_bounds_scaled', new THREE.Vector2(value.min, value.max));
                    this._resetIntensityEnabled();
                }
            },

            intensityColorMap: {
                get: function() {
                    return this._intensityColorMap;
                },
                set: function(value) {
                    this._intensityColorMap = value;
                    this._intensityColorMapRenderer.update(value);
                    this._setUniform('u_intensity_cmdata', this._intensityColorMapRenderer.texture);
                    this._resetIntensityEnabled();
                }
            },

            intensityData: {
                get: function() {
                    return this._intensityData;
                },
                set: function(value) {
                    if (this._intensityTexture) {
                        this._intensityTexture.dispose();
                    }
                    this._intensityData = value;
                    if (this._intensityData) {
                        const intensitySize = new THREE.Vector3(value.sizeX, value.sizeY, value.sizeZ);
                        this._setUniform('u_intensity_size', intensitySize);
                        this._intensityTexture = ThreeUtils.createFloatTexture3D(value);
                        this._setUniform('u_intensity_data', this._intensityTexture);
                    }
                    this._resetIntensityEnabled();
                },
            },

            _resetIntensityEnabled: {
                value: function() {
                    const value = 
                        this._intensityData && 
                        this._intensityColorMap && 
                        this._intensityBoundsScaled ? 1 : 0;
                    this._setUniform('u_intensity_enabled', value);
                }
            },

            normalsData: {
                get: function() {
                    return this._normalsData;
                },
                set: function(value) {
                    if (this._normalsTexture) {
                        this._normalsTexture.dispose();
                    }
                    this._normalsData = value;
                    const normalsSize = new THREE.Vector3(value.sizeX, value.sizeY, value.sizeZ);
                    this._setUniform('u_normals_size', normalsSize);
                    this._setUniform('u_normals_data', value);
                },
            },

            _setUniform: {
                value: function(tag, value) {
                    this._material.uniforms[tag].value = value;
                    this._material.uniformsNeedUpdate = true;
                }
            },

            reset: {
                value: function() {
                    this._shapeData = null;
                    this._intensityData = null;
                }
            }
        });

        return VolumeRenderMesh;
    });
