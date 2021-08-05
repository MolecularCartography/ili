'use strict';

define([
    'three', 'scene3dbase', 'spotscontrollerbase', 'tween'
],
function(THREE, Scene3DBase, SpotsControllerBase, TWEEN) {

    function ViewGroup3DBase(workspace, div, initializer) {
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
        this._scene.addEventListener(Scene3DBase.Events.CHANGE, this.requestAnimationFrame.bind(this));
        workspace.spotsController.addEventListener(SpotsControllerBase.Events.MAPPING_CHANGE, this.requestAnimationFrame.bind(this));

        this._div.addEventListener('mousedown', this._onMouseDown.bind(this));

        var divs = this._div.querySelectorAll('.View3D');
        let orientationWidgets = this._div.querySelectorAll('orientation-widget');
        for (var i = 0; i < divs.length; i++) {
            const view3d = initializer.createView(this, divs[i], i, orientationWidgets[i]);

            view3d.orientationWidget._cameraRotateFunc = ((eyeFixed) => {
                let camera = view3d.camera;
                let duration = 100;
                let dist = Math.sqrt(camera.position.x * camera.position.x +
                    camera.position.y * camera.position.y +
                    camera.position.z * camera.position.z);
                let edgeDist = Math.sqrt(dist * dist / 2);
                let cornerDist = Math.sqrt(dist * dist / 3);
                let upFixed = camera.up;

                let tween = new TWEEN.Tween(camera.position);
                let eyeFixed2 = eyeFixed(dist, edgeDist, cornerDist);
                let vector = new THREE.Vector3(eyeFixed2[0], eyeFixed2[1], eyeFixed2[2])
                tween.to(vector, duration);
                camera.up.set(upFixed.x, upFixed.y, upFixed.z);
                tween.start();

                tween.onComplete(() => {
                    setTimeout(() => {
                        this._renderer.setAnimationLoop(null);
                        this._renderTo(this._renderer, this._scene);
                    })
                });

                this._renderer.setAnimationLoop(() => {
                    TWEEN.update();
                    camera.lookAt(0, 0, 0);
                    this._renderTo(this._renderer, this._scene);
                });
            });

            this._views.push(view3d);
        }
        this._spotLabel = initializer.createSpotLabel(this, this._scene);
        return this;
    }

    ViewGroup3DBase.prototype = Object.create(null, {
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
                    renderer.setScissorTest(true);
                    scene.render(renderer, v.camera, v.orientationWidget);
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
                this._renderTo(this._renderer, this._scene);
                if (this._spotLabel) {
                    this._spotLabel.update();
                }
            }
        },

        _onMouseDown: {
            value: function(event) {
                var parentRect = this._div.getBoundingClientRect();
                if (this._spotLabel) {
                    this._spotLabel.showFor(event.pageX - parentRect.left, event.pageY - parentRect.top);
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
