'use strict';

define([
    'colormaps',
    'tabcontrollerbase',
    'workspace',
    'scene3d'
],
function (ColorMap, TabControllerBase, Workspace, Scene3D) {
    function TabControllerMapping(container, workspace, views) {
        var description = 'Settings of feature mapping visualization';
        var title = 'Mapping';
        TabControllerBase.call(this, container, title, description, workspace);

        var scaleOptions = [
            ['Linear', Workspace.Scale.LINEAR.id],
            ['Logarithmic', Workspace.Scale.LOG.id]
        ];
        this.addChoice(workspace, 'scaleId', 'Scale', scaleOptions);

        var colorMapOptions = Object.keys(ColorMap.Maps).reduce(function (prev, cur) {
            prev.push([ColorMap.Maps[cur].name, cur]);
            return prev;
        }, []);
        this.addChoice(workspace, 'colorMapId', 'Color map', colorMapOptions);

        var autoMinMax = this.addFlag(workspace, 'autoMinMax', 'Auto Min/Max');
        autoMinMax.restoreFirst = true;

        this._hotspotQuantile = this.addNumeric(workspace, 'hotspotQuantile', 'Hotspot quantile', 0, 1);

        this._minIntensity = this.addNumeric(workspace, 'minValue', 'Min intensity');
        this._maxIntensity = this.addNumeric(workspace, 'maxValue', 'Max intensity');

        workspace.addEventListener(Workspace.Events.AUTO_MAPPING_CHANGE, this._onAutoMappingChange.bind(this, workspace));
        workspace.addEventListener(Workspace.Events.MAPPING_CHANGE, this._onSceneChange.bind(this));

        return this;
    }

    TabControllerMapping.prototype = Object.create(TabControllerBase.prototype, {
        _onAutoMappingChange: {
            value: function (workspace) {
                var disabled = workspace.autoMinMax;

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
