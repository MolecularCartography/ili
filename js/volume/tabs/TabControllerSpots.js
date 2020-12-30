'use strict';

define([
        'tabcontrollerbase'
    ],
    function(TabControllerBase) {
        function TabControllerSpots(container, volumeWorkspace, views) {
            var description = 'Settings of spots visualization';
            var title = 'Spots';
            TabControllerBase.call(this, container, title, description, volumeWorkspace);

            var spotsController = volumeWorkspace.spotsController;
            this.addNumeric(spotsController, 'globalSpotOpacity', 'Opacity', 0, 1);
            this.addNumeric(spotsController, 'spotBorder', 'Border opacity', 0, 1, 250);
            this.addFlag(spotsController, 'dataDependentOpacity', 'Proportional opacity');
            this.addNumeric(spotsController, 'globalSpotScale', 'Size factor', 0, 5, 250);
            return this;
        }

        TabControllerSpots.prototype = Object.create(TabControllerBase.prototype);

        return TabControllerSpots;
    });
