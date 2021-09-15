'use strict';

define([
    'three', 'view3dbase'
],
function(THREE, View3DBase) {
    /**
     * View indise ViewGroup3D. All View3Ds share single canvas from the group.
     * Each view has own camera and own empty DIV for handling user input and
     * calculating viewport position.
     *
     * @param {ViewGroup3D} droup.
     * @param {HTMLDivElement} div.
     */
    function View3D(group, div, workspace, cameraController, orientationWidget, viewGroupRenderer) {
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        camera.position.x = -30;
        camera.position.y = 40;
        camera.position.z = 30;
        this._workspace = workspace;
        this._cameraController = cameraController;
        this.orientationWidget = orientationWidget;
        this._viewGroupRenderer = viewGroupRenderer;

        View3DBase.call(this, group, div, camera);
        return this;
    }

    View3D.prototype = Object.create(View3DBase.prototype, {
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
                return this._workspace.geometry;
            }
        },

        _shapeSize: {
            get: function() {
                const shape = this._shape;
                if (!shape) {
                    return null;
                }
                return shape.boundingBox;
            }
        }
    });

    return View3D;
});
