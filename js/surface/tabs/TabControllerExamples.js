'use strict';

define([
    'tabcontrollerbase', 'surfaceworkspace'
],
function (TabControllerBase, Workspace) {
    function TabControllerExamples(container, workspace, views) {
        var description = 'Examples of visualization';
        var title = 'Examples';
        TabControllerBase.call(this, container, title, description, workspace);

        var items = [
            {
                name: '3D-MASSOMICS meeting mockup',
                files: ['3dmassomics/bg.png', '3dmassomics/intensities.csv', '3dmassomics/example.json']
            },
            {
                name: 'Stingless bee',
                files: ['bee/model.stl', 'bee/intensities.csv', , 'bee/example.json']
            },
            {
                name: 'Diseased coral',
                files: ['coral/bg.png', 'coral/intensities.csv', 'coral/example.json']
            },
            {
                name: 'Cyanobacteria natural products',
                files: ['cyano/bg.png', 'cyano/intensities.csv', 'cyano/example.json']
            },
            {
                name: 'Human skin metabolome',
                files: ['human/man.stl', 'human/man_LCMS_small.csv', 'human/example.json']
            }
        ];

        this.addHintBlock('Select any of the examples below');
        items.forEach(function (item) {
            item[item.name] = workspace.download.bind(workspace, item.files);
            this.addAction(item.name, item[item.name]);
        }.bind(this));

        return this;
    }

    TabControllerExamples.prototype = Object.create(TabControllerBase.prototype);

    return TabControllerExamples;
});
