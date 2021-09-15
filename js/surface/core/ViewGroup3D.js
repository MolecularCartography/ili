'use strict';

define([
    'three', 'viewgroup3dbase', 'surfaceview3d', 'spotlabel3d', 'camerahelper'
],
function(THREE, ViewGroup3DBase, View3D, SpotLabel3D, CameraHelper) {

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

    function setDefaultView(camera, bounds, horizontalIndex, verticalIndex, screenWbyHRatio, viewGroupRenderer, defaultCameraProperties) {
        const dimensions = new THREE.Vector3().subVectors(bounds.max, bounds.min);
        CameraHelper.setupCameraDefaultView(camera, screenWbyHRatio, dimensions, horizontalIndex, verticalIndex, viewGroupRenderer, defaultCameraProperties)
    }

    /**
     * Controllers for each camera.
     */
    const cameraControllers = [
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
            createView: function(group, div, i, orientationWidget, viewGroupRenderer) {
                return new View3D(group, div, workspace, cameraControllers[i], orientationWidget, viewGroupRenderer);
            },
            createSpotLabel: function(group, scene) {
                return new SpotLabel3D(group, scene);
            }
        });
    }

    ViewGroup3D.prototype = Object.create(ViewGroup3DBase.prototype);

    ViewGroup3D.Layout = ViewGroup3DBase.Layout;

    return ViewGroup3D;
});
