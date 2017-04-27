'use strict';

define([
    'tabcontrollerbase'
],
function(TabControllerBase) {
    function TabControllerSpots(container, workspace, views) {
        var description = 'Settings of spots visualization';
        var title = 'Spots';
        TabControllerBase.call(this, container, title, description, workspace);
        this.addNumeric(workspace, 'spotBorder', 'Radial opacity', 0, 1);
        this.addNumeric(workspace, 'globalSpotScale', 'Scale', 0, 10);
        this.addNumeric(workspace, 'globalSpotVisibility', 'Visibility', 0, 1);
        this.addFlag(workspace, 'dataDependentVisibility', 'Visibility by data');
        return this;
    }

    TabControllerSpots.prototype = Object.create(TabControllerBase.prototype);

    return TabControllerSpots;
});
