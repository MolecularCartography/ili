'use strict';

define([
    'workspacebase', 'volumeinputfilesprocessor', 'volumescene3d', 'volumespotscontroller', 'three', 'threejsutils', 'shaderloader',
],
function (WorkspaceBase, InputFilesProcessor, Scene3D, SpotsController, THREE, ThreeJsUtils, ShaderLoader)
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

        this._scene3d = new Scene3D(spotsController);
        this.spotsController.addEventListener(SpotsController.Events.SCALE_CHANGE, this._onSpotScaleChange.bind(this));
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
                this.mode = Workspace.Mode.MODE_3D;
                this._doTask(Workspace.TaskType.LOAD_SHAPE, blob[0]).then(function(result) {
                    this._shape = result.shape;
                    this._notify(Workspace.Events.SHAPE_LOAD, this._shape);
                    this._scene3d.shapeData = this._shape;
                    this._mapVolume();
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

        _onSpotScaleChange: {
            value: function () {
                if (this.mode == Workspace.Mode.MODE_3D) {
                    this._mapVolume(Scene3D.RecoloringMode.NO_COLORMAP);
                }
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

                const data = {
                    volume: volume,
                    cuboids: spots,
                    intensities: activeMeasure.values,
                    cuboidsSizeScale: this._spotsController.globalSpotScale,
                };
                this._doTask(Workspace.TaskType.MAP, data).
                    then(function (result) {
                        this._scene3d.intensityData = result.data;
                    }.bind(this));
                this._doTask(Workspace.TaskType.LOAD_NORMALS, volume)
                    .then(function (normalsData) {
                        this._scene3d.normalsData = normalsData.data;
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

                // TODO: implement.

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
