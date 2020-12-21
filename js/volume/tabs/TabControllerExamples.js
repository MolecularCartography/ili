'use strict';

define([
        'tabcontrollerbase'
    ],
    function (TabControllerBase ) {
        function TabControllerExamples(container, workspace, views) {
            var description = 'Examples of visualization';
            var title = 'Examples';
            TabControllerBase.call(this, container, title, description, workspace);
            var items = [
                {
                    name: 'Demo NRRD Data',
                    files: ['data/ili.csv', 'data/seed.nrrd']
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
