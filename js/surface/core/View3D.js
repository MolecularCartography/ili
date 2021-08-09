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
    function View3D(group, div, orientationWidget) {
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        camera.position.x = -30;
        camera.position.y = 40;
        camera.position.z = 30;
        this.orientationWidget = orientationWidget;

        View3DBase.call(this, group, div, camera);
        return this;
    }

    View3D.prototype = Object.create(View3DBase.prototype, {
        _requestDefaultView: {
            value: function() {
                
            }
        },
    });

    return View3D;
});
