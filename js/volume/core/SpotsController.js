'use strict';

define([
    'spotscontrollerbase'
],
function(SpotsControllerBase) {
    function SpotsController() {
        SpotsControllerBase.call(this, false);
        return this;
    }

    SpotsController.Events = SpotsControllerBase.Events;
    SpotsController.Scale = SpotsControllerBase.Scale;

    SpotsController.prototype = Object.create(SpotsControllerBase.prototype);

    return SpotsController;
});
