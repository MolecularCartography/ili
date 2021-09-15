'use strict';

define([
    'three', 'viewgroup3dbase', 'volumeview3d', 'camerahelper'
],
function(THREE, ViewGroup3DBase, View3D, CameraHelper) {

    /**
     * The method is used to update orthogonal camera aspect.
     * @param {*} camera Camera for update.
     * @param {*} aspect Aspect ratio.
     * @param {*} dimensions Bounding box dimensions.
     */
    function updateCameraAspect(camera, aspect, dimensions) {
        const maxDimension = Math.max(dimensions.x, Math.max(dimensions.y, dimensions.z));
        const cameraAspect = camera.aspect;

        const right = maxDimension / 2 * cameraAspect;
        const left = -right;
        const top = maxDimension / 2;
        const bottom = -top;

        camera.left = left;
        camera.right = right;
        camera.top = top;
        camera.bottom = bottom;
        camera.updateProjectionMatrix();
    }


    /**
     * Sets the camera default view.
     * @param {*} camera Camera for update.
     * @param {*} dimensions Bounding box dimensions.
     */
    function setDefaultView(camera, dimensions, horizontalIndex, verticalIndex, screenWbyHRatio, viewGroupRenderer, defaultCameraProperties) {
        CameraHelper.setupCameraDefaultView(camera, screenWbyHRatio, dimensions, horizontalIndex, verticalIndex, viewGroupRenderer, defaultCameraProperties)
    }

    /**
     * Controllers for each camera.
     */
    const cameraControllers = [
        {
            updateAspect: function(c, a, d) { updateCameraAspect(c, a, d);},
            setDefaultView: function(c, d, r, v, p) { setDefaultView(c, d, 0, 1, r, v, p); }
        },
        {
            updateAspect: function(c, a, d) { updateCameraAspect(c, a, d); },
            setDefaultView: function(c, d, r, v, p) { setDefaultView(c, d, 0, 1, r, v, p); }
        },
        {
            updateAspect: function(c, a, d) { updateCameraAspect(c, a, d); },
            setDefaultView: function(c, d, r, v, p) { setDefaultView(c, d, 0, 1, r, v, p); }
        },
        {
            updateAspect: function(c, a, d) { updateCameraAspect(c, a, d); },
            setDefaultView: function(c, d, r, v, p) { setDefaultView(c, d, 0, 1, r, v, p); }
        }
    ];

    /**
     * Group of View3D's. Manages shared objects: workspace, renderer, canvas.
     *
     * @param {Workspace} workspace
     * @param {HTMLDivElement} div Container element with a canvas and
     *                             several .View3D elements.
     */
    function ViewGroup3D(workspace, div) {
        ViewGroup3DBase.call(this, workspace, div, {
            createView: function(group, div, index, orientationWidget, viewGroupRenderer) {
                return new View3D(group, div, workspace, cameraControllers[index], orientationWidget, viewGroupRenderer);
            },
            createSpotLabel: function(group, scene) {
                return null;
            }
        });     
    }

    ViewGroup3D.prototype = Object.create(ViewGroup3DBase.prototype);
       
    Object.assign(ViewGroup3D, ViewGroup3DBase);

    return ViewGroup3D;
});
