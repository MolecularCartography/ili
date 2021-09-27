'use strict';

define([
    'workspacebase', 'filecombination', 'volumescene3d', 'volumespotscontroller', 
    'three', 'threejsutils', 'shaderschunk', 'volumedatacontainer', 'bounds', 'colormaps'
],
function (WorkspaceBase, FileCombination, Scene3D, SpotsController, THREE, ThreeJsUtils, ShadersChunk, DataContainer, Bounds, ColorMaps)
{
    const SHADERS_PATH_PREFIX = 'js/volume/shaders';

    // The workspace internal types.
    const TASKS = {
        LOAD_MEASURES: {
            key: 'load-measures',
            worker: 'js/volume/workers/MeasuresLoader.js'
        },
        LOAD_SHAPE: {
            key: 'load_shape',
            worker: 'js/volume/workers/VolumeLoader.js' 
        }
    };

    // the workspace file formats.
    const FILE_FORMATS = [
        new FileCombination('csv', (owner, blob) => owner._onIntensityLoaded(blob)),
        new FileCombination('nrrd', (owner, blob) => owner._onShapeLoaded(blob)),
    ];

    // volume shaders header files.
    const SHADER_HEADERS = [
        'Math',
        'VolumeCommon',
        'VolumeRaycastingCommon',
        'VolumeShading'
    ];

    // The workspace events.
    const EVENTS = {};

    /**
     * Volume application workspace.
     */
    function Workspace(spotsController) {
        WorkspaceBase.call(
            this, spotsController, 
            FILE_FORMATS,
            EVENTS);

        this.shaderChunk = new ShadersChunk({
            extendPath: (id) => `${SHADERS_PATH_PREFIX}/${id}`
        }, SHADER_HEADERS);      

        this.dataContainer = new DataContainer(this.taskController);
        this._scene3d = new Scene3D(this);

        // setup spots controller events.
        const spotsCommonHandler = () => {
            this.dataContainer.intensityOpacity = this._spotsController.globalSpotOpacity;
            this.dataContainer.intensityColorMap = this._spotsController.colorMap;
            this.dataContainer.intensityValueRangeScaled = new Bounds(this._spotsController.minValue, this._spotsController.maxValue);
            const realScale = 
                this._spotsController.scale == SpotsController.Scale.LINEAR ? 0 :
                this._spotsController.scale == SpotsController.Scale.LOG ? 2 : 0;
            this.dataContainer.intensityScale = realScale;
        };
        this._spotsController.addEventListener(SpotsController.Events.MAPPING_CHANGE, spotsCommonHandler);
        this._spotsController.addEventListener(SpotsController.Events.ATTR_CHANGE, spotsCommonHandler);
        this._spotsController.addEventListener(SpotsController.Events.SCALE_CHANGE, () => {
            this.dataContainer.intensitySizeFactor = this._spotsController.globalSpotScale;
        });
        this._spotsController.addEventListener(SpotsController.Events.BORDER_CHANGE, () => {
            this.dataContainer.intensityBorderOpacity = this._spotsController.spotBorder;
        });
        this._spotsController.addEventListener(SpotsController.Events.ACTIVE_MEASURES_CHANGED, () => {
            this.dataContainer.intensityData = {
                spots: this._spotsController.spots,
                intensities: this._spotsController.activeMeasure
            };
        });

        // setup data container events.
        this.dataContainer.addEventListener('propertyChanged', (args) => {
            switch (args.name) {
                case 'boundingBox':
                    this._notify(WorkspaceBase.Events.BOUNDS_CHANGE);
                    break;
            }
        });

        return this;
    }

    Object.assign(Workspace, WorkspaceBase);
    
    Workspace.Mode = {
        MODE_3D: 3,
    };

    Workspace.prototype = Object.create(WorkspaceBase.prototype, {

        getDataBoundingBox: {
            value: function() {
                return this.dataContainer.boundingBox;
            }
        }, 

        _onShapeLoaded: {
            value: function(blob) {
                this.taskController.runTask(TASKS.LOAD_SHAPE, blob[0]).
                    then((result) => {
                        this.mode = Workspace.Mode.MODE_3D;
                        
                        // reset the settings to improve initialization performance.
                        this.dataContainer.isShadingEnabled = false;
                        this.dataContainer.isIntensityEnabled = true;

                        // submit shape data to data container.
                        this.dataContainer.shapeData = result.shape;
                    });           
            }
        },

        _onIntensityLoaded: {
            value: function(blob) {
                this.taskController.runTask(TASKS.LOAD_MEASURES, blob[0]).
                    then((result) => {
                        this._spotsController.spots = result.spots;
                        this._spotsController.measures = result.measures;
                        this.dataContainer.measures = result;
                    });
            }
        },

        scene3d: {
            get: function() {
                return this._scene3d;
            }
        }

    });

    return Workspace;
});
