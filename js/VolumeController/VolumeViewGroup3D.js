'use strict';

define([
        'three', 'volumescene3d', 'view3d', 'volumespotscontroller'
    ],
    function(THREE, VolumeScene3D, View3D, VolumeSpotsController) {
        /**
         * Group of View3D's. Manages shared objects: workspace, renderer, canvas.
         *
         * @param {Workspace} workspace
         * @param {HTMLDivElement} div Container element with a canvas and
         *                             several .View3D elements.
         */
        function VolumeViewGroup3D(workspace, div) {
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

            this._scene = workspace.volumeScene3D;

            this._scene.addEventListener(VolumeScene3D.Events.CHANGE, this.requestAnimationFrame.bind(this));
            workspace.spotsController.addEventListener(VolumeSpotsController.Events.MAPPING_CHANGE, this.requestAnimationFrame.bind(this));


            const divs = this._div.querySelectorAll('.View3D');
            for (let i = 0; i < divs.length; i++) {
                this._views.push(new View3D(this, divs[i]));
            }
          }

        VolumeViewGroup3D.prototype = Object.create(null, {

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
                    for (let i = 0; i < this._views.length; i++) {
                        const v = this._views[i];
                        if (!v.width || !v.height) continue;
                        const viewportBottom = this._height - v.top - v.height;
                        renderer.setViewport(v.left, viewportBottom, v.width, v.height);
                        renderer.setScissor(v.left, viewportBottom, v.width, v.height);
                        renderer.setScissorTest(true);
                        scene.render(renderer, v.camera);
                    }
                }
            },

            prepareUpdateLayout: {
                value: function() {
                    this._width = this._div.clientWidth;
                    this._height = this._div.clientHeight;
                    this._left = this._div.offsetLeft;
                    this._top = this._div.offsetTop;
                    this._pixelRatio = window.devicePixelRatio;
                    for (let i = 0; i < this._views.length; i++) {
                        this._views[i].prepareUpdateLayout();
                    }
                }
            },

            finishUpdateLayout: {
                value: function() {
                    // Make sure view looks good with zoom and on retina.
                    this._renderer.setPixelRatio(this._pixelRatio);
                    this._renderer.setSize(this._width, this._height);

                    for (let i = 0; i < this._views.length; i++) {
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

            _onAnimationFrame: {
                value: function(now) {
                    this._animationFrameRequested = false;
                    for (let i = 0; i < this._views.length; i++) {
                        this._views[i].onAnimationFrame(now);
                    }
                    this._renderTo(this._renderer, this._scene);

                }
            },


            toJSON: {
                value: function () {
                    const result = [];
                    for (let i = 0; i < this._views.length; ++i) {
                        result.push(this._views[i].toJSON());
                    }
                    return result;
                }
            },

            fromJSON: {
                value: function (json) {
                    for (let i = 0; i < json.length; i++) {
                        this._views[i].fromJSON(json[i]);
                    }
                }
            }
        });

        VolumeViewGroup3D.Layout = {
            SINGLE: 'single',
            DOUBLE: 'double',
            TRIPLE: 'triple',
            QUADRIPLE: 'quadriple',
        };

        return VolumeViewGroup3D;
    });
