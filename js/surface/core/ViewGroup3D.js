'use strict';

define([
    'three', 'viewgroup3dbase', 'surfaceview3d', 'spotlabel3d', 'camerahelper'
],
function(THREE, ViewGroup3DBase, View3D, SpotLabel3D, CameraHelper) {

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
                return new SpotLabel3D(group, scene);
            }
        });
    }

    ViewGroup3D.prototype = Object.create(ViewGroup3DBase.prototype);

    ViewGroup3D.Layout = ViewGroup3DBase.Layout;

    return ViewGroup3D;
});
