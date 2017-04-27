'use strict';

define([
    'tabcontrollerbase'
],
function(TabControllerBase) {
    function TabControllerSpots(container, workspace, views) {
        var description = 'Settings of spots visualization';
        var title = 'Spots';
        TabControllerBase.call(this, container, title, description, workspace);
        this.addNumeric(workspace, 'globalSpotVisibility', 'Opacity', 0, 1);
        this.addNumeric(workspace, 'spotBorder', 'Border opacity', 0, 1);
        this.addFlag(workspace, 'dataDependentVisibility', 'Proportional opacity');
        this.addNumeric(workspace, 'globalSpotScale', 'Size factor', 0, 10);
        return this;
    }

    TabControllerSpots.prototype = Object.create(TabControllerBase.prototype);

    return TabControllerSpots;
});
