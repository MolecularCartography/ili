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

    this._hoverSpot = null;

    this._scene = workspace.scene3d;
    this._scene.addEventListener('change', this.requestAnimationFrame.bind(this));

    this._div.addEventListener('mousedown', this._onMouseDown.bind(this));

    var divs = this._div.querySelectorAll('.View3d');
    for (var i = 0; i < divs.length; i++) {
        this._views.push(new View3D(this, divs[i]));
    }
    this._hoverSpot = new ViewGroup3D.HoverSpot(this, this._scene, this._div.querySelector('.HoverSpot'));
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

    pageToView: {
        value: function(pageX, pageY) {
            var x = this._div - pageX;
            var y = this._div - pageY;
            for (var i = 0; i < this._views.length; i++) {
                var v = this._views[i];
                var lx = pageX - v.left;
                if (lx < 0 || lx >= v.width) continue;
                var ly = pageY - v.top;
                if (ly < 0 || ly >= v.height) continue;

                // Mouse position in raycaster coordinate system ([-1, 1]).
                return {
                    coords: new THREE.Vector2(lx * 2 / v.width - 1, 1 - ly * 2 / v.height),
                    view: v,
                };
            }
            return null;
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
            this._hoverSpot.update();
        }
    },

    _onMouseDown: {
        value: function(event) {
            this._hoverSpot.set(this.pageToView(event.pageX, event.pageY));
        }
    },
});

ViewGroup3D.Layout = {
    SINGLE: 'single',
    DOUBLE: 'double',
    TRIPLE: 'triple',
    QUADRIPLE: 'quadriple',
};

ViewGroup3D.HoverSpot = function(group, scene, div) {
    this._group = group;
    this._scene = scene;
    this._raycastPromise = null;
    this._view = null;
    this._div = div;
};

ViewGroup3D.HoverSpot.prototype = {
    set: function(point) {
        this._spot = null;
        this._group.requestAnimationFrame();

        if (!point) {
            this._view = null;
            return;
        }

        this._view = point.view;
        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(point.coords, point.view.camera);
        if (this._raycastPromise) this._raycastPromise.cancel();
        this._raycastPromise = this._scene.raycast(raycaster);
        this._raycastPromise.then(this._onRaycastComplete.bind(this));
    },

    _onRaycastComplete: function(spot) {
        this._spot = spot;
        this._group.requestAnimationFrame();
    },

    update: function() {
        var presents = this._spot && this._view;
        var position = presents && this._scene.spotToWord(this._spot);
        if (!position) presents = false;
        this._div.hidden = !presents;
        if (!presents) return;

        this._div.textContent = this._spot.name;
        position.project(this._view.camera);

        var x = this._view.left + this._view.width * (0.5 + position.x / 2);
        var y = this._view.top + this._view.height * (0.5 - position.y / 2);
        this._div.style.left = x + 'px'
        this._div.style.top = y + 'px'
    },
};