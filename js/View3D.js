'use strict';

/**
 * View indise ViewGroup3D. All View3Ds share single canvas from the group.
 * Each view has own camera and own empty DIV for handling user input and
 * calculating viewport position.
 *
 * @param {ViewGroup3D} droup.
 * @param {HTMLDivElement} div.
 */
function View3D(group, div) {
    this._group = group;
    this._div = div;
    this._left = 0;
    this._top = 0;
    this._width = 0;
    this._height = 0;
    this._camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    this._camera.position.x = -30;
    this._camera.position.y = 40;
    this._camera.position.z = 30;
    this._camera.lookAt(this._group._model.scene.position);

    this._controls = new THREE.OrbitControls(this._camera, this._div);
    this._controls.target = this._group._model.scene.position;
    this._controls.noKeys = true;
    this._controls.update();
    this._controls.addEventListener('change', group.redraw.bind(group));
}

View3D.prototype = Object.create(null, {
    prepareUpdateLayout: {
        value: function() {
            this._left = this._div.offsetLeft;
            this._top = this._div.offsetTop;
            this._width = this._div.offsetWidth;
            this._height = this._div.offsetHeight;
        }
    },

    finishUpdateLayout: {
        value: function() {
            this._camera.aspect = this.width / this.height;
            this._camera.updateProjectionMatrix();
        }
    },

    camera: {
        get: function() {
            return this._camera;
        }
    },

    left: {
        get: function() {
            return this._left;
        }
    },

    top: {
        get: function() {
            return this._top;
        }
    },

    width: {
        get: function() {
            return this._width;
        }
    },

    height: {
        get: function() {
            return this._height;
        }
    },
});