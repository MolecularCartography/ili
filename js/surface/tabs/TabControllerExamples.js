'use strict';

define([
    'tabcontrollerbase', 'surfaceworkspace', 'utils'
],
function (TabControllerBase, Workspace, Utils) {
    function TabControllerExamples(container, workspace, views) {
        var description = 'Examples of visualization';
        var title = 'Examples';
        TabControllerBase.call(this, container, title, description, workspace);

        const fileServicePrefix = Utils.FILE_SERVICE_PREFIX;
        var items = [
            {
                name: '3D-MASSOMICS meeting mockup',
                files: ['3dmassomics/bg.png', '3dmassomics/intensities.csv', '3dmassomics/example.json'],
                prefix: fileServicePrefix
            },
            {
                name: 'Stingless bee',
                files: ['bee/model.stl', 'bee/intensities.csv', , 'bee/example.json'],
                prefix: fileServicePrefix
            },
            {
                name: 'Diseased coral',
                files: ['coral/bg.png', 'coral/intensities.csv', 'coral/example.json'],
                prefix: fileServicePrefix
            },
            {
                name: 'Cyanobacteria natural products',
                files: ['cyano/bg.png', 'cyano/intensities.csv', 'cyano/example.json'],
                prefix: fileServicePrefix
            },
            {
                name: 'Human skin metabolome',
                files: ['human/man.stl', 'human/man_LCMS_small.csv', 'human/example.json'],
                prefix: fileServicePrefix
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
