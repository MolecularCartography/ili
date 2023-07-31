'use strict';

define([
    'tabcontrollerbase', 'surfaceworkspace', 'utils'
],
function (TabControllerBase, Workspace, Utils) {
    function TabControllerExamples(container, workspace, views) {
        var description = 'Examples of visualization';
        var title = 'Examples';
        TabControllerBase.call(this, container, title, description, workspace);

        const wwwUrl = document.location.origin + '/';

        var items = [
            {
                name: '3D-MASSOMICS meeting mockup',
                files: ['data/3dmassomics/bg.png', 'data/3dmassomics/intensities.csv', 'data/3dmassomics/example.json'],
                prefix: wwwUrl
            },
            {
                name: 'Stingless bee',
                files: ['data/bee/model.stl', 'data/bee/intensities.csv', 'data/bee/example.json'],
                prefix: wwwUrl
            },
            {
                name: 'Diseased coral',
                files: ['data/coral/bg.png', 'data/coral/intensities.csv', 'data/coral/example.json'],
                prefix: wwwUrl
            },
            {
                name: 'Cyanobacteria natural products',
                files: ['data/cyano/bg.png', 'data/cyano/intensities.csv', 'data/cyano/example.json'],
                prefix: wwwUrl
            },
            {
                name: 'Human skin metabolome',
                files: ['data/human/man.stl', 'data/human/man_LCMS_small.csv', 'data/human/example.json'],
                prefix: wwwUrl
            }
        ];

        this.addHintBlock('Select any of the examples below');
        items.forEach(function (item) {
            item[item.name] = workspace.download.bind(workspace, item.files, item.prefix);
            this.addAction(item.name, item[item.name]);
        }.bind(this));

        return this;
    }

    TabControllerExamples.prototype = Object.create(TabControllerBase.prototype);

    return TabControllerExamples;
});
