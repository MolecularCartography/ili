'use strict';

/**
 * Group of View3D's. Manages shared objects: workspace, renderer, canvas.
 *
 * @param {Workspace} workspace
 * @param {HTMLDivElement} div Container element with a canvas and
 *                             several .View3D elements.
 */
function ViewGroup3D(workspace, div) {
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
    this._animationFrameRequested = false;

    this._scene = workspace.scene3d;
    this._scene.addEventListener('change', this.requestAnimationFrame.bind(this));

    this._div.addEventListener('mousedown', this._onMouseDown.bind(this));

    var divs = this._div.querySelectorAll('.View3d');
    for (var i = 0; i < divs.length; i++) {
        this._views.push(new View3D(this, divs[i]));
    }
}

ViewGroup3D.prototype = Object.create(null, {
    requestAnimationFrame: {
        value: function() {
            if (this._animationFrameRequested) return;

            requestAnimationFrame(this._onAnimationFrame.bind(this), this._canvas);
            this._animationFrameRequested = true;
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

    _raycast: {
        value: function(x, y) {
            var coords;
            var camera;
            for (var i = 0; i < this._views.length; i++) {
                var v = this._views[i];
                var lx = x - v.left;
                if (lx < 0 || lx >= v.width) continue;
                var ly = y - v.top;
                if (ly < 0 || ly >= v.height) continue;

                // Mouse position in raycaster coordinate system ([-1, 1]).
                var coords = new THREE.Vector2(lx * 2 / v.width - 1, 1 - ly * 2 / v.height);
                var camera = v.camera;
                break;
            }
            if (!coords) return null;

            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(coords, camera);
            return this._scene.raycast(raycaster);
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

            this.requestAnimationFrame();
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
                preserveDrawingBuffer: true,
            });
            renderer.setPixelRatio(pixelRatio);
            renderer.setSize(this._width, this._height);

            var scene = this._scene.clone();

            this._renderTo(renderer, scene);
        }
    },

    _onAnimationFrame: {
        value: function(now) {
            this._animationFrameRequested = false;
            for (var i = 0; i < this._views.length; i++) {
                this._views[i].onAnimationFrame(now);
            }
            this._renderTo(this._renderer, this._scene);
        }
    },

    _onMouseDown: {
        value: function(event) {
            var promise = this._raycast(event.pageX - this._div.offsetLeft,
                                        event.pageY - this._div.offsetTop);

        }
    },
});

ViewGroup3D.Layout = {
    SINGLE: 'single',
    DOUBLE: 'double',
    TRIPLE: 'triple',
    QUADRIPLE: 'quadriple',
};