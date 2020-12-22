'use strict';

define([
    'viewcontainerbase', 'volumeviewgroup3d', 'volumeviewlegend', 'volumeworkspace'
],
function(ViewContainerBase, ViewGroup3D, ViewLegend, Workspace) {
    function ViewContainer(workspace, div) {
        ViewContainerBase.call(this, workspace, div);
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
