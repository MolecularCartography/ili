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

        this.addEventListener(View3DBase.Events.ASPECT_CHANGE, (aspect) => {
            const shapeSize = this._shapeSize;
            if (!shapeSize) {
                return;
            }
            this._cameraController.updateAspect(this.camera, aspect, shapeSize);
            this.camera.updateProjectionMatrix();
            this._updateControls();
        });

        workspace.dataContainer.addEventListener('propertyChanged', (event) => {
            switch (event.name) {
                case 'shapeData':
                    this._requestDefaultView();
                    break;
            }
        });
        return this;
    }

    View3D.prototype = Object.create(View3DBase.prototype, {

        _requestDefaultView: {
            value: function(screenWbyHRatio, defaultCameraProperties) {
                const shapeSize = this._workspace.dataContainer.shapeData;
                if (!shapeSize) {
                    return;
                }
                this._cameraController.setDefaultView(this.camera, shapeSize, screenWbyHRatio, this._viewGroupRenderer, defaultCameraProperties);
                this._cameraController.updateAspect(this.camera, this.camera.aspect, shapeSize);
                this.camera.updateProjectionMatrix();
                this._updateControls();
            }
        }

    });

    return View3D;
});
