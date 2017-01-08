'use strict';

define([
    'tabcontrollerbase', 'workspace'
],
function (TabControllerBase, Workspace) {
    function TabControllerExamples(container, workspace, views) {
        var description = 'Examples of visualization';
        var title = 'Examples';
        TabControllerBase.call(this, container, title, description, workspace);

        var openExample = function () {
            workspace.download(this.files);
            this.adjustView();
        };
        var items = [
            {
                name: '3D-MASSOMICS meeting mockup',
                files: ['3dmassomics/bg.png', '3dmassomics/intensities.csv'],
                adjustView: function () {
                    workspace.colorMapId = 'VIRIDIS';
                }
            },
            {
                name: 'Stingless bee',
                files: ['bee/model.stl', 'bee/intensities.csv'],
                adjustView: function () {
                    workspace.scene3d.adjustment.alpha = -90;
                    workspace.scene3d.adjustment.beta = 10;
                    workspace.scene3d.adjustment.gamma = 0;
                    workspace.scene3d.adjustment.x = 0;
                    workspace.scene3d.adjustment.y = 0;
                    workspace.scene3d.adjustment.z = 0;

                    workspace.scaleId = Workspace.Scale.LOG.id;
                    workspace.colorMapId = 'VIRIDIS';
                }
            },
            {
                name: 'Diseased coral',
                files: ['coral/bg.png', 'coral/intensities.csv'],
                adjustView: function () {
                    workspace.colorMapId = 'VIRIDIS';
                }
            },
            {
                name: 'Cyanobacteria natural products',
                files: ['cyano/bg.png', 'cyano/intensities.csv'],
                adjustView: function () {
                    workspace.scaleId = Workspace.Scale.LOG.id;
                    workspace.colorMapId = 'JET';
                }
            },
            {
                name: 'Human skin metabolome',
                files: ['human/man.stl', 'human/man_LCMS_small.csv'],
                adjustView: function () {
                    workspace.colorMapId = 'VIRIDIS';

                    workspace.scene3d.adjustment.alpha = -90;
                    workspace.scene3d.adjustment.beta = 0;
                    workspace.scene3d.adjustment.gamma = -45;
                    workspace.scene3d.adjustment.x = 0;
                    workspace.scene3d.adjustment.y = -13;
                    workspace.scene3d.adjustment.z = 0;
                }
            }
        ];

        this.addTextBlock('Select any of the examples below');
        items.forEach(function (item) {
            item[item.name] = openExample.bind(item);
            this.addAction(item.name, item[item.name]);
        }.bind(this));

        return this;
    }

    TabControllerExamples.prototype = Object.create(TabControllerBase.prototype);

    return TabControllerExamples;
});
