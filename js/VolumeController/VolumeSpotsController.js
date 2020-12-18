'use strict';

define(['three', 'colormaps', 'eventsource', 'utils'],
    function (THREE, ColorMap, EventSource, Utils) {
        function VolumeSpotsController() {
            EventSource.call(this, VolumeSpotsController.Events);

            this._spots = [];

            this._spotBorder = 0.05;
            this._globalSpotOpacity = 1.0;
            this._dataDependentOpacity = false;

            this._globalSpotScale = 1.0;

            this._colorMap = ColorMap.Maps.VIRIDIS;
            this._scale = VolumeSpotsController.Scale.LINEAR;

            this._hotspotQuantile = 1.0;
            this._autoMinMax = true;
            this._minValue = 0.0;
            this._maxValue = 0.0;
        }

        VolumeSpotsController.Events = {
            SPOTS_CHANGE: 'spots-change',
            SCALE_CHANGE: 'scale-change', // special event for the scaling as it requires sophisticated handler in 3D mode
            ATTR_ATTR_CHANGE: 'attr-change',
            MAPPING_CHANGE: 'mapping-change',
            AUTO_MAPPING_CHANGE: 'auto-mapping-change',
        };

        VolumeSpotsController.Scale = {
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

        VolumeSpotsController.getScaleById = function (id) {
            for (let i in VolumeSpotsController.Scale) {
                if (VolumeSpotsController.Scale[i].id === id) {
                    return VolumeSpotsController.Scale[i];
                }
            }
            throw 'Invalid scale id: ' + id;
        };

        VolumeSpotsController.DataDependentOpacity = {
            MIN: 0.1,
            MAX: 1
        };


        VolumeSpotsController.prototype = Object.create(EventSource.prototype, {

            hotspotQuantile: {
                get: function () {
                    return this._hotspotQuantile;
                },

                set: function (value) {
                    console.log('hotspot quantile: ', value);
                    if (this._hotspotQuantile === value) {
                        return;
                    }
                    this._hotspotQuantile = Utils.boundNumber(0.0, value, 1.0);

                }
            },

            spotBorder: {
                get: function() {
                    return this._spotBorder;
                },
                set: function(value) {
                    if (this._spotBorder === value) {
                        return;
                    }
                    this._spotBorder = Utils.boundNumber(0.0, value, 1.0);
                    console.log('border opacity: ', value);
                }
            },

            globalSpotScale: {
                get: function () {
                    return this._globalSpotScale;
                },
                set: function (value) {
                    this._globalSpotScale = value < 0 ? 0 : value;
                    console.log('size factor: ', value);
                }
            },

            globalSpotOpacity: {
                get: function () {
                    return this._globalSpotOpacity;
                },
                set: function (value) {
                    this._globalSpotOpacity = Utils.boundNumber(0.0, value, 1.0);
                    console.log('opacity: ', value);
                }
            },

            colorMap: {
                get: function () {
                    return this._colorMap;
                }
            },

            colorMapId: {
                get: function () {
                    for (let i in ColorMap.Maps) {
                        if (this._colorMap === ColorMap.Maps[i]) {
                            return i;
                        }
                    }
                },
                set: function (value) {
                    if (value in ColorMap.Maps) {
                        this._colorMap = ColorMap.Maps[value];
                        this._notify(VolumeSpotsController.Events.MAPPING_CHANGE);
                    }
                    console.log('color map id: ', value);
                }
            },

            dataDependentOpacity: {
                get: function() {
                    return this._dataDependentOpacity;
                },
                set: function(value) {
                    this._dataDependentOpacity = !!value;
                    console.log('proportional opacity: ', value);
                }
            },

            autoMinMax: {
                get: function() {
                    return this._autoMinMax;
                },

                set: function(value) {
                    this._autoMinMax = !!value;
                    console.log('auto min/max: ', value);
                    this._notify(VolumeSpotsController.Events.AUTO_MAPPING_CHANGE);
                }
            },

            minValue: {
                get: function() {
                    return this._minValue;
                },

                set: function(value) {
                    if (this._autoMinMax) return;
                    this._minValue = Number(value);
                    console.log('min value: ', value);
                }
            },

            maxValue: {
                get: function() {
                    return this._maxValue;
                },

                set: function(value) {
                    if (this._autoMinMax) return;
                    this._maxValue = Number(value);
                    console.log('max value: ', value);
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
                    if (this._scale.id === value) return;
                    this._scale = VolumeSpotsController.getScaleById(value);
                    console.log('scale id: ', value);
                    this._notify(VolumeSpotsController.Events.MAPPING_CHANGE);
                }
            },


        });

        return VolumeSpotsController;
    });
