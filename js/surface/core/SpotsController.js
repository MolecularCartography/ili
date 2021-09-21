'use strict';

define([
    'spotscontrollerbase'
],
function(SpotsControllerBase) {
    function SpotsController() {
        SpotsControllerBase.call(this, true);
        return this;
    }

    SpotsController.Events = SpotsControllerBase.Events;
    SpotsController.Scale = SpotsControllerBase.Scale;

    SpotsController.prototype = Object.create(SpotsControllerBase.prototype, {

        _onScaleChanged: {
            value: function() {
                this._updateIntensities()
            }
        },

        _updateIntensities: {
            value: function () {
                if (!this._spots) {
                    return;
                }          
                for (var i = 0; i < this._spots.length; i++) {
                    var scaledValue = this._activeMeasure && this._scale.function(this._activeMeasure.values[i]);
                    var intensity = NaN;

                    if (scaledValue >= this._maxValue) {
                        intensity = 1.0;
                    } else if (scaledValue >= this._minValue) {
                        intensity = (scaledValue - this._minValue) / (this._maxValue - this._minValue);
                    }
                    this._spots[i].intensity = intensity;
                }       
                this._updateDataDependentOpacity();
                SpotsControllerBase.prototype._updateIntensities.call(this);
            }
        }

    });

    return SpotsController;
});
