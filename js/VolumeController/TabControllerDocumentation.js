'use strict';

define([
        'tabcontrollerbase', 'documentationlayout'
    ],
    function (VolumeTabControllerBase, layout) {
        function TabControllerDocumentation(container, workspace, views) {
            var description = 'Short description of `ili usage';
            var title = 'Documentation';
            VolumeTabControllerBase.call(this, container, title, description, workspace);

            this.addHtmlBlock(layout);
            return this;
        }

        TabControllerDocumentation.prototype = Object.create(VolumeTabControllerBase.prototype);

        return TabControllerDocumentation;
    });
