'use strict';

define([
    'three', 'viewgroup3dbase', 'volumeview3d'
],
function(THREE, ViewGroup3DBase, View3D) {

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
     * Relative offset in direction of view.
     */
    const directionMultipler = 2;

    /**
     * Sets the camera default view.
     * @param {*} camera Camera for update.
     * @param {*} dimensions Bounding box dimensions.
     * @param {*} depthIndex Depth axis index.
     */
    function setDefaultView(camera, dimensions, horizontalIndex, verticalIndex) {
        const depthIndex = 3 - (horizontalIndex + verticalIndex);

        const offset = new THREE.Vector3();
        offset.setComponent(depthIndex, 1);

        const upVector = new THREE.Vector3();
        upVector.setComponent(verticalIndex, 1);

        const maxDimension = Math.max(dimensions.x, Math.max(dimensions.y, dimensions.z));
        const offsetMultiplier = maxDimension * directionMultipler;
        camera.position.multiplyVectors(new THREE.Vector3(offsetMultiplier, offsetMultiplier, offsetMultiplier), offset);
        camera.near = 0.001;
        camera.far = 10000;
        
        camera.up = upVector;
        camera.zoom = 1;
    }

    /**
     * Controllers for each camera.
     */
    const cameraControllers = [
        {
            updateAspect: function(c, a, d) { updateCameraAspect(c, a, d); },
            setDefaultView: function(c, d) { setDefaultView(c, d, 0, 1); }
        },
        {
            updateAspect: function(c, a, d) { updateCameraAspect(c, a, d); },
            setDefaultView: function(c, d) { setDefaultView(c, d, 0, 1); }
        },
        {
            updateAspect: function(c, a, d) { updateCameraAspect(c, a, d); },
            setDefaultView: function(c, d) { setDefaultView(c, d, 0, 1); }
        },
        {
            updateAspect: function(c, a, d) { updateCameraAspect(c, a, d); },
            setDefaultView: function(c, d) { setDefaultView(c, d, 0, 1); }
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
            createView: function(group, div, index, orientationWidget) {
                return new View3D(group, div, workspace, cameraControllers[index], orientationWidget);
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
