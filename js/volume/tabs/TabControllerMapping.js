'use strict';

define([
        'colormaps',
        'tabcontrollerbase',
        'volumespotscontroller'
    ],
    function (ColorMap, TabControllerBase , VolumeSpotsController) {
        function TabControllerMapping(container, volumeWorkspace, views) {
            var description = 'Settings of feature mapping visualization';
            var title = 'Mapping';
            TabControllerBase.call(this, container, title, description, volumeWorkspace);

            var scaleOptions = [
                ['Linear', VolumeSpotsController.Scale.LINEAR.id],
                ['Logarithmic', VolumeSpotsController.Scale.LOG.id]
            ];

            var spotsController = volumeWorkspace.spotsController;
            this.addChoice(spotsController, 'scaleId', 'Scale', scaleOptions);

            var colorMapOptions = Object.keys(ColorMap.Maps).reduce(function (prev, cur) {
                prev.push([ColorMap.Maps[cur].name, cur]);
                return prev;
            }, []);
            this.addChoice(spotsController, 'colorMapId', 'Color map', colorMapOptions);

            var autoMinMax = this.addFlag(spotsController, 'autoMinMax', 'Auto Min/Max');
            autoMinMax.restoreFirst = true;

            this._hotspotQuantile = this.addNumeric(spotsController, 'hotspotQuantile', 'Hotspot quantile', 0, 1);

            this._minIntensity = this.addNumeric(spotsController, 'minValue', 'Min intensity');
            this._maxIntensity = this.addNumeric(spotsController, 'maxValue', 'Max intensity');
            spotsController.addEventListener(VolumeSpotsController.Events.AUTO_MAPPING_CHANGE, this._onAutoMappingChange.bind(this, spotsController));


            return this;
        }

        TabControllerMapping.prototype = Object.create(TabControllerBase.prototype, {
            _onAutoMappingChange: {
                value: function (spotsController) {
                    var disabled = spotsController.autoMinMax;

                    if (disabled) {
                        this._minIntensity.disable();
                        this._maxIntensity.disable();
                        this._hotspotQuantile.enable();
                    } else {
                        this._minIntensity.enable();
                        this._maxIntensity.enable();
                        this._hotspotQuantile.disable();
                    }

                    if (disabled) {
                        this._minIntensity.refresh();
                        this._maxIntensity.refresh();
                    }
                }
            },

        });

        return TabControllerMapping;
    });
