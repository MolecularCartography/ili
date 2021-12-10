'use strict';

define([
    'three', 'viewgroup3dbase', 'volumeview3d', 'camerahelper'
],
function(THREE, ViewGroup3DBase, View3D, CameraHelper) {


    /**
     * Group of View3D's. Manages shared objects: workspace, renderer, canvas.
     *
     * @param {Workspace} workspace
     * @param {HTMLDivElement} div Container element with a canvas and
     *                             several .View3D elements.
     */
    function ViewGroup3D(workspace, div) {
        ViewGroup3DBase.call(this, workspace, div, {
            createView: function(workspace, group, div, orientationWidget, projectionInfo) {
                return new View3D(workspace, group, div, orientationWidget, projectionInfo);
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
