
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

            u_normals_size: {value: new THREE.Vector3(0, 0, 0) },
            u_normals_data: {value: new THREE.DataTexture3D(null, 1, 1, 1) },

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

        this._shapeColorMapRenderer = new ColorMapTextureRenderer();

        // Define custom material.
        this._material = new THREE.ShaderMaterial({
            uniforms: this._uniforms,
            vertexShader: volumeShaders.vertex,
            fragmentShader: volumeShaders.fragment,
            side: THREE.BackSide,
            transparent: true,
        });

        // Define geometry.
        this._geometry = new THREE.BoxBufferGeometry(1, 1, 1);
        const translate = 0.5;
        this._geometry.translate(translate, translate, translate);

        this._mesh = new THREE.Mesh(this._geometry, this._material);

        return this;
    }

    VolumeRenderMesh.prototype = Object.create(null, {

        mesh: {
            get: function() {
                return this._mesh;
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
                this._shapeData = value;
                
                const shapeSize = new THREE.Vector3(value.lengthX, value.lengthY, value.lengthZ);
                this._setUniform('u_shape_size', shapeSize);
                this._setUniform('u_shape_bounds', new THREE.Vector2(value.bounds.min, value.bounds.max));

                const shapeTexture = ThreeUtils.createFloatTexture3D(value);
                this._setUniform('u_shape_data', shapeTexture);

                this._geometry.scale(value.sizeX, value.sizeY, value.sizeZ);
                this._mesh.position.x = -value.sizeX / 2;
                this._mesh.position.y = -value.sizeY / 2;
                this._mesh.position.z = -value.sizeZ / 2;
            }
        },

        _setUniform: {
            value: function(tag, value) {
                this._material.uniforms[tag].value = value;
                this._material.uniformsNeedUpdate = true;
            }
        },

        
    });

    return VolumeRenderMesh;
});
