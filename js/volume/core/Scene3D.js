'use strict';

define([
    'eventsource', 'propertychangedmanager', 'scene3dbase', 'three', 'threejsutils', 'utils', 'colormaps', 
    'volumerendermesh', 'legocuboidsrendermesh', 'volumesectionrendermesh', 'bordercubemesh', 'volumesectionbordermesh', 'bounds', 'spotscontrollerbase'
],
function(EventSource, PropertyChangedManager, Scene3DBase, THREE, ThreeUtils, Utils, ColorMaps, 
    VolumeRenderMesh, LegoCuboidsRenderMesh, VolumeSectionRenderMesh, BorderCubeMesh, VolumeSectionBorderMesh, Bounds, SpotsControllerBase) {

    const MODE_MESH_MAP = new Map([
        ['volume', (controller) => new VolumeRenderMesh(controller)],
        ['lego', (controller) => new LegoCuboidsRenderMesh(controller)],
        ['section', (controller) => {
            const group = new THREE.Object3D();
            group.add((new VolumeSectionRenderMesh(controller)).container);
            group.add((new VolumeSectionBorderMesh(controller)).container);
            return {
                container: group
            };
        }]
    ]);

    const EVENT_MAP = new Map([
        ['renderMode', (scene, getter) => scene._resetRenderMode(getter())]
    ]);

    function Scene3D(workspace, spotsController) {
        Scene3DBase.call(this, spotsController);

        this._workspace = workspace;
        this._renderMeshes = new Map();

        // define render controller.
        const dataContainer = workspace.dataContainer;
        this._renderDataController = {
            dataContainer: workspace.dataContainer,
            shaderChunk: workspace.shaderChunk,
            requestRedraw: () => this.requestRedraw()
        };

        // always on border mesh.
        this._boundingBoxMesh = new BorderCubeMesh(this._renderDataController); 
        this._meshContainer.add(this._boundingBoxMesh.container);

        this._propertyChangedManager = new PropertyChangedManager(
            dataContainer, EVENT_MAP, this, 
            () => this.requestRedraw());
        this._propertyChangedManager.invokeAllActions();
    };

    Object.assign(Scene3D, Scene3DBase);

    Scene3D.prototype = Object.create(Scene3DBase.prototype, {
        clone: {
            value: function(eventName, listener) {
                // Clone is too expensive for the scene.
                return null;
            }
        },
        
        _resetRenderMode: {
            value: function(value) {
                // clarify render mesh for the corresponding render mode.
                let existingMesh = this._renderMeshes.get(value);
                if (!existingMesh) {
                    const activator = MODE_MESH_MAP.get(value);
                    if (!activator) {
                        console.warn('Undetected render mode')
                    } else {
                        existingMesh = activator(this._renderDataController);
                        this._renderMeshes.set(value, existingMesh);
                    }                  
                }

                if (this._currentRenderMesh !== existingMesh) {
                    if (this._currentRenderMesh) {
                        this._meshContainer.remove(this._currentRenderMesh.container);
                    }         
                    this._currentRenderMesh = existingMesh;
                    if (existingMesh) {
                        this._meshContainer.add(this._currentRenderMesh.container);
                    }                
                } 
                this.requestRedraw();
            }
        },

        requestRedraw: {
            value: function() {
                this._notify(Scene3D.Events.CHANGE);
            }
        },

        render: {
            value: function(renderer, camera) {
                renderer.render(this._scene, camera);
            }
        }

    });

    return Scene3D;
});
