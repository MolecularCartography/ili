'use strict';

define([
    'viewcontainerbase', 'surfaceview2d', 'surfaceviewgroup3d', 'surfaceviewlegend', 'surfaceworkspace'
],
function(ViewContainerBase, View2D, ViewGroup3D, ViewLegend, Workspace) {
    function ViewContainer(workspace, div) {
        ViewContainerBase.call(this, workspace, div);
        this.v2d = this._createView(View2D, 'div.View2D');
        this.g3d = this._createView(ViewGroup3D, 'div.ViewGroup3D');
        this.legend = this._createView(ViewLegend, 'svg.ViewLegend');

        this._workspace.addEventListener(Workspace.Events.MODE_CHANGE, this._onWorkspaceModeChange.bind(this));
        this._onWorkspaceModeChange();
    }

    ViewContainer.prototype = Object.create(ViewContainerBase.prototype, {
        layoutName: {
            get: function() {
                switch (this._workspace.mode) {
                    case null:
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
                        this.legend.export(canvas, pixelRatio).then(this.makeCanvasBlob.bind(this, canvas)).catch(reject);
                    } else if (this._workspace.mode == Workspace.Mode.MODE_2D) {
                        var canvas = document.createElement('canvas');
                        canvas.width = this._workspace.scene2d.width;
                        canvas.height = this._workspace.scene2d.width;
                        this.v2d.export(canvas).then(function() {
                            this.legend.export(canvas, 1 / this.v2d.scale).then(this.makeCanvasBlob.bind(this, canvas)).catch(reject);
                        }.bind(this)).catch(reject);
                    } else {
                        reject();
                        return;
                    }
                }.bind(this));
            }
        }
    });

    return ViewContainer;
});
