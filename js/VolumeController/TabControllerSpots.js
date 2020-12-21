'use strict';

define([
        'tabcontrollerbase'
    ],
    function(VolumeTabControllerBase) {
        function TabControllerSpots(container, volumeWorkspace, views) {
            var description = 'Settings of spots visualization';
            var title = 'Spots';
            VolumeTabControllerBase.call(this, container, title, description, volumeWorkspace);

            var spotsController = volumeWorkspace.spotsController;
            this.addNumeric(spotsController, 'globalSpotOpacity', 'Opacity', 0, 1);
            this.addNumeric(spotsController, 'spotBorder', 'Border opacity', 0, 1);
            this.addFlag(spotsController, 'dataDependentOpacity', 'Proportional opacity');
            this.addNumeric(spotsController, 'globalSpotScale', 'Size factor', 0, 10);
            return this;
        }

        TabControllerSpots.prototype = Object.create(VolumeTabControllerBase.prototype);

        return TabControllerSpots;
    });
