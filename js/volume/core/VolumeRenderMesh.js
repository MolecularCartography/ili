
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
       // Define render technique uniforms.
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
            u_intensity_bounds: {value: new THREE.Vector2(0, 0) },
            u_intensity_opacity: {value: 1.0},

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
            uniformal_opacity: {value: 1.0},
            uniformal_step_opacity: {value: 0.5},

            u_proportional_opacity_enabled: {value: 1.0},
            u_lighting_enabled: {value: 1.0},

            u_scalemode: {value: 0},
        };

        // Color map texture renderers.
        this._shapeColorMapRenderer = new ColorMapTextureRenderer(shapeColorMapTextureSize);
        this._intensityColorMapRenderer = new ColorMapTextureRenderer(intensityColorMapTextureSize);

        // Define custom material.
        this._material = new THREE.ShaderMaterial({
            uniforms: this._uniforms,
            vertexShader: volumeShaders.vertex,
            fragmentShader: volumeShaders.fragment,
            side: THREE.BackSide,
            transparent: true,
        });

        // Define mesh.
        this._meshContainer = new THREE.Object3D();

        return this;
    }

    VolumeRenderMesh.prototype = Object.create(null, {

        dispose: {
            value: function() {
                if (this._shapeTexture) {
                    this._shapeTexture.dispose();
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
                return this._meshContainer;
            }
        },

        intensityOpacity: {
            get: function() {
                return this._intensityOpacity;
            },
            set: function(value) {
                this._intensityOpacity = value;
                this._setUniform('u_intensity_opacity', value);
                // TODO: implement the parameter.
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
                this._setUniform('uniformal_step_opacity', value);
            }
        },

        uniformalOpacity: {
            get: function() {
                return this._uniformalOpacity;
            },
            set: function(value) {
                this._uniformalOpacity = value;
                this._setUniform('uniformal_opacity', value);
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
                
                const shapeSize = new THREE.Vector3(value.lengthX, value.lengthY, value.lengthZ);
                this._setUniform('u_shape_size', shapeSize);
                this._setUniform('u_shape_bounds', new THREE.Vector2(value.bounds.min, value.bounds.max));

                this._shapeTexture = ThreeUtils.createFloatTexture3D(value);
                this._resetTransform();
                this._setUniform('u_shape_data', this._shapeTexture);
            }
        },

        _setUniform: {
            value: function(tag, value) {
                this._material.uniforms[tag].value = value;
                this._material.uniformsNeedUpdate = true;
            }
        },

        _resetTransform: {
            value: function() {
                if (this._geometry) {
                    this._geometry.dispose();
                    this._meshContainer.remove(this._mesh);
                }

                const shape = this._shapeData;
                if (shape) {

                    const minX = 0;
                    const maxX = 1;

                    // Shift geometry so its angle is at [0; 0; 0]
                    this._geometry = new THREE.BoxBufferGeometry(shape.sizeX, shape.sizeY, shape.sizeZ);
                    this._geometry.translate(shape.sizeX * (maxX - minX) / 2, shape.sizeY / 2, shape.sizeZ / 2);

                    this._geometry.translate(shape.sizeX * minX, 0, 0);
                    
                    // Shift back. Note that mesh shift is achieved by model matrix.
                    this._mesh = new THREE.Mesh(this._geometry, this._material);
                    this._mesh.position.x = -shape.sizeX / 2;
                    this._mesh.position.y = -shape.sizeY / 2;
                    this._mesh.position.z = -shape.sizeZ / 2;
    

                    this._meshContainer.add(this._mesh);
                }
            }
        }

        
    });

    return VolumeRenderMesh;
});
