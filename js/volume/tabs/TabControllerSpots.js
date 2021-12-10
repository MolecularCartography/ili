'use strict';

define([
        'tabcontrollerbase'
    ],
    function(TabControllerBase) {

        const opacityModes = [
            ['None', 0],
            ['Normalized', 1],
            ['Transfer', 2]
        ];

        function TabControllerSpots(container, volumeWorkspace, views) {
            var description = 'Settings of spots visualization';
            var title = 'Spots';
            TabControllerBase.call(this, container, title, description, volumeWorkspace);

            const spotsController = volumeWorkspace.spotsController;
            const dataContainer = volumeWorkspace.dataContainer;

            this.addFlag(volumeWorkspace.dataContainer, 'isIntensityEnabled', 'Enabled');
            this.addNumeric(spotsController, 'globalSpotOpacity', 'Opacity', 0, 1);
            this.addNumeric(spotsController, 'spotBorder', 'Border opacity', 0, 1, 250);
            this.addChoice(dataContainer, 'intensityTransferFunctionSource', 'Opacity Mode', opacityModes);
            this.addFlag(volumeWorkspace.dataContainer, 'isShapeBasedIntensityEnabled', 'Shape Based Opacity');
            this.addNumeric(spotsController, 'globalSpotScale', 'Size factor', 0, 5, 250);
            this.addTransferFunctionControl(dataContainer, 'intensityTransferFunction', 'Intensity TF');
            return this;
        }

        TabControllerSpots.prototype = Object.create(TabControllerBase.prototype);

        return TabControllerSpots;
    });
