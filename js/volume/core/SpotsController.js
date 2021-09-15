'use strict';

define([
    'spotscontrollerbase',
    'utils',
],
function(SpotsControllerBase, Utils) {
    function SpotsController() {
        SpotsControllerBase.call(this, false);
        this.spotBorder = 1.0;
        this.globalSpotOpacity = 0.75;
        return this;
    }

    SpotsController.Events = SpotsControllerBase.Events;
    SpotsController.Scale = SpotsControllerBase.Scale;

    SpotsController.prototype = Object.create(SpotsControllerBase.prototype, {});

    return SpotsController;
});
