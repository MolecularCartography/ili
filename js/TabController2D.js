'use strict';

define([
    'tabcontrollerbase'
],
function(TabControllerBase) {
    function TabController2D(container, workspace, views) {
        var description = 'Settings of 2D view';
        var title = '2D';
        TabControllerBase.call(this, container, title, description, workspace);
        this.addNumeric(workspace.scene2d, 'spotBorder', 'Spot border', 0, 1);
        return this;
    }

    TabController2D.prototype = Object.create(TabControllerBase.prototype);

    return TabController2D;
});
