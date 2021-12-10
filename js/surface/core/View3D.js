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
     function View3D(workspace, group, div, orientationWidget, projectionInfo) {
        View3DBase.call(this, 
            workspace, 
            group, 
            div, 
            new THREE.PerspectiveCamera(), 
            orientationWidget, 
            projectionInfo);
        return this;
    }

    View3D.prototype = Object.create(View3DBase.prototype, {
     
    });

    return View3D;
});
