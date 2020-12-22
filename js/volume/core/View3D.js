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
    function View3D(group, div) {
        const camera = new THREE.OrthographicCamera(-100, 100, -100, 100, 1, 1000);
        camera.position.set( 0, 0, 128 );
        camera.up.set( 0, 0, 1 ); // In our data, z is up;

        View3DBase.call(this, group, div, camera);
        return this;
    }

    View3D.prototype = Object.create(View3DBase.prototype);

    return View3D;
});
