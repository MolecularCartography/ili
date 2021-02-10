'use strict';

define([
    'spotscontrollerbase',
    'utils',
],
function(SpotsControllerBase, Utils) {
    function SpotsController() {
        SpotsControllerBase.call(this, false);
        this.spotBorder = 1.0;
        this.globalSpotOpacity = 0.5;
        return this;
    }

    SpotsController.Events = SpotsControllerBase.Events;
    SpotsController.Scale = SpotsControllerBase.Scale;

    SpotsController.prototype = Object.create(SpotsControllerBase.prototype, {
        minValue: {
            get: function() {
                return this._minValue;
            },

            set: function(value) {
                if (this._autoMinMax) return;
                this._minValue = Number(value);
                this._notify(SpotsControllerBase.Events.MAPPING_CHANGE);
            }
        },

        maxValue: {
            get: function() {
                return this._maxValue;
            },

            set: function(value) {
                if (this._autoMinMax) return;
                this._maxValue = Number(value);
                this._notify(SpotsControllerBase.Events.MAPPING_CHANGE);
            }
        },

        hotspotQuantile: {
            get: function () {
                return this._hotspotQuantile;
            },

            set: function (value) {
                if (this._hotspotQuantile == value) {
                    return;
                }
                this._hotspotQuantile = Utils.boundNumber(0.0, value, 1.0);
                if (this._autoMinMax) {
                    this._updateMinMaxValues();
                } else {
                    console.log('Potential programming error: attempt to change "hotspot quantile" parameter with "auto min/max" disabled.');
                }
                this._notify(SpotsControllerBase.Events.AUTO_MAPPING_CHANGE);
            }
        },

        autoMinMax: {
            get: function() {
                return this._autoMinMax;
            },

            set: function(value) {
                this._autoMinMax = !!value;
                if (this._autoMinMax) {
                    this._updateMinMaxValues();
                }
                this._notify(SpotsControllerBase.Events.AUTO_MAPPING_CHANGE);
            }
        },
    });

    return SpotsController;
});
