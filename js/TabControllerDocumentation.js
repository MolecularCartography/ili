'use strict';

define([
    'tabcontrollerbase', 'text!../documentation.html'
],
function (TabControllerBase, layout) {
    function TabControllerDocumentation(container, workspace, views) {
        var description = 'Short description of `ili usage';
        var title = 'Documentation';
        TabControllerBase.call(this, container, title, description, workspace);

        this.addHtmlBlock(layout);
        return this;
    }

    TabControllerDocumentation.prototype = Object.create(TabControllerBase.prototype);

    return TabControllerDocumentation;
});
