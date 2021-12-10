'use strict';

define([
    'viewcontainerbase', 'surfaceview2d', 'surfaceviewgroup3d', 'surfaceviewlegend', 'surfaceworkspace'
],
function(ViewContainerBase, View2D, ViewGroup3D, ViewLegend, Workspace) {
    function ViewContainer(workspace, div) {
        ViewContainerBase.call(this, workspace, div);
        this.v2d = this.createView(View2D, 'div.View2D');
        this.g3d = this.createView(ViewGroup3D, 'div.ViewGroup3D');
        this.legend = this.createView(ViewLegend, 'svg.ViewLegend');
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
                switch (this._workspace.mode) {
                    case Workspace.Mode.MODE_3D:
                        return this.exportInner((imageData, pixelRatio) => {
                            this.g3d.export(imageData, pixelRatio);
                        });
                    case Workspace.Mode.MODE_2D:
                        return new Promise((accept, reject) => {
                            const canvas = document.createElement('canvas');
                            const scene2d = this._workspace.scene2d;
                            canvas.width = scene2d.width;
                            canvas.height = scene2d.width;
                            this.v2d.export(canvas).then(function() {
                                this.legend.export(canvas, 1 / this.v2d.scale).then(this.makeCanvasBlob.bind(this, canvas, accept)).catch(reject);
                            }.bind(this)).catch(reject);
                        });
                    default:
                        return new Promise((accept, reject) => reject());
                }
            }
        }
    });

    return ViewContainer;
});
