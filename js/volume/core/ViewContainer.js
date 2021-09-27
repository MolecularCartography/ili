'use strict';

define([
    'viewcontainerbase', 'volumeviewgroup3d', 'volumeviewlegend', 'volumeworkspace'
],
function(ViewContainerBase, ViewGroup3D, ViewLegend, Workspace) {
    function ViewContainer(workspace, div) {
        ViewContainerBase.call(this, workspace, div);
        this.g3d = this.createView(ViewGroup3D, 'div.ViewGroup3D');
        this.legend = this.createView(ViewLegend, 'svg.ViewLegend');
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
                switch (this._workspace.mode) {
                    case Workspace.Mode.MODE_3D:
                        return this.exportInner((imageData, pixelRatio) => {
                            this.g3d.export(imageData, pixelRatio);
                        });
                    default:
                        reject();
                        return;
                }  
            }
        }
    });

    return ViewContainer;
});
