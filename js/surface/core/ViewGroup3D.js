'use strict';

define([
    'three', 'viewgroup3dbase', 'surfaceview3d', 'spotlabel3d'
],
function(THREE, ViewGroup3DBase, View3D, SpotLabel3D) {
    /**
     * Group of View3D's. Manages shared objects: workspace, renderer, canvas.
     *
     * @param {Workspace} workspace
     * @param {HTMLDivElement} div Container element with a canvas and
     *                             several .View3D elements.
     */
    function ViewGroup3D(workspace, div) {
        ViewGroup3DBase.call(this, workspace, div, {
            createView: function(group, div, i, orientationWidget) {
                return new View3D(group, div, orientationWidget);
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
