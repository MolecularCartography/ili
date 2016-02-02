'use strict';

function updateGuiRecursively(gui) {
    for (var i in gui.__controllers) {
        gui.__controllers[i].updateDisplay();
    }
    for (var i in gui.__folders) {
        updateGuiRecursively(gui.__folders[i]);
    }
}

function Examples() {
    var examplesContainer = new dat.GUI({autoPlace: false});

    var folder = examplesContainer.addFolder('Examples');
    folder.open();

    var openExample = function() {
        g_workspace.download(this.files);

        if (this['adjustView'] !== undefined) {
            this.adjustView();
            updateGuiRecursively(g_gui);
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
                g_workspace.scene3d.adjustment.alpha = -90;
                g_workspace.scene3d.adjustment.beta = 10;
                g_workspace.scene3d.adjustment.gamma = 0;
                g_workspace.scene3d.adjustment.x = 0;
                g_workspace.scene3d.adjustment.y = 0;
                g_workspace.scene3d.adjustment.z = 0;

                g_workspace.scaleId = Workspace.Scale.LOG.id;
                g_workspace.colorMapId = 'VIRIDIS';
            }
        },
        {
            name: 'Diseased coral',
            files: ['coral/bg.png', 'coral/intensities.csv'],
            adjustView: function() {
                g_workspace.colorMapId = 'VIRIDIS';
            }
        },
        {
            name: 'Cyanobacteria natural products',
            files: ['cyano/bg.png', 'cyano/intensities.csv'],
            adjustView: function() {
                g_workspace.scaleId = Workspace.Scale.LOG.id;
                g_workspace.colorMapId = 'JET';
            }
        },
        {
            name: 'Human skin metabolome',
            files: ['human/man.stl', 'human/man_LCMS_small.csv'],
            adjustView: function() {
                g_workspace.colorMapId = 'VIRIDIS';

                g_workspace.scene3d.adjustment.alpha = -90;
                g_workspace.scene3d.adjustment.beta = 0;
                g_workspace.scene3d.adjustment.gamma = -45;
                g_workspace.scene3d.adjustment.x = 0;
                g_workspace.scene3d.adjustment.y = -13;
                g_workspace.scene3d.adjustment.z = 0;
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
