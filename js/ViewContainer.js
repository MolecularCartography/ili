'use strict';

define([
    'view2d', 'viewgroup3d', 'viewlegend', 'workspace'
],
function(View2D, ViewGroup3D, ViewLegend, Workspace) {
    function ViewContainer(workspace, div) {
        this._workspace = workspace;
        this._div = div;

        this.v2d = this._createView(View2D, 'div.View2D');
        this.g3d = this._createView(ViewGroup3D, 'div.ViewGroup3D');
        this.legend = this._createView(ViewLegend, 'svg.ViewLegend');

        this._exportPixelRatio3d = 1.0;

        this._workspace.addEventListener('mode-change', this._onWorkspaceModeChange.bind(this));
        this._onWorkspaceModeChange();
    }

    ViewContainer.prototype = Object.create(null, {
        all: {
            value: []
        },

        updateLayout: {
            value: function() {
                for (var i = 0; i != this.all.length; i++) {
                    this.all[i].prepareUpdateLayout();
                }

                for (var i = 0; i != this.all.length; i++) {
                    this.all[i].finishUpdateLayout();
                }
            }
        },

        _createView: {
            value: function(constructor, selector) {
                var view = new constructor(
                        this._workspace, this._div.querySelector(selector));
                this.all.push(view);
                return view;
            }
        },

        layoutName: {
            get: function() {
                switch (this._workspace.mode) {
                    case Workspace.Mode.UNDEFINED:
                        return 'welcome';

                    case Workspace.Mode.MODE_2D:
                        return 'mode-2d';

                    case Workspace.Mode.MODE_3D:
                        return 'mode-3d';
                }
            }
        },

        export: {
            value: function() {
                return new Promise(function(accept, reject) {
                    if (this._workspace.mode == Workspace.Mode.MODE_3D) {
                        var pixelRatio = window.devicePixelRatio * this._exportPixelRatio3d;
                        var width = this._div.clientWidth * pixelRatio;
                        var height = this._div.clientHeight * pixelRatio;

                        var canvas = document.createElement('canvas');
                        var ctx = canvas.getContext('2d');
                        var imageData = ctx.createImageData(width, height);

                        this.g3d.export(imageData, pixelRatio);

                        canvas.width = width;
                        canvas.height = height;
                        ctx.putImageData(imageData, 0, 0);
                        this.legend.export(canvas, pixelRatio).then(makeBlob.bind(this, canvas)).catch(reject);
                    } else if (this._workspace.mode == Workspace.Mode.MODE_2D) {
                        var canvas = document.createElement('canvas');
                        canvas.width = this._workspace.scene2d.width;
                        canvas.height = this._workspace.scene2d.width;
                        this.v2d.export(canvas).then(function() {
                            this.legend.export(canvas, 1 / this.v2d.scale).then(makeBlob.bind(this, canvas)).catch(reject);
                        }.bind(this)).catch(reject);
                    } else {
                        reject();
                        return;
                    }

                    function makeBlob(canvas) {
                        var data = canvas.toDataURL();
                        var byteString = atob(data.split(',')[1]);
                        var mimeString = data.split(',')[0].split(':')[1].split(';')[0]
                        var ab = new ArrayBuffer(byteString.length);
                        var ia = new Uint8Array(ab);
                        for (var i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                        }
                        accept(new Blob([ab], {type: mimeString}));
                    }
                }.bind(this));
            }
        },

        exportPixelRatio3d: {
            get: function() {
                return this._exportPixelRatio3d;
            },

            set: function(value) {
                if (value <= 0.0 || value > 4.0) {
                    throw 'Invalud value range';
                }
                this._exportPixelRatio3d = value;
            }
        },

        _onWorkspaceModeChange: {
            value: function() {
                this._div.setAttribute('layout', this.layoutName);
                this.updateLayout();
            }
        },

        toJSON: {
            value: function () {
                var result = [];
                for (var i = 0; i < this.all.length; i++) {
                    result.push(this.all[i].toJSON());
                }
                return result;
            }
        },

        fromJSON: {
            value: function (json) {
                for (var i = 0; i < json.length; i++) {
                    this.all[i].fromJSON(json[i]);
                }
                //this.legend.update();
            }
        }
    });

    return ViewContainer;
});
