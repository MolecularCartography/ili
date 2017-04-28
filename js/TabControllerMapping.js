'use strict';

define([
    'colormaps',
    'tabcontrollerbase',
    'workspace',
    'scene3d',
    'spotscontroller'
],
function (ColorMap, TabControllerBase, Workspace, Scene3D, SpotsController) {
    function TabControllerMapping(container, workspace, views) {
        var description = 'Settings of feature mapping visualization';
        var title = 'Mapping';
        TabControllerBase.call(this, container, title, description, workspace);

        var scaleOptions = [
            ['Linear', SpotsController.Scale.LINEAR.id],
            ['Logarithmic', SpotsController.Scale.LOG.id]
        ];

        var spotsController = workspace.spotsController;
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

        spotsController.addEventListener(SpotsController.Events.AUTO_MAPPING_CHANGE, this._onAutoMappingChange.bind(this, spotsController));
        spotsController.addEventListener(SpotsController.Events.MAPPING_CHANGE, this._onSceneChange.bind(this));

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

        _onSceneChange: {
            value: function () {
                this._updateIntensityControlStep(this._minIntensity);
                this._updateIntensityControlStep(this._maxIntensity);
            }
        },

        _updateIntensityControlStep: {
            value: function (control) {
                var newIntensityStep = control.get() < 100 ? 0.01 : 1
                if (control.step() != newIntensityStep) {
                    control.step(newIntensityStep);
                }
            }
        }
    });

    return TabControllerMapping;
});
