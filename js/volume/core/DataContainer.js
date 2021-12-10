'use strict';

define([
    'three', 'threejsutils', 'colormaps', 'volumedatacache', 'colormaptexturerenderer', 'transferfunctiontexturerenderer', 
    'utils', 'volumesectionprocessor', 'sectiongeometrycache', 'transferfunction'
],
function(
    THREE, ThreeJsUtils, ColorMaps, VolumeDataCache, ColorMapTextureRenderer, 
    TransferFunctionTextureRenderer, Utils, 
    VolumeSectionProcessor, SectionGeometryCache, TransferFunction) {

    // internal Tasks.
    const Tasks = {
        MAP: {
            key: 'map',
            worker: 'js/volume/workers/CuboidMapper.js'
        },
        COMPUTE_NORMALS: {
            key: 'load_normals',
            worker: 'js/volume/workers/NormalsLoader.js'
        }
    };

    // color map texture size constants.
    const ShapeColorMapTextureSize = 100;
    const IntensityColorMapTextureSize = 100;

    // transfer function texture size constants.
    const ShapeTransferFunctionTextureSize = 100;
    const IntensityTransferFunctionTextureSize = 100;

    // event constants.
    const PropertyChangedEventName = 'propertyChanged';

    class DataContainer extends THREE.EventDispatcher {   
        
        constructor(taskController) {
            super();
            this._taskController = taskController;
    
            // geometries.
            this._sectionGeometryCache = new SectionGeometryCache();
            this._isSectionValid = false;
            this._defineGetterProperty({
                name: 'sectionGeometry', 
                getter: () => {
                    return this._sectionGeometryCache.geometry;
                }
            });
            this._defineGetterProperty({
                name: 'lineSectionGeometry', 
                getter: () => {
                    return this._sectionGeometryCache.lineGeometry;
                }
            });
            this.boxGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
            this.boxLineGeometry = new THREE.BufferGeometry().setFromPoints(ThreeJsUtils.cubeLinePositions);
    
            // color map textures.
            this._shapeColorMapTextureRenderer = new ColorMapTextureRenderer(ShapeColorMapTextureSize);
            this._intensityColorMapTextureRenderer = new ColorMapTextureRenderer(IntensityColorMapTextureSize);
    
            // transfer function textures.
            this._shapeTransferFunctionTextureRenderer = new TransferFunctionTextureRenderer(ShapeTransferFunctionTextureSize);
            this._shapeTransferFunctionExTextureRenderer = new TransferFunctionTextureRenderer(ShapeTransferFunctionTextureSize);
            this._intensityTransferFunctionTextureRenderer = new TransferFunctionTextureRenderer(IntensityTransferFunctionTextureSize);
    
            // CPU caches.
            this._shapeVolumeDataCache = new VolumeDataCache.VolumeDataCache(
                (size) => new Float32Array(size),
                (buffer) => new Float32Array(buffer));
            this._intensityVolumeDataCache = new VolumeDataCache.VolumeDataCache(
                (size) => new Float32Array(size),
                (buffer) => new Float32Array(buffer));
            this._intensityOpacityVolumeDataCache = new VolumeDataCache.VolumeDataCache(
                (size) => new Uint8Array(size),
                (buffer) => new Uint8Array(buffer));
            this._normalsVolumeDataCache = new VolumeDataCache.VolumeDataCache(
                (size) => new Uint8Array(size * 3),
                (buffer) => new Uint8Array(buffer));
    
            // GPU caches.
            this._shapeDataTextureCache = new VolumeDataCache.VolumeTextureCache((volume) => ThreeJsUtils.createFloatTexture3D(volume));
            this._intensityVolumeTextureCache = new VolumeDataCache.VolumeTextureCache((volume) => ThreeJsUtils.createFloatTexture3D(volume));
            this._intensityOpacityVolumeTextureCache = new VolumeDataCache.VolumeTextureCache((volume) => ThreeJsUtils.createByteTexture3D(volume));
            this._normalsVolumeTextureCache = new VolumeDataCache.VolumeTextureCache((volume) => ThreeJsUtils.createNormalTexture3D(volume));

            // getters.
            this._boundingBoxGetterProperty = this._defineGetterProperty({
                name: 'boundingBox',
                getter: () => {
                    const shapeData = this.shapeData;
                    if (!shapeData) {
                        return null;
                    }
                    const halfShapeSize = new THREE.Vector3().set(shapeData.sizeX / 2, shapeData.sizeY / 2, shapeData.sizeZ / 2);
                    return new THREE.Box3(halfShapeSize.clone().negate(), halfShapeSize);
                }
            });
            this._normalsTextureGetterProperty = this._defineGetterProperty({
                name: 'normalDataTexture',
                getter: () => this._areNormalsValid ? this._normalsVolumeTextureCache.texture : null
            });
            this._intensityTextureGetterProperty = this._defineGetterProperty({
                name: 'intensityDataTexture',
                getter: () => this._isRemappingValid ? this._intensityVolumeTextureCache.texture : null
            });
            this._intensityOpacityTextureGetterProperty = this._defineGetterProperty({
                name: 'intensityOpacityDataTexture',
                getter: () => this._isRemappingValid ? this._intensityOpacityVolumeTextureCache.texture : null
            });

            // shape properties. 
            this._definePresentationProperty({
                name: 'shapeData',
                nameEx: 'shapeDataTexture',
                getterEx: () => this._shapeDataTextureCache.texture,
                callback: (data) => {
                    this._isRemappingValid = false;
                    this._boundingBoxGetterProperty.notify();

                    this._intensityTextureGetterProperty.notify();
                    this._intensityOpacityTextureGetterProperty.notify();

                    this._areNormalsValid = false;
                    this._normalsTextureGetterProperty.notify();
    
                    this._shapeDataTextureCache.setup(data);   

                    this._tryInvalidateNormalsData();
                    this._tryRemapIntensities();
                }
            });
            this._definePresentationProperty({ 
                name: 'shapeColorMap', 
                nameEx: 'shapeColorMapTexture',
                callback: (value) =>  this._shapeColorMapTextureRenderer.source = value,
                getterEx: () => this._shapeColorMapTextureRenderer.texture
            });
            this._definePresentationProperty({
                name: 'shapeColorMapId',
                value: 'GC',
                callback: (value) => this.shapeColorMap = ColorMaps.Maps[value]
            });    
            this._definePresentationProperty({
                name: 'shapeTransferFunction',
                value: TransferFunction.getDefault(),
                nameEx: 'shapeTransferFunctionTexture',
                callback: (value) => this._shapeTransferFunctionTextureRenderer.source = value,
                getterEx: () => this._shapeTransferFunctionTextureRenderer.texture
            });
            this._definePresentationProperty({
                name: 'shapeTransferFunctionEx',
                value: TransferFunction.getDefault(),
                nameEx: 'shapeTransferFunctionExTexture',
                callback: (value) => this._shapeTransferFunctionExTextureRenderer.source = value,
                getterEx: () => this._shapeTransferFunctionExTextureRenderer.texture
            });
            this._definePresentationProperty({
                name: 'shapeTransferFunctionSource',
                value: 1.0
            });

            // Intensity properties.
            this._definePresentationProperty({
                name: 'intensityData',
                callback: () => {
                    this._isRemappingValid = false;
                    this._tryRemapIntensities()
                } 
            });
            this._definePresentationProperty({
                name: 'intensitySizeFactor',
                value: 1.0,
                callback: () => {
                    this._isRemappingValid = false;
                    this._tryRemapIntensities();
                }
            });
            this._definePresentationProperty({
                name: 'intensityValueRangeScaled',
                value: null
            });
            this._definePresentationProperty({
                name: 'intensityBorderOpacity',
                value: 1.0,
                callback: () => {
                    this._isRemappingValid = false;
                    this._tryRemapIntensities()
                } 
            });
            this._definePresentationProperty({
                name: 'intensityScale',
                value: 0
            });
            this._definePresentationProperty({
                name: 'intensityColorMap',
                nameEx: 'intensityColorMapTexture',
                callback: (value) => this._intensityColorMapTextureRenderer.source = value,
                getterEx: () => this._intensityColorMapTextureRenderer.texture
            });
            this._definePresentationProperty({
                name: 'intensityColorMapId',
                value: 'VIRIDIS',
                callback: (value) => this.intensityColorMap = ColorMaps.Maps[value]
            });       
            this._definePresentationProperty({
                name: 'intensityTransferFunction',
                value: TransferFunction.getDefault(),
                nameEx: 'intensityTransferFunctionTexture',
                callback: (value) => this._intensityTransferFunctionTextureRenderer.source = value,
                getterEx: () => this._intensityTransferFunctionTextureRenderer.texture
            });
            this._definePresentationProperty({
                name: 'intensityTransferFunctionSource',
                value: 0.0
            });
            
            // Presentation properties.
            this._definePresentationProperty({
                name: 'lightInfo',
                value: {
                    ambient: 0.7,
                    diffuse: 0.3,
                    specular: 0.3
                }
            });
            this._areNormalsValid = false;
            this._definePresentationProperty({
                name: 'isShadingEnabled',
                value: false,
                callback: (value) => {
                    if (value) {
                        this._tryInvalidateNormalsData();
                    }           
                }              
            });
            this._definePresentationProperty({ 
                name: 'renderMode', 
                value: 'volume',
                callback: () => {
                    this._tryRemapIntensities();
                    this._tryResetSectionGeometry();
                    this._tryInvalidateNormalsData();
                }
            });
            this._definePresentationProperty({
                name: 'shapeOpacity',
                value: 1.0
            });
            this._definePresentationProperty({
                name: 'filling',
                value: 0.5
            });
            this._definePresentationProperty({
                name: 'spacing',
                value: 1.0
            });
            this._definePresentationProperty({
                name: 'intensityOpacity',
                value: 1.0
            });
            this._isRemappingValid = false;
            this._definePresentationProperty({
                name: 'isIntensityEnabled',
                value: true,
                callback: () => this._tryRemapIntensities()
            });
            this._definePresentationProperty({
                name: 'isShapeTransferFunctionEnabled',
                value: true
            });
            this._definePresentationProperty({
                name: 'isShapeBasedIntensityEnabled',
                value: false
            });
            this._definePresentationProperty({
                name: 'borderOpacity',
                value: 1.0
            }); 
            this._definePresentationProperty({
                name: 'isSliceEnabled',
                value: true,
                callback: () => {
                    this._isSectionValid = false;
                    this._tryResetSectionGeometry();
                }
            });
            this._definePresentationProperty({
                name: 'sliceInfo',
                value: {
                    minX: 0.0,
                    minY: 0.0,
                    minZ: 0.0,
                    maxX: 1.0,
                    maxY: 1.0,
                    maxZ: 1.0
                },
                callback: () => {
                     this._isSectionValid = false;
                     this._tryResetSectionGeometry();
                } 
            });  
            this._definePresentationProperty({
                name: 'coordinatesAdjustmentInfo',
                value: {
                    x: 0.0,
                    y: 0.0,
                    z: 0.0
                }
            });

            // section.
            this._definePresentationProperty({
                name: 'sectionInfo',
                value: {
                    pX: 0.5,
                    pY: 0.5,
                    pZ: 0.5,
                    dX: 0.0,
                    dY: 0.0,
                    dZ: 1.0
                },
                callback: () => {
                    this._isSectionValid = false;
                    this._tryResetSectionGeometry();
                }
            });
            this._definePresentationProperty({
                name: 'textureFilter',
                value: 'linear'
            })
            this._definePresentationProperty({
                name: 'volumeMultiplier',
                value: 1.0
            });
            this._definePresentationProperty({
                name: 'isSectionLineVisible',
                value: true
            });
            this._definePresentationProperty({
                name: 'sectionLineThickness',
                value: 2.0
            });
            this._definePresentationProperty({
                name: 'sectionLineColor',
                value: new THREE.Color('green')
            });
            this._definePresentationProperty({
                name: 'sectionMultiplier',
                value: 1.0
            });

            // bounding box.
            this._definePresentationProperty({
                name: 'isBoundingBoxVisible',
                value: true
            });
            this._definePresentationProperty({
                name: 'boundingBoxThickness',
                value: 2.0
            });
            this._definePresentationProperty({
                name: 'boundingBoxColor',
                value: new THREE.Color('green')
            });
            this._definePresentationProperty({
                name: 'slicedBoundingBoxColor',
                value: new THREE.Color('darkred')
            });
        }

        setupBoundingBoxTransform(mesh) {
            const shapeData = this.shapeData;
            if (!shapeData) {
                return;
            }

            const adj = this.coordinatesAdjustmentInfo;

            mesh.scale.x = shapeData.sizeX;
            mesh.scale.y = shapeData.sizeY;
            mesh.scale.z = shapeData.sizeZ;

            mesh.position.x = -shapeData.sizeX / 2 + adj.x;
            mesh.position.y = -shapeData.sizeY / 2 + adj.y;
            mesh.position.z = -shapeData.sizeZ / 2 + adj.z;

            mesh.updateMatrix();
        }

        setupSlicedBoxTransform(mesh) {
            const shapeData = this.shapeData;
            const sliceInfo = this.sliceInfo;
            if (!shapeData | !sliceInfo) {
                return;
            }

            const adj = this.coordinatesAdjustmentInfo;

            const sizeX = (sliceInfo.maxX - sliceInfo.minX) * this.shapeData.sizeX;
            const sizeY = (sliceInfo.maxY - sliceInfo.minY) * this.shapeData.sizeY;
            const sizeZ = (sliceInfo.maxZ - sliceInfo.minZ) * this.shapeData.sizeZ;

            const offsetX = sliceInfo.minX * this.shapeData.sizeX;
            const offsetY = sliceInfo.minY * this.shapeData.sizeY;
            const offsetZ = sliceInfo.minZ * this.shapeData.sizeZ;

            mesh.position.x = offsetX - shapeData.sizeX / 2 + adj.x;
            mesh.position.y = offsetY - shapeData.sizeY / 2 + adj.y;
            mesh.position.z = offsetZ - shapeData.sizeZ / 2 + adj.z;

            mesh.scale.x = sizeX;
            mesh.scale.y = sizeY;
            mesh.scale.z = sizeZ;

            mesh.updateMatrix();
        }

        _tryResetSectionGeometry() {
            const value = this.sectionInfo;
            const sliceInfo = this.sliceInfo;
            const isSliceEnabled = this.isSliceEnabled;
            if (!value || !sliceInfo || this._isSectionValid || this.renderMode != 'section') {
                return;
            }

            const sliceMin = isSliceEnabled ? 
                new THREE.Vector3(sliceInfo.minX, sliceInfo.minY, sliceInfo.minZ) :
                null;
            const sliceMax = isSliceEnabled ? 
                new THREE.Vector3(sliceInfo.maxX, sliceInfo.maxY, sliceInfo.maxZ) :
                null;

            this._sectionGeometryCache.update(          
                sliceMin,
                sliceMax,
                new THREE.Vector3(value.pX, value.pY, value.pZ),
                new THREE.Vector3(value.dX, value.dY, value.dZ)
            );
            this._isSectionValid = true;
        }
        
        _tryRemapIntensities() {      
            if (!this.isIntensityEnabled || this._isRemappingValid || this.renderMode === 'lego') {
                return;
            }

            const shape = this.shapeData;
            const intensityData = this.intensityData;
            if (!shape || !intensityData) {
                return;
            }

            const spots = intensityData.spots;
            const intensities = intensityData.intensities.values;
            const sizeFactor = this.intensitySizeFactor; 
            const borderOpacity = this.intensityBorderOpacity;

            // resize CPU data caches.
            this._intensityVolumeDataCache.tryResize(
                shape.lengthX, shape.lengthY, shape.lengthZ,
                shape.sizeX, shape.sizeY, shape.sizeZ
            );
            this._intensityOpacityVolumeDataCache.tryResize(
                shape.lengthX, shape.lengthY, shape.lengthZ,
                shape.sizeX, shape.sizeY, shape.sizeZ           
            );

            const transferBuffer = this._intensityVolumeDataCache.buffer;
            const opacityTransferBuffer = this._intensityOpacityVolumeDataCache.buffer;

            const data = {
                volume: this._intensityVolumeDataCache.volume,
                buffer: transferBuffer,
                opacityBuffer: opacityTransferBuffer,
                cuboids: spots,
                intensities: intensities,
                cuboidsSizeScale: sizeFactor,
                cuboidsBorderOpacity: borderOpacity,
            };

            this._taskController.runTask(Tasks.MAP, data, [transferBuffer, opacityTransferBuffer, shape.data.buffer]).
                then((result) => {    
                    this._isRemappingValid = true;

                    this._intensityVolumeDataCache.updateBuffer(result.buffer);
                    this._intensityOpacityVolumeDataCache.updateBuffer(result.opacityBuffer);

                    this._intensityVolumeTextureCache.setup(this._intensityVolumeDataCache.volume);
                    this._intensityOpacityVolumeTextureCache.setup(this._intensityOpacityVolumeDataCache.volume);

                    this._intensityTextureGetterProperty.notify();
                    this._intensityOpacityTextureGetterProperty.notify();
                });
        }

        _tryInvalidateNormalsData() {
            if (this._areNormalsValid || !this.isShadingEnabled || this.renderMode == 'lego') {
                return;
            }

            const volume = this.shapeData;
            if (!volume) {
                return;
            }

            this._normalsVolumeDataCache.tryResize(
                volume.lengthX, volume.lengthY, volume.lengthZ
            );

            const transferBuffer = this._normalsVolumeDataCache.buffer;
            const data = {
                volume: volume,
                buffer: transferBuffer
            };

            const taskPromise = this._taskController.runTask(Tasks.COMPUTE_NORMALS, data, [transferBuffer, volume.data.buffer])
            taskPromise.then((result) => {
                this._normalsVolumeDataCache.updateBuffer(result.buffer);
                this._normalsVolumeTextureCache.setup(this._normalsVolumeDataCache.volume);
                this._areNormalsValid = true;
                this._normalsTextureGetterProperty.notify();
            });
        }

        _onPropertyChanged(name, getter) {
            this.dispatchEvent({ type: PropertyChangedEventName, name: name, getter: getter });
        }

        _defineGetterProperty(descriptor) {
            const name = descriptor.name;
            const getter = descriptor.getter;
            const proxyName = `_proxy_getter_${name}`;

            Object.defineProperty(this, name, {
                get: function() {
                    return getter ? getter() : proxyName;
                }
            });

            return {
                notify: () => this._onPropertyChanged(name, getter),
                set: (value) => {
                    if (value !== undefined) {
                        this[proxyName] = value;
                    }                 
                    this._onPropertyChanged(name, getter);
                }
            };
        }

        _definePresentationProperty(descriptor) {
            const value = descriptor.value;
            const name = descriptor.name;
            const callback = descriptor.callback;
            const nameEx = descriptor.nameEx;

            const proxyName = `_proxy_${name}`;
            const proxyNameEx = nameEx ? `_proxyEx_${nameEx}` : null;

            const getter = () => this[proxyName];
            const getterEx = descriptor.getterEx ? descriptor.getterEx : () => this[proxyNameEx];

            this[proxyName] = undefined;
            const property = {
                get: function() {
                    return this[proxyName];
                },
                set: function(value) {
                    if (this[proxyName] === value) {
                        return;
                    }        
                    this[proxyName] = value;  
                    if (callback) {
                        const valueEx = callback(value);
                        if (proxyNameEx && !getterEx) {
                            this[proxyNameEx] = valueEx;
                        }
                    }
                    this._onPropertyChanged(name, getter);
                    if (proxyNameEx) {            
                        this._onPropertyChanged(nameEx, getterEx);
                    } 
                }
            };
            Object.defineProperty(this, name, property);
            this[name] = value;
        
            if (nameEx) {               
                const propertyEx = {
                    get: getterEx
                };
                Object.defineProperty(this, nameEx, propertyEx);
            }     
        }

        _onReset() {
            this.dispatchEvent({ type: 'reset' });
        }

    }

    return DataContainer;
});
