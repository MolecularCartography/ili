'use strict';

define([
    'workspacebase', 'colormaps', 'eventsource', 'imageloader', 'materialloader',
    'surfacescene2d', 'surfacescene3d', 'surfacespotscontroller', 'three', 'filecombination'
],
function (WorkspaceBase, ColorMap, EventSource, ImageLoader, MaterialLoader,
    Scene2D, Scene3D, SpotsController, THREE, FileCombination)
{
    // the workspace file formats for loaded.
    const SupportedImageFormats = ['png', 'jpg', 'jpeg'];
    const FileFormats = [
        new FileCombination('csv', (owner, blob) => owner.loadIntensities(blob)),
        new FileCombination(SupportedImageFormats, (owner, blob) => owner.loadImage(blob), FileCombination.RELATION.OR),
        new FileCombination('stl', (owner, blob) => owner.loadMesh(blob)),
        new FileCombination('obj', (owner, blob) => owner.loadMesh(blob)),
        new FileCombination(['mtl', new FileCombination(SupportedImageFormats,
            null, FileCombination.RELATION.OR)], (owner, blob) => owner.loadMaterial(blob), FileCombination.RELATION.AND)
    ];

    // the workspace custom events.
    const Events = {};

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
        WorkspaceBase.call(
            this, spotsController, 
            FileFormats,
            Events);

        this._scene3d = new Scene3D(spotsController);
        this._scene2d = new Scene2D(spotsController);

        this.spotsController.addEventListener(SpotsController.Events.SCALE_CHANGE, this._onSpotScaleChange.bind(this));

        return this;
    }

    Object.assign(Workspace, WorkspaceBase);

    Workspace.Mode = {
        MODE_2D: 2,
        MODE_3D: 3
    };

    /**
     * Asynchromous tasks. At most one task with the same key may run
     * (no 2 images could be loading simultaniously). Newer task cancels older one.
     * 'worker' is name of JS file in 'js/workers' or constructor of a Worker-like
     * class.
     */
    Workspace.TaskType = Object.assign({
        LOAD_IMAGE: {
            key: 'load-image',
            worker: ImageLoader
        },
        LOAD_MESH: {
            key: 'load-mesh',
            worker: 'js/surface/workers/MeshLoader.js'
        },
        LOAD_MATERIAL: {
            key: 'load-material',
            worker: MaterialLoader
        },
        LOAD_MEASURES: {
            key: 'load-measures',
            worker: 'js/surface/workers/MeasuresLoader.js'
        },
        MAP: {
            key: 'map',
            worker: 'js/surface/workers/Mapper.js'
        },
    }, WorkspaceBase.TaskType);

    Workspace.prototype = Object.create(WorkspaceBase.prototype, {

        /**
         * Gets data bounding box.
         */
        getDataBoundingBox: {
            value: function() {
                return this._currentScene.getDataBoundingBox();
            }
        },

        /**
         * Switches the workspace to MODE_2D and starts image loading.
         */
        loadImage: {
            value: function(blob) {
                this.mode = Workspace.Mode.MODE_2D;
                this._scene2d.resetImage();
                this.taskController.runTask(Workspace.TaskType.LOAD_IMAGE, blob[0]).
                    then(function(result) {
                        if (this.mode == Workspace.Mode.MODE_2D) {
                            this._notify(WorkspaceBase.Events.BOUNDS_CHANGE);
                        }
                        this._scene2d.setImage(result.url, result.width, result.height);
                    }.bind(this));
            }
        },

        /**
         * Switches the workspace to MODE_3D and starts mesh loading.
         */
        loadMesh: {
            value: function(blob) {
                this.mode = Workspace.Mode.MODE_3D;
                this.taskController.runTask(Workspace.TaskType.LOAD_MESH, blob[0]).then(function(result) {
                    this.geometry = new THREE.BufferGeometry();
                    for (var name in result.attributes.geometry) {
                        var attribute = result.attributes.geometry[name];
                        this.geometry.setAttribute(name, new THREE.BufferAttribute(attribute.array, attribute.itemSize));
                    }
                    this._scene3d.materialName = result.attributes.materialName;
                    this._scene3d.geometry = this.geometry;
                    if (this.mode == Workspace.Mode.MODE_3D) {
                        this._notify(WorkspaceBase.Events.BOUNDS_CHANGE);
                    }
                    if (this.spotsController.spots) {
                        this._mapMesh(Scene3D.RecoloringMode.USE_COLORMAP);
                    }
                }.bind(this));
            }
        },

        loadMaterial: {
            value: function (blob) {
                this.mode = Workspace.Mode.MODE_3D;
                this.taskController.runTask(Workspace.TaskType.LOAD_MATERIAL, blob).then(function (result) {
                    this._scene3d.materials = result.materials;
                }.bind(this));
            }
        },

        /**
         * Starts loading intensities file.
         */
        loadIntensities: {
            value: function(blob) {
                this.taskController.runTask(Workspace.TaskType.LOAD_MEASURES, blob[0]).
                    then(function (result) {
                        this.spotsController.spots = result.spots;
                        this.spotsController.measures = result.measures;
                        if (this._mode == Workspace.Mode.MODE_3D) {
                            this._mapMesh(Scene3D.RecoloringMode.USE_COLORMAP);
                        }
                    }.bind(this));
            }
        },

        /**
         * Prepares this._mapping for fast recoloring the mesh.
         */
        _mapMesh: {
            value: function(recoloringMode) {
                if (!this._scene3d.geometry || !this.spotsController.spots) {
                    return;
                }
                var args = {
                    vertices: this._scene3d.geometry.getAttribute('position').array,
                    spots: this.spotsController.spots,
                    scale: this.spotsController.globalSpotScale
                };
                this.taskController.runTask(Workspace.TaskType.MAP, args).then(function(results) {
                    this._scene3d.mapping = {
                        closestSpotIndeces: results.closestSpotIndeces,
                        closestSpotDistances: results.closestSpotDistances,
                        recoloringMode: recoloringMode
                    };
                }.bind(this));
            }
        },

        _onModeChange: {
            value: function(mode) {
                if (mode == Workspace.Mode.MODE_3D) {
                    this._scene2d.resetImage();
                    this.taskController.cancelTask(Workspace.TaskType.LOAD_IMAGE);
                    this._currentScene = this._scene3d;
                }
                if (mode == Workspace.Mode.MODE_2D) {
                    this._scene3d.geometry = null;
                    this.taskController.cancelTask(Workspace.TaskType.LOAD_MESH);
                    this._currentScene = this._scene2d;
                }
            }       
        },

        _onSpotScaleChange: {
            value: function () {
                if (this.mode == Workspace.Mode.MODE_3D) {
                    this._mapMesh(Scene3D.RecoloringMode.NO_COLORMAP);
                }
            }
        },

        scene2d: {
            get: function() {
                return this._scene2d;
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
