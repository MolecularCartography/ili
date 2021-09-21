
'use strict';

define([
    'three', 'rendermeshbase'
],
    function(THREE, RenderMeshBase) {

        const ZERO_VECTOR = new THREE.Vector3().set(0, 0, 0);
        const ONE_VECTOR = new THREE.Vector3().set(1, 1, 1);

        const EVENT_MAP = new Map([
            // Common.
            [ 'shapeData', (mesh, getter) => mesh._resetShapeData(getter) ],
            [ 'spacing', (mesh, getter) => mesh._resetShapeRelativeStepSize(getter) ],
            [ 'intensityScale', (mesh, getter) => mesh._resetIntensityScale(getter) ],

            // Shape data.
            [ 'shapeDataTexture', (mesh, getter) => mesh._resetShapeDataTexture(getter) ],
            [ 'shapeColorMapTexture', (mesh, getter) => mesh._resetShapeColorMapTexture(getter) ],
            [ 'shapeTransferFunctionSource', (mesh, getter) => mesh._resetShapeTransferFunctionSource(getter) ],
            [ 'shapeTransferFunctionTexture', (mesh, getter) => mesh._resetShapeTransferFunctionTexture(getter) ],
            [ 'shapeTransferFunctionExTexture', (mesh, getter) => mesh._resetShapeTransferFunctionExTexture(getter) ],
            [ 'shapeOpacity', (mesh, getter) => mesh._resetShapeOpacity(getter) ],
            [ 'filling', (mesh, getter) => mesh._resetShapeStepOpacity(getter) ],

            // Intensity data.
            [ 'intensityData', (mesh, getter) => mesh._resetIntensityData(getter) ],
            [ 'intensitySizeFactor', (mesh, getter) => mesh._resetIntensitySizeFactor(getter) ],
            [ 'intensityDataTexture', (mesh, getter) => mesh._resetIntensityDataTexture(getter) ],
            [ 'intensityOpacityDataTexture', (mesh, getter) => mesh._resetIntensityOpacityDataTexture(getter) ],
            [ 'intensityValueRangeScaled', (mesh, getter) => mesh._resetIntensityDataValueBoundsScaled(getter) ],
            [ 'intensityColorMapTexture', (mesh, getter) => mesh._resetIntensityColorMapTexture(getter) ],
            [ 'intensityTransferFunctionTexture', (mesh, getter) => mesh._resetIntensityTransferFunctionTexture(getter) ],
            [ 'intensityTransferFunctionSource', (mesh, getter) => mesh._resetIntensityTransferFunctionSource(getter) ],
            [ 'intensityOpacity', (mesh, getter) => mesh._resetIntensityOpacity(getter) ],
            [ 'isIntensityEnabled', (mesh, getter) => mesh._resetIsIntensityEnabled(getter) ],
            [ 'isShapeBasedIntensityEnabled', (mesh, getter) => mesh._resetIsShapeBasedIntensityEnabled(getter) ],
            [ 'isShapeTransferFunctionEnabled', (mesh, getter) => mesh._resetIsShapeTransferFunctionEnabled(getter) ],

            // Normals data.
            [ 'isShadingEnabled', (mesh, getter) => mesh._resetIsShadingEnabled(getter) ],
            [ 'normalDataTexture', (mesh, getter) => mesh._resetShapeDataNormalTexture(getter) ],
    
            // Complex properties.
            [ 'textureFilter', (mesh, getter) => mesh._resetTextureFilter(getter )],
            [ 'isSliceEnabled', (mesh, getter) => mesh._resetIsSliceEnabled(getter) ],
            [ 'sliceInfo', (mesh, getter) => mesh._resetSliceInfo(getter) ],
            [ 'coordinatesAdjustmentInfo', (mesh, getter) => mesh._resetCoordinatesAdjustment(getter) ],
            [ 'lightInfo', (mesh, getter) => mesh._resetLight(getter) ]
        ]);

        const UNIFORMS = {
            // Shape uniforms.
            u_shape_size: { value: new THREE.Vector3(0, 0, 0)},
            u_shape_data: { value: new THREE.DataTexture3D(null, 1, 1, 1) },
            u_shape_cmdata: { value: new THREE.DataTexture(null, 1, 1) },
            u_shape_bounds: { value: new THREE.Vector2(0, 0)},
            u_shape_slice_min: { value: new THREE.Vector3(0, 0, 0) },
            u_shape_slice_max: { value: new THREE.Vector3(1, 1, 1) },
            u_shape_tf_opacity_enabled: { value: 1.0 },
            u_shape_tfdata: { value: new THREE.DataTexture(null, 1, 1) },
            u_shape_tfdata_ex: { value: new THREE.DataTexture(null, 1, 1) },
            u_shape_tfsource: { value: 1.0 },

            // Intensity.
            u_intensity_size: {value: new THREE.Vector3(0, 0, 0) },
            u_intensity_data: {value: new THREE.DataTexture3D(null, 1, 1, 1) },
            u_intensity_opacity_data: {value: new THREE.DataTexture3D(null, 1, 1, 1) },
            u_intensity_cmdata: {value: new THREE.DataTexture(null, 1, 1) },
            u_intensity_bounds_scaled: {value: new THREE.Vector2(0, 0) },
            u_intensity_size_factor: {value: 0.0},
            u_intensity_opacity: {value: 1.0},
            u_intensity_opacity_enabled: {value: 1.0},
            u_intensity_enabled: {value: 0},
            u_intensity_tfdata: { value: new THREE.DataTexture(null, 1, 1) },
            u_intensity_tfsource: { value: 0.0 },

            // Lighting.  
            u_normals_size: {value: new THREE.Vector3(0, 0, 0) },
            u_normals_data: {value: new THREE.DataTexture3D(null, 1, 1, 1) },
            u_relative_step_size: {value: 1.0},
            u_uniformal_step_opacity: {value: 0.5},
            u_lighting_enabled: {value: 1.0},
            u_shape_intensity_enabled: { value: 0.0 },
            u_ambient_intensity: {value: 0.4},
            u_diffuse_intensity: {value: 0.5},
            u_specular_intensity: {value: 0.5},
            u_rim_intensity: {value: 0},
            
            // Common.
            u_slicing_min: {value: new THREE.Vector3(0, 0, 0)},
            u_slicing_max: {value: new THREE.Vector3(1, 1, 1)},
            u_uniformal_opacity: {value: 1.0},
            u_scalemode: {value: 0},
            u_coordinates_adjustment: {value: new THREE.Vector3(0, 0, 0)},   
        };

        class VolumeRenderMeshBase extends RenderMeshBase {
            
            constructor(controller, eventMap = null, uniforms = null, intensityConfig = null) {
                super(controller,  
                    eventMap ? new Map([...EVENT_MAP, ...eventMap]) : EVENT_MAP, 
                    uniforms ? Object.assign(Object.assign({}, UNIFORMS), uniforms) : UNIFORMS);
                this._intensityConfig = intensityConfig;
            }

            reset() { this.invokeEventActions(); }

            onShapeDataChanged(shapeData) {

            }

            onIntensityDataChanged(intensityData) {

            }

            _resetTextureFilter(getter) {
                this._textureFilter = getter();
                this._validateTextureFilter();
            }

            _validateTextureFilter() {
                const filter = this._textureFilter === 'nearest' ? THREE.NearestFilter :  THREE.LinearFilter;
                const resetFilter = (texture) => {
                    if (texture) {
                        texture.magFilter = filter;
                        texture.minFilter = filter;
                        texture.needsUpdate = true;
                    }
                }
                resetFilter(this._intensityDataTexture);
                resetFilter(this._shapeDataTexture);
                resetFilter(this._shapeDataNormalsTexture);
            }

            _resetIntensitySizeFactor(getter) {
                const value = getter();
                this._setUniform('u_intensity_size_factor', value);
            }

            _resetIntensityData(getter) {
                const value = getter();
                this.onIntensityDataChanged(value);
            }
            
            _resetVisibility() {
                let isVisible = this.shapeData !== null;
                if (this._intensityConfig.isIntensityCritical) {
                    isVisible = isVisible && this._isIntensityVisible;
                }
                this.container.visible = isVisible;
            }

            _resetShapeData(getter) {
                const value = getter();
                this._shapeData = value;
                this.onShapeDataChanged(value);
                this._resetVisibility();
                if (!value) {
                    return;
                }  
                this._setUniform('u_shape_bounds', new THREE.Vector2(value.bounds.min, value.bounds.max));
            }

            _resetLight(getter) {
                const value = getter();
                this._setUniform('u_ambient_intensity', value.ambient);
                this._setUniform('u_diffuse_intensity', value.diffuse);
                this._setUniform('u_specular_intensity', value.specular);
            }

            _resetSlicing(getter) {
                const value = getter();
                this._setUniform('u_shape_slice_min', new THREE.Vector3(value.minX, value.minY, value.minZ));
                this._setUniform('u_shape_slice_max', new THREE.Vector3(value.maxX, value.maxY, value.maxZ));
            }

            _resetCoordinatesAdjustment(getter) {
                const value = getter();
                const vector = new THREE.Vector3(Number.parseFloat(value.x), Number.parseFloat(value.y), Number.parseFloat(value.z));
                this._setUniform('u_coordinates_adjustment', vector);
            }

            _resetShapeRelativeStepSize(getter) { this._setUniform('u_relative_step_size', getter()); }

            _resetShapeDataTexture(getter) { 
                const value = getter();
                this._shapeDataTexture = value;
                this._validateTextureFilter();
                this._setUniform('u_shape_data', value);

                if (!value) {
                    return;
                }
                const image = value.image;
                this._setUniform('u_shape_size', new THREE.Vector3(image.width, image.height, image.depth));        
            }

            _resetShapeDataNormalTexture(getter) {  
                const value = getter();          
                this._shapeDataNormalsTexture = value;
                this._validateTextureFilter();
                this._setUniform('u_normals_data', value);

                if (!value) {
                    return;
                }
                const image = value.image;
                this._setUniform('u_normals_size', new THREE.Vector3(image.width, image.height, image.depth));
                this._resetShadingEnabled();
            }

            _resetShapeOpacity(getter) { this._setUniform('u_uniformal_opacity', getter()); }

            _resetShapeColorMapTexture(getter) { this._setUniform('u_shape_cmdata', getter()); }

            _resetShapeTransferFunctionTexture(getter) { this._setUniform('u_shape_tfdata', getter()); }

            _resetShapeTransferFunctionExTexture(getter) { this._setUniform('u_shape_tfdata_ex', getter()); }

            _resetShapeTransferFunctionSource(getter) { this._setUniform('u_shape_tfsource', getter()); }

            _resetIntensityTransferFunctionSource(getter) { this._setUniform('u_intensity_tfsource', getter()); }
            
            _resetIsSliceEnabled(getter) {
                this._isSliceEnabled = getter();
                this._resetRealSliceInfo();
            }

            _resetSliceInfo(getter) {
                this._sliceInfo = getter();
                this._resetRealSliceInfo();
            }

            _resetRealSliceInfo() {
                if (!this._sliceInfo) {
                    return;
                }
                const value = this._sliceInfo;
                const sliceMin = this._isSliceEnabled ?
                    new THREE.Vector3(value.minX, value.minY, value.minZ) :
                    ZERO_VECTOR;
                const sliceMax = this._isSliceEnabled ?
                    new THREE.Vector3(value.maxX, value.maxY, value.maxZ) :
                    ONE_VECTOR;

                this._setUniform('u_shape_slice_min', sliceMin);
                this._setUniform('u_shape_slice_max', sliceMax);
            }

            _resetShapeStepOpacity(getter) { this._setUniform('u_uniformal_step_opacity', getter()); }

            _resetIntensityScale(getter) { this._setUniform('u_scalemode', getter()); }

            _resetIsShadingEnabled(getter) { 
                this._isShadingEnabled = getter(); 
                this._resetShadingEnabled();
            }

            _resetIntensityDataTexture(getter) {
                const value = getter();
                this._intensityDataTexture = value;
                this._validateTextureFilter();
                this._setUniform('u_intensity_data', value);
                if (value) {
                    const image = value.image;
                    this._setUniform('u_intensity_size', new THREE.Vector3(image.width, image.height, image.depth));
                    this._resetShadingEnabled();
                }
                this._resetIntensityEnabled();
            }

            _resetIntensityOpacityDataTexture(getter) {
                const value = getter();
                this._intensityOpacityTexture = value;
                this._setUniform('u_intensity_opacity_data', value);
                this._setUniform('u_intensity_opacity_enabled', 1.0);
            }

            _resetIntensityDataValueBoundsScaled(getter) {
                const value = getter();
                this._intensityDataValueBounds = value;
                this._setUniform('u_intensity_bounds_scaled', new THREE.Vector2(value.min, value.max));
                this._resetIntensityEnabled();
            }

            _resetIntensityOpacity(getter) { 
                const value = getter();
                this._setUniform('u_intensity_opacity', value);
             }

            _resetIsIntensityEnabled(getter) {
                this._isIntensityEnabled = getter();
                this._resetIntensityEnabled();
            }

            _resetIsShapeTransferFunctionEnabled(getter) {
                const value = getter();
                this._setUniform('u_shape_tf_opacity_enabled', value ? 1 : 0);
            }

            _resetIsShapeBasedIntensityEnabled(getter) {
                const value = getter();
                this._setUniform('u_shape_intensity_enabled', value ? 1 : 0);
            }

            _resetIntensityColorMapTexture(getter) {    
                const value = getter();
                this._intensityColorMapTexture = value;
                this._setUniform('u_intensity_cmdata', value);
                this._resetIntensityEnabled();
            }

            _resetIntensityTransferFunctionTexture(getter) { 
                const value = getter();
                this._intensityTransferFunctionTexture = value;
                this._setUniform('u_intensity_tfdata', value); 
            }
 
            _resetIntensityEnabled() {
                let value = 
                    this._intensityColorMapTexture !== null && 
                    this._isIntensityEnabled &&
                    this._intensityDataValueBounds !== null;
                if (this._intensityConfig.isIntensityTextureRequired) {
                    value = value && this._intensityDataTexture !== null
                }
                this._isIntensityVisible = value;
                this._setUniform('u_intensity_enabled', value ? 1 : 0);
                this._resetVisibility();
            }

            _resetShadingEnabled() {
                const value = this._isShadingEnabled && this._shapeDataNormalsTexture;
                this._setUniform('u_lighting_enabled', value ? 1 : 0);
            }
   
        }

        return VolumeRenderMeshBase;
    });
