'use strict';

/**
 * Group of View3D's. Manages shared objects: model, renderer, canvas.
 *
 * @param {Model} model
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

    // Binding to model.
    this._model = model;
    this._model.addEventListener('3d-scene-change',
                                 this._onSceneChange.bind(this));

    var divs = this._div.querySelectorAll('.view-3d');
    for (var i = 0; i < divs.length; i++) {
        this._views.push(new View3D(this, divs[i]));
    }
}

ViewGroup3D.prototype = Object.create(null, {
    redraw: {
        value: function() {
            this._renderer.setClearColor(this._model.backgroundColorValue);
            for (var i = 0; i < this._views.length; i++) {
                var v = this._views[i];
                if (!v.width || !v.height) continue;
                var viewportBottom = this._height - v.top - v.height;
                this._renderer.setViewport(v.left, viewportBottom, v.width, v.height);
                this._renderer.setScissor(v.left, viewportBottom, v.width, v.height);
                this._renderer.enableScissorTest(true);
                this._renderer.render(this._model.scene, v.camera);
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