﻿'use strict';

define(['three', 'colormaps', 'eventsource', 'utils'],
function (THREE, ColorMap, EventSource, Utils) {
    function SpotsControllerBase(additionalMetadataRequired) {
        EventSource.call(this, SpotsControllerBase.Events);

        this._additionalMetadataRequired = additionalMetadataRequired;
        this._spots = [];

        this._spotBorder = 0.05;
        this._globalSpotOpacity = 1.0;
        this._dataDependentOpacity = false;

        this._globalSpotScale = 1.0;

        this._colorMap = ColorMap.Maps.VIRIDIS;
        this._scale = SpotsControllerBase.Scale.LINEAR;

        this._measures = [];
        this._activeMeasure = null;

        this._hotspotQuantile = 1.0;
        this._autoMinMax = true;
        this._minValue = 0.0;
        this._maxValue = 0.0;

        return this;
    }

    SpotsControllerBase.Events = {
        SPOTS_CHANGE: 'spots-change',
        SCALE_CHANGE: 'scale-change', // special event for the scaling as it requires sophisticated handler in 3D mode
        ATTR_CHANGE: 'attr-change',
        MAPPING_CHANGE: 'mapping-change',
        AUTO_MAPPING_CHANGE: 'auto-mapping-change',
        INTENSITIES_LOADED: 'intensities-loaded',
        INTENSITIES_CHANGE: 'intensities-change',
        BORDER_CHANGE: 'border-change'
    };

    SpotsControllerBase.Scale = {
        LOG: {
            id: 'log',
            function: Math.log10,
            filter: function (x) {
                return x > 0.0 && x < Infinity;
            },
            legend: 'log',
        },

        LINEAR: {
            id: 'linear',
            function: function (x) {
                return x;
            },
            filter: function (x) {
                return x > -Infinity && x < Infinity;
            },
            legend: '',
        }
    };

    SpotsControllerBase.getScaleById = function (id) {
        for (var i in SpotsControllerBase.Scale) {
            if (SpotsControllerBase.Scale[i].id == id) {
                return SpotsControllerBase.Scale[i];
            }
        }
        throw 'Invalid scale id: ' + id;
    };

    SpotsControllerBase.DataDependentOpacity = {
        MIN: 0.1,
        MAX: 1
    };

    SpotsControllerBase._createSpotsProperty = function (getter, setter, modificationEvent) {
        if (typeof getter === 'string') {
            var getName = getter;
            getter = function (spot) {
                return spot[getName];
            }
        } else if (!(getter instanceof Function)) {
            throw 'Scene property specifier must be function or string';
        }

        if (typeof setter === 'string') {
            var setName = setter;
            setter = function (spot, values) {
                return spot[setName] = values[spot.name][setName];
            }
        } else if (!(setter instanceof Function)) {
            throw 'Scene property specifier must be function or string';
        }

        return {
            get: function () {
                var result = {};
                if (!this._spots) {
                    return result;
                }
                for (var i = 0; i < this._spots.length; ++i) {
                    var spot = this._spots[i];
                    result[spot.name] = getter(spot);
                }
                return result;
            },
            set: function (values) {
                if (!this._spots) {
                    return;
                }
                for (var i = 0; i < this._spots.length; ++i) {
                    var spot = this._spots[i];
                    if (spot.name in values) {
                        setter(spot, values);
                    }
                }
                this._notify(modificationEvent);
            }
        };
    };

    SpotsControllerBase.prototype = Object.create(EventSource.prototype, {
        spots: {
            get: function () {
                return this._spots;
            },
            set: function (value) {
                this._spots = value ? value : [];
                if (this._additionalMetadataRequired) {
                    for (var i = 0; i < this._spots.length; i++) {
                        var spot = this._spots[i];
                        spot.scale = 1.0;
                        spot.color = new THREE.Color();
                        spot.opacity = 1.0;
                    }
                }
                this._notify(SpotsControllerBase.Events.SPOTS_CHANGE);
            }
        },

        measures: {
            get: function () {
                return this._measures;
            },
            set: function (value) {
                this._measures = Array.isArray(value) && value ? value : [];
                this._activeMeasure = null;
                this._notify(SpotsControllerBase.Events.INTENSITIES_LOADED);
            }
        },

        activeMeasure: {
            get: function() {
                return this._activeMeasure;
            },
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
                    this._updateIntensities();
                } else {
                    console.log('Potential programming error: attempt to change "hotspot quantile" parameter with "auto min/max" disabled.');
                }
            }
        },

        spotBorder: {
            get: function() {
                return this._spotBorder;
            },
            set: function(value) {
                if (this._spotBorder == value) {
                    return;
                }
                this._spotBorder = Utils.boundNumber(0.0, value, 1.0);
                this._notify(SpotsControllerBase.Events.BORDER_CHANGE);
                this._notify(SpotsControllerBase.Events.ATTR_CHANGE);
            }
        },

        globalSpotScale: {
            get: function () {
                return this._globalSpotScale;
            },
            set: function (value) {
                this._globalSpotScale = value < 0 ? 0 : value;
                this._notify(SpotsControllerBase.Events.SCALE_CHANGE);
            }
        },

        globalSpotOpacity: {
            get: function () {
                return this._globalSpotOpacity;
            },
            set: function (value) {
                this._globalSpotOpacity = Utils.boundNumber(0.0, value, 1.0);
                this._notify(SpotsControllerBase.Events.ATTR_CHANGE);
            }
        },

        colorMap: {
            get: function () {
                return this._colorMap;
            }
        },

        colorMapId: {
            get: function () {
                for (var i in ColorMap.Maps) {
                    if (this._colorMap === ColorMap.Maps[i]) {
                        return i;
                    }
                }
            },
            set: function (value) {
                if (value in ColorMap.Maps) {
                    this._colorMap = ColorMap.Maps[value];
                    this._notify(SpotsControllerBase.Events.MAPPING_CHANGE);
                }
            }
        },

        /*
         * @param {index} Index in the this.measures list.
         */
        selectMapByIndex: {
            value: function (index) {
                if (!this._measures) {
                    return;
                }
                this._activeMeasure = this._measures[index];
                if (this._autoMinMax) {
                    this._updateMinMaxValues();
                }
                this._updateIntensities();
            }
        },

        mapName: {
            get: function () {
                return this._activeMeasure ? this._activeMeasure.name : '';
            }
        },

        spotOpacity: SpotsControllerBase._createSpotsProperty('opacity', function (spot, opacity) {
            var v = opacity[spot.name];
            v = v < 0 ? 0 : v > 1 ? 1 : v;
            spot.opacity = v;
        }, SpotsControllerBase.Events.ATTR_CHANGE),

        spotColors: SpotsControllerBase._createSpotsProperty(function (spot) {
            return spot.color.getHexString();
        }, function (spot, colors) {
            spot.color = new THREE.Color(colors[spot.name]);
        }, SpotsControllerBase.Events.ATTR_CHANGE),

        spotScale: SpotsControllerBase._createSpotsProperty('scale', function (spot, scale) {
            var s = scale[spot.name];
            s = s < 0 ? 0 : s;
            spot.scale = s;
        }, SpotsControllerBase.Events.SCALE_CHANGE),

        dataDependentOpacity: {
            get: function() {
                return this._dataDependentOpacity;
            },
            set: function(value) {
                this._dataDependentOpacity = !!value;
                this._updateDataDependentOpacity();
                this._notify(SpotsControllerBase.Events.ATTR_CHANGE);
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
                    this._updateIntensities();
                }
                this._notify(SpotsControllerBase.Events.AUTO_MAPPING_CHANGE);
            }
        },

        minValue: {
            get: function() {
                return this._minValue;
            },

            set: function(value) {
                if (this._autoMinMax) return;
                this._minValue = Number(value);
                this._updateIntensities();
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
                this._updateIntensities();
                this._notify(SpotsControllerBase.Events.MAPPING_CHANGE);
            }
        },

        scale: {
            get: function() {
                return this._scale;
            }
        },

        scaleId: {
            get: function() {
                return this._scale.id;
            },

            set: function(value) {
                if (this._scale.id == value) return;
                this._scale = SpotsControllerBase.getScaleById(value);
                if (this._autoMinMax) this._updateMinMaxValues();
                this._onScaleChanged();
                this._notify(SpotsControllerBase.Events.MAPPING_CHANGE);
            }
        },

        _updateDataDependentOpacity: {
            value: function () {
                if (this._additionalMetadataRequired) {
                    const enabled = this._dataDependentOpacity;
                    const minOpacity = SpotsControllerBase.DataDependentOpacity.MIN;
                    const opacityRange = SpotsControllerBase.DataDependentOpacity.MAX - SpotsControllerBase.DataDependentOpacity.MIN;
                    for (let i = 0; i < this._spots.length; ++i) {
                        const spot = this._spots[i];
                        spot.opacity = enabled ? minOpacity + opacityRange * spot.intensity : 1;
                    }
                }
            }
        },

        _updateMinMaxValues: {
            value: function () {
                var values = this._activeMeasure ? this._activeMeasure.values : [];

                var values = Array.prototype.filter.call(values, this._scale.filter).sort(function (a, b) {
                    return a - b;
                });

                var minValue = values.length > 0 ? this._scale.function(values[0]) : 0.0;
                var maxValue = values.length > 0 ? this._scale.function(values[Math.ceil((values.length - 1) * this._hotspotQuantile)]) : 0.0;

                if (this._minValue != minValue || this._maxValue != maxValue) {
                    this._minValue = minValue;
                    this._maxValue = maxValue;
                    this._notify(SpotsControllerBase.Events.AUTO_MAPPING_CHANGE);
                    this._notify(SpotsControllerBase.Events.MAPPING_CHANGE);
                    return true;
                } else {
                    return false;
                }
            }
        },

        _updateIntensities: {
            value: function () {
                this._notify(SpotsControllerBase.Events.INTENSITIES_CHANGE);
            }
        },

        _onScaleChanged: {
            value: function() {
                
            }
        }
    });

    return SpotsControllerBase;
});
