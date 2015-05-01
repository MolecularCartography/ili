'use strict';

/**
 * Group of View3D's. Manages shared objects: model, renderer, canvas.
 *
 * @param {Model} scene
 * @param {HTMLDivElement} div Container element with a canvas and
 *                             several .view-3d elements.
 */
function ViewGroup3D(model, div) {
    this._div = div;
    this._canvas = div.querySelector('canvas');
    this._renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: this._canvas,
    });
    this._width = 0;
    this._height = 0;
    this._pixelRatio = 1;
    this._views = [];

    this._scene = model.scene3d;
    this._scene.addEventListener('change', this._onSceneChange.bind(this));

    var divs = this._div.querySelectorAll('.view-3d');
    for (var i = 0; i < divs.length; i++) {
        this._views.push(new View3D(this, divs[i]));
    }
}

ViewGroup3D.prototype = Object.create(null, {
    redraw: {
        value: function() {
            this._renderTo(this._renderer, this._scene);
        }
    },

    _renderTo: {
        value: function(renderer, scene) {
            this._renderer.setClearColor(scene.backgroundColorValue);
            for (var i = 0; i < this._views.length; i++) {
                var v = this._views[i];
                if (!v.width || !v.height) continue;
                var viewportBottom = this._height - v.top - v.height;
                renderer.setViewport(v.left, viewportBottom, v.width, v.height);
                renderer.setScissor(v.left, viewportBottom, v.width, v.height);
                renderer.enableScissorTest(true);
                scene.render(renderer, v.camera);
            }
        }
    },

    prepareUpdateLayout: {
        value: function() {
            this._width = this._div.clientWidth;
            this._height = this._div.clientHeight;
            this._pixelRatio = window.devicePixelRatio;
            for (var i = 0; i < this._views.length; i++) {
                this._views[i].prepareUpdateLayout();
            }
        }
    },

    finishUpdateLayout: {
        value: function() {
            // Make sure view looks good with zoom and on retina.
            this._renderer.setPixelRatio(this._pixelRatio);
            this._renderer.setSize(this._width, this._height);

            for (var i = 0; i < this._views.length; i++) {
                this._views[i].finishUpdateLayout();
            }

            this.redraw();
        }
    },

    layout: {
        get: function() {
            return this._div.getAttribute('layout');
        },

        set: function(value) {
            this._div.setAttribute('layout', value);
            this.prepareUpdateLayout();
            this.finishUpdateLayout();
        }
    },

    export: {
        value: function(canvas, pixelRatio) {
            var renderer = new THREE.WebGLRenderer({
                antialias: true,
                canvas: canvas,
                preserveDrawingBuffer: true
            });
            renderer.setPixelRatio(pixelRatio);
            renderer.setSize(this._width, this._height);

            var scene = this._scene.clone();

            this._renderTo(renderer, scene);
        }
    },

    _onSceneChange: {
        value: function() {
            this.redraw();
        }
    },
});

ViewGroup3D.Layout = {
    SINGLE: 'single',
    DOUBLE: 'double',
    TRIPLE: 'triple',
    QUADRIPLE: 'quadriple',
};