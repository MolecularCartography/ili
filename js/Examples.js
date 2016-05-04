'use strict';

define([
    'datgui', 'workspace'
],
function(dat, Workspace) {
    function updateControlsRecursively(controls) {
        for (var i in controls.__controllers) {
            controls.__controllers[i].updateDisplay();
        }
        for (var i in controls.__folders) {
            updateControlsRecursively(controls.__folders[i]);
        }
    }

    function Examples(workspace, dashboard) {
        var examplesContainer = new dat.GUI({autoPlace: false});

        var folder = examplesContainer.addFolder('Examples');
        folder.open();

        var openExample = function() {
            workspace.download(this.files);

            if (this['adjustView'] !== undefined) {
                this.adjustView();
                updateControlsRecursively(dashboard);
            }
        };
        var items = [
            {
                name: '3D-MASSOMICS meeting mockup',
                files: ['3dmassomics/bg.png', '3dmassomics/intensities.csv'],
            },
            {
                name: 'Stingless bee',
                files: ['bee/model.stl', 'bee/intensities.csv'],
                adjustView: function() {
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
                adjustView: function() {
                    workspace.colorMapId = 'VIRIDIS';
                }
            },
            {
                name: 'Cyanobacteria natural products',
                files: ['cyano/bg.png', 'cyano/intensities.csv'],
                adjustView: function() {
                    workspace.scaleId = Workspace.Scale.LOG.id;
                    workspace.colorMapId = 'JET';
                }
            },
            {
                name: 'Human skin metabolome',
                files: ['human/man.stl', 'human/man_LCMS_small.csv'],
                adjustView: function() {
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

        items.forEach(function(item) {
            item[item.name] = openExample.bind(item);
            folder.add(item, item.name);
        });

        var container = document.getElementById('examples-container');
        container.appendChild(examplesContainer.domElement);
    };

    return Examples;
});
