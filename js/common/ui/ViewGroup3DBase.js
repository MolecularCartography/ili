'use strict';

define([
    'three', 'scene3dbase', 'spotscontrollerbase', 'camerahelper', 'animationloopmanager'
],
function(THREE, Scene3DBase, SpotsControllerBase, CameraHelper, AnimationLoopManager) {

    const ViewProjections = [
        { horizontalIndex: 0, verticalIndex: 1 },
        { horizontalIndex: 0, verticalIndex: 2 },
        { horizontalIndex: 1, verticalIndex: 2 },
        { horizontalIndex: 0, verticalIndex: 2 },
    ];

    function ViewGroup3DBase(workspace, div, initializer) {
        this._div = div;
        this._canvas = div.querySelector('canvas');
        this._renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: this._canvas
        });
        this._width = 0;
        this._height = 0;
        this._left = 0;
        this._top = 0;
        this._pixelRatio = 1;
        this._animationFrameRequested = false;

        // create animation controller responsible for abstract animation callbacks.
        this._animationLoopManager = new AnimationLoopManager({
            requestRedraw: () => this.requestAnimationFrame(),
            setAnimationLoop: (action) => this._renderer.setAnimationLoop(action),
            redraw: () => this._redraw()
        });   
        this._animationController = {
            requestRedraw: () => this._animationLoopManager.requestRedraw(),
            setState: (state) => null,
            setAnimationLoop: (action) => this._animationLoopManager.setAnimationLoop(action)
        };

        this._scene = workspace.scene3d;
        this._scene.addEventListener(Scene3DBase.Events.CHANGE, this.requestAnimationFrame.bind(this));
        workspace.spotsController.addEventListener(SpotsControllerBase.Events.MAPPING_CHANGE, this.requestAnimationFrame.bind(this));

        // create spot label.
        this._spotLabel = initializer.createSpotLabel(this, this._scene);

        // extract view items and initialize views.
        const divs = this._div.querySelectorAll('.View3D');
        const orientationWidgets = this._div.querySelectorAll('orientation-widget');
        this._views = new Array(divs.length);
        for (let i = 0; i < divs.length; i++) {
            this._views[i] = initializer.createView(workspace, this, divs[i], orientationWidgets[i], ViewProjections[i]);
        }
      
        return this;
    }

    ViewGroup3DBase.prototype = Object.create(null, {

        requestAnimationFrame: {
            value: function() {
                if (this._animationFrameRequested) {
                    return;
                }
                requestAnimationFrame(this._onAnimationFrame.bind(this), this._canvas);
                this._animationFrameRequested = true;
            }
        },

        _renderTo: {
            value: function(renderer, scene) {
                renderer.setClearColor(scene.backgroundColor);
                for (var i = 0; i < this._views.length; i++) {
                    var v = this._views[i];
                    v.render(renderer, scene, this._height);
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

                // The scene might not be clonable.
                scene = scene ? scene : this._scene;

                this._renderTo(renderer, scene);

                var gl = renderer.getContext();
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
                this._redraw();
            }
        },

        _redraw: {
            value: function() {
                this._renderTo(this._renderer, this._scene);
                if (this._spotLabel) {
                    this._spotLabel.update();
                }
            }
        },

        toJSON: {
            value: function () {
                var result = [];
                for (var i = 0; i < this._views.length; ++i) {
                    result.push(this._views[i].toJSON());
                }
                return result;
            }
        },

        fromJSON: {
            value: function (json) {
                for (var i = 0; i < json.length; i++) {
                    this._views[i].fromJSON(json[i]);
                }
            }
        }
    });

    ViewGroup3DBase.Layout = {
        SINGLE: 'single',
        DOUBLE: 'double',
        TRIPLE: 'triple',
        QUADRIPLE: 'quadriple',
    };

    return ViewGroup3DBase;
});
