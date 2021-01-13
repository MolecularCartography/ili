'use strict';

define([
    'spotscontrollerbase'
],
function(SpotsControllerBase) {
    function SpotsController() {
        SpotsControllerBase.call(this, false);
        this.spotBorder = 1.0;
        this.globalSpotOpacity = 0.5;
        return this;
    }

    SpotsController.Events = SpotsControllerBase.Events;
    SpotsController.Scale = SpotsControllerBase.Scale;

    SpotsController.prototype = Object.create(SpotsControllerBase.prototype, {
        _updateIntensities: {
            value: function () {
                this._notify(SpotsControllerBase.Events.ATTR_CHANGE);
            }
        },
    });

    return SpotsController;
});
