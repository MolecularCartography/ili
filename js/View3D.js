'use strict';

/**
 * Shows a scene from the |model| when it's in MODE_3D. Model owns
 * the mesh and lights. View owns camera.
 *
 * @param {Model} model
 * @param {canvas} canvas To render the scene with THREE.js.
 */
function View3D(model, canvas) {
    this._canvas = canvas;
    this._renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: canvas
    });
    this._camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    
    // Binding with model.
    this._model = model;
    this._model.addEventListener('3d-scene-change',
                                 this._onSceneChange.bind(this));
    
    // Configure camera
    this._camera.position.x = -30;
    this._camera.position.y = 40;
    this._camera.position.z = 30;
    this._camera.lookAt(this._model.scene.position);

    this._controls = new THREE.OrbitControls(this._camera, canvas);
    this._controls.target = this._model.scene.position;
    this._controls.noKeys = true;
    this._controls.update();
    this._controls.addEventListener('change', this.redraw.bind(this));
}

View3D.prototype = Object.create(null, {
    redraw: {
        value: function() {
            this._renderer.setClearColor(this._model.backgroundColorValue);
            this._renderer.render(this._model.scene, this._camera);
        }
    },
    
    updateLayout: {
        value: function() {
            // width and height are determined by the CSS file.
            var width = this._canvas.clientWidth;
            var height = this._canvas.clientHeight;
            var SET_STYLE = false;

            this._camera.aspect = width / height;
            this._camera.updateProjectionMatrix();
            
            // Make sure view looks good with zoom and on retina.
            this._renderer.setPixelRatio(devicePixelRatio);

            this._renderer.setSize(width, height, SET_STYLE);
            this.redraw();
        }
    },

    _onSceneChange: {
        value: function() {
            this.redraw();
        }
    },
});