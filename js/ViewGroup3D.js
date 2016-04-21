'use strict';

define([
    'three',
    'scene3d',
    'view3d',
    'spotlabel3d'
],
function (THREE, Scene3D, View3D, SpotLabel3D){
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
        this._left = 0;
        this._top = 0;
        this._pixelRatio = 1;
        this._views = [];
        this._animationFrameRequested = false;

        this._scene = workspace.scene3d;
        this._scene.addEventListener(Scene3D.Events.CHANGE, this.requestAnimationFrame.bind(this));

        this._div.addEventListener('mousedown', this._onMouseDown.bind(this));

        var divs = this._div.querySelectorAll('.View3d');
        for (var i = 0; i < divs.length; i++) {
            this._views.push(new View3D(this, divs[i]));
        }
        this._spotLabel = new SpotLabel3D(this, this._scene);
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
                renderer.setClearColor(scene.backgroundColorValue);
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

        findView: {
            value: function(pageX, pageY) {
                for (var i = 0; i < this._views.length; i++) {
                    var v = this._views[i];
                    if (pageX >= v.left && pageX < v.left + v.width &&
                            pageY >= v.top && pageY < v.top + v.height) {
                        return v;
                    }
                }
                return null;
            }
        },

        prepareUpdateLayout: {
            value: function() {
                this._width = this._div.clientWidth;
                this._height = this._div.clientHeight;
                this._left = this._div.offsetLeft;
                this._top = this._div.offsetTop;
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
            value: function(imageData, pixelRatio) {
                var renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    preserveDrawingBuffer: true,
                    canvas: document.createElement('canvas'),
                });
                renderer.setPixelRatio(pixelRatio);
                renderer.setSize(this._width, this._height);

                var scene = this._scene.clone();

                this._renderTo(renderer, scene);

                var gl = renderer.context;
                var pixels = new Uint8Array(imageData.width * imageData.height * 4);
                gl.readPixels(0, 0, imageData.width, imageData.height,
                        gl.RGBA, gl.UNSIGNED_BYTE, pixels);
                for (var i = 0; i < imageData.height; i++) {
                    var row = new Uint8Array(pixels.buffer, (imageData.height - 1 - i) * imageData.width * 4, imageData.width * 4);
                    imageData.data.set(row, i * imageData.width * 4);
                }
            }
        },

        _onAnimationFrame: {
            value: function(now) {
                this._animationFrameRequested = false;
                for (var i = 0; i < this._views.length; i++) {
                    this._views[i].onAnimationFrame(now);
                }
                this._renderTo(this._renderer, this._scene);
                this._spotLabel.update();
            }
        },

        _onMouseDown: {
            value: function(event) {
                this._spotLabel.showFor(event.pageX, event.pageY);
            }
        },
    });

    ViewGroup3D.Layout = {
        SINGLE: 'single',
        DOUBLE: 'double',
        TRIPLE: 'triple',
        QUADRIPLE: 'quadriple',
    };

    return ViewGroup3D;
});
