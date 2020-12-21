'use strict';

define([
    'tabcontrollerbase'
],
function(TabControllerBase) {
    function TabControllerSpots(container, workspace, views) {
        var description = 'Settings of spots visualization';
        var title = 'Spots';
        TabControllerBase.call(this, container, title, description, workspace);

        var spotsController = workspace.spotsController;
        this.addNumeric(spotsController, 'globalSpotOpacity', 'Opacity', 0, 1);
        this.addNumeric(spotsController, 'spotBorder', 'Border opacity', 0, 1);
        this.addFlag(spotsController, 'dataDependentOpacity', 'Proportional opacity');
        this.addNumeric(spotsController, 'globalSpotScale', 'Size factor', 0, 10);
        return this;
    }

    TabControllerSpots.prototype = Object.create(TabControllerBase.prototype);

    return TabControllerSpots;
});
