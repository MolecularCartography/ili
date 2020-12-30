'use strict';

define([
    'workspacebase', 'volumeinputfilesprocessor', 'volumescene3d', 'volumespotscontroller', 
    'three', 'threejsutils', 'volumeremappingprocessor', 'volumedatacache', 'shaderloader'
],
function (WorkspaceBase, InputFilesProcessor, Scene3D, SpotsController, THREE, ThreeJsUtils, VolumeRemappingController, VolumeDataCache, ShaderLoader)
{
    /**
     * Main application workspace. It works in 3 modes:
     * 1. UNDEFINED. In may have measures but with no visual representation.
     * 2. MODE_2D. It has image. Spots are mapped on this image using X and Y
     *    coordinates (Z ignored).
     * 3. MODE_3D. It has a THREE.js scene with a mesh, light souces ets.
     *
     * Workspace tracks changes in measures, images and meshes and fires appropriates
     * events to allow updates. Workspace may have multiple views (2D and 3D view
     * shouldn't be mixed). Different 3D view for instance may show the same scene
     * from different perspectives.
     *
     * 'status'/'status-change' intended to inform
     * the user on progress in long-running tasks.
     *
     */
    function Workspace(spotsController) {
        WorkspaceBase.call(this, spotsController, 
            new InputFilesProcessor(this),
            Workspace.TaskType,
            Workspace.Events);

        this._intensityVolumeDataCache = new VolumeDataCache.VolumeDataCache(
            (size) => new Float32Array(size),
            (buffer) => new Float32Array(buffer));
        this._intensityVolumeTextureCache = new VolumeDataCache.VolumeTextureCache((volume) => ThreeJsUtils.createFloatTexture3D(volume));

        this._intensityOpacityVolumeDataCache = new VolumeDataCache.VolumeDataCache(
            (size) => new Uint8Array(size),
            (buffer) => new Uint8Array(buffer));
        this._intensityOpacityVolumeTextureCache = new VolumeDataCache.VolumeTextureCache((volume) => ThreeJsUtils.createByteTexture3D(volume));

        this._normalsVolumeDataCache = new VolumeDataCache.VolumeDataCache(
            (size) => new Uint8Array(size * 3),
            (buffer) => new Uint8Array(buffer));
        this._normalsVolumeTextureCache = new VolumeDataCache.VolumeTextureCache((volume) => ThreeJsUtils.createNormalTexture3D(volume));

        this._scene3d = new Scene3D(this, spotsController);

        this.spotsController.addEventListener(SpotsController.Events.SCALE_CHANGE, this._onSpotScaleChange.bind(this));
        this.spotsController.addEventListener(SpotsController.Events.BORDER_CHANGE, this._onBorderOpacityChange.bind(this));
        this.spotsController.addEventListener(SpotsController.Events.INTENSITIES_CHANGE, this._mapVolume.bind(this));

        const shaderLoader = new ShaderLoader();
        shaderLoader.load(
            'js/volume/shaders/volumeshader_vs.glsl',
            this._onVertexShaderLoaded.bind(this),
            (progress) => this._onShaderLoadProgress('vertex', progress),
            (error) => this._onShaderLoadError('vertex', error),
        );
        shaderLoader.load(
            'js/volume/shaders/volumeshader_fs.glsl',
            this._onFragmentShaderLoaded.bind(this),
            (progress) => this._onShaderLoadProgress('fragment', progress),
            (error) => this._onShaderLoadError('fragment', error),
        );
        return this;
    }

    Object.assign(Workspace, WorkspaceBase);
    Object.assign(Workspace.Events, {
        SHAPE_LOAD: 'shape-load'
    });
    
    Workspace.Mode = {
        MODE_3D: 3,
    };

    /**
     * Asynchromous tasks. At most one task with the same key may run
     * (no 2 images could be loading simultaniously). Newer task cancels older one.
     * 'worker' is name of JS file in 'js/workers' or constructor of a Worker-like
     * class.
     */
    Workspace.TaskType = Object.assign({
        LOAD_MEASURES: {
            key: 'load-measures',
            worker: 'js/volume/workers/MeasuresLoader.js'
        },
        MAP: {
            key: 'map',
            worker: 'js/volume/workers/CuboidMapper.js'
        },
        LOAD_SHAPE: {
            key: 'load_shape',
            worker: 'js/volume/workers/VolumeLoader.js' 
        },
        LOAD_NORMALS: {
            key: 'load_normals',
            worker: 'js/volume/workers/NormalsLoader.js'
        },
        LOAD_SHADERS: {
            key: 'load_shaders',
            worker: 'js/common/utility/ShaderLoader.js'
        }
    }, WorkspaceBase.TaskType);

    Workspace.prototype = Object.create(WorkspaceBase.prototype, {
        /**
         * Switches the workspace to MODE_3D and start volume loading.
         */
        loadShape: {
            value: function(blob) {
                this._scene3d.reset();
                this._normalsTexture = null;
                this._shape = null;

                this.mode = Workspace.Mode.MODE_3D;
                this._doTask(Workspace.TaskType.LOAD_SHAPE, blob[0]).then(function(result) {
                    this._shape = result.shape;
                    this._notify(Workspace.Events.SHAPE_LOAD, this._shape);
                    this._scene3d.shapeData = this._shape;
                    this._mapVolume();
                    if (this._scene3d.shadingEnabled) {
                        this.requestNormalTexture();
                    }
                }.bind(this));
            }
        },

        /**
         * Starts loading intensities file.
         */
        loadIntensities: {
            value: function(blob) {
                this._doTask(Workspace.TaskType.LOAD_MEASURES, blob[0]).
                    then(function (result) {
                        this.spotsController.spots = result.spots;
                        this.spotsController.measures = result.measures;
                        this._mapVolume();
                    }.bind(this));
            }
        },

        requestNormalTexture: {
            value: function() {
                if (this._normalsTexture) {
                    return this._normalsTexture;
                }

                const volume = this._shape;
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

                this._doTask(Workspace.TaskType.LOAD_NORMALS, data, [transferBuffer, volume.data.buffer])
                    .then(function (result) {
                        this._normalsVolumeDataCache.updateBuffer(result.buffer);
                        this._normalsVolumeTextureCache.setup(this._normalsVolumeDataCache.volume);
                        this._normalsTexture = this._normalsVolumeTextureCache.texture;
                        this._scene3d.normalsTexture = this._normalsTexture;
                    }.bind(this));
            }
        },

        _onSpotScaleChange: {
            value: function () {
                this._mapVolume();
            }
        },  

        _onBorderOpacityChange: {
            value: function () {
                this._mapVolume();
            }
        },  

        _mapVolume: {
            value: function() {
                const spots = this._spotsController.spots;
                const volume = this._scene3d.shapeData;
                const activeMeasure = this._spotsController.activeMeasure;

                if (!spots || !activeMeasure || !volume) {
                    return;
                }

                const shape = this._shape;
                this._intensityVolumeDataCache.tryResize(
                    shape.lengthX, shape.lengthY, shape.lengthZ,
                    shape.sizeX, shape.sizeY, shape.sizeZ
                );
                this._intensityOpacityVolumeDataCache.tryResize(
                    shape.lengthX, shape.lengthY, shape.lengthZ,
                    shape.sizeX, shape.sizeY, shape.sizeZ
                );

                const transferBuffer = this._intensityVolumeDataCache.buffer;
                const opacityTransferBuffer =  this._intensityOpacityVolumeDataCache.buffer;

                const data = {
                    volume: this._intensityVolumeDataCache.volume,
                    buffer: transferBuffer,
                    opacityBuffer: opacityTransferBuffer,
                    cuboids: spots,
                    intensities: activeMeasure.values,
                    cuboidsSizeScale: this._spotsController.globalSpotScale,
                    cuboidsBorderOpacity: this._spotsController.spotBorder
                };
                this._doTask(Workspace.TaskType.MAP, data, [transferBuffer]).
                    then(function (result) {          
                        this._intensityVolumeDataCache.updateBuffer(result.buffer);
                        this._intensityOpacityVolumeDataCache.updateBuffer(result.opacityBuffer);

                        this._intensityVolumeTextureCache.setup(this._intensityVolumeDataCache.volume);
                        this._intensityOpacityVolumeTextureCache.setup(this._intensityOpacityVolumeDataCache.volume);

                        this._scene3d.intensityTexture = this._intensityVolumeTextureCache.texture;
                        this._scene3d.intensityOpacityTexture = this._intensityOpacityVolumeTextureCache.texture;
                    }.bind(this));
            }
        }, 

        mode: {
            get: function() {
                return this._mode;
            },

            set: function(value) {
                if (this._mode == value) {
                    return;
                }
                this._mode = value;
                this._notify(Workspace.Events.MODE_CHANGE);
            }
        },

        shape: {
            get: function() {
                return this._shape;
            }
        },  

        scene3d: {
            get: function() {
                return this._scene3d;
            }
        },

        _onVertexShaderLoaded: {
            value: function(shader) {
                this._scene3d.vertexShader = shader;
            }
        },

        _onFragmentShaderLoaded: {
            value: function(shader) {
                this._scene3d.fragmentShader = shader;
            }
        },

        _onShaderLoadProgress: {
            value: function(shaderName, progress) {
                const message = 'Performing ' + shaderName + ' shader' + ' loading:';
                console.log(message, progress);
            }
        },

        _onShaderLoadError: {
            value: function(shaderName, error) {
                const message = 'Failed to load ' + shaderName + ': ';
                console.error(message, error);
            }
        },
    });

    return Workspace;
});
