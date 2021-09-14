'use strict';

define([
    'three', 'view3dbase', 'volumeworkspace'
],
function(THREE, View3DBase, Workspace) {
    /**
     * View indise ViewGroup3D. All View3Ds share single canvas from the group.
     * Each view has own camera and own empty DIV for handling user input and
     * calculating viewport position.
     *
     * @param {ViewGroup3D} droup.
     * @param {HTMLDivElement} div.
     */
    function View3D(group, div, workspace, cameraController, orientationWidget, viewGroupRenderer) {
        View3DBase.call(this, group, div, new THREE.OrthographicCamera());

        this._workspace = workspace;
        this._cameraController = cameraController;
        this.orientationWidget = orientationWidget;
        this._viewGroupRenderer = viewGroupRenderer;

        this.addEventListener(View3DBase.Events.ASPECT_CHANGE, this._onAspectChange.bind(this));
        this._workspace.addEventListener(Workspace.Events.SHAPE_LOAD, this._onShapeChange.bind(this));
        return this;
    }

    View3D.prototype = Object.create(View3DBase.prototype, {
        _onAspectChange: {
            value: function(aspect) {
                const shapeSize = this._shapeSize;
                if (!shapeSize) {
                    return;
                }
                this._cameraController.updateAspect(this.camera, aspect, shapeSize);
                this.camera.updateProjectionMatrix();
                this._updateControls();
            }
        },

        _onShapeChange: {
            value: function(shape) {
                this._requestDefaultView();
            }
        },

        _requestDefaultView: {
            value: function(screenWbyHRatio, defaultCameraProperties) {
                const shapeSize = this._shapeSize;
                if (!shapeSize) {
                    return;
                }
                this._cameraController.setDefaultView(this.camera, shapeSize, screenWbyHRatio, this._viewGroupRenderer, defaultCameraProperties);
                this._cameraController.updateAspect(this.camera, this.camera.aspect, shapeSize);
                this.camera.updateProjectionMatrix();
                this._updateControls();
            }
        },

        _shape: {
            get: function() {
                return this._workspace.shape;
            }
        },

        _shapeSize: {
            get: function() {
                const shape = this._shape;
                if (!shape) {
                    return null;
                }
                return new THREE.Vector3(shape.sizeX, shape.sizeY, shape.sizeZ);
            }
        }
    });

    return View3D;
});
