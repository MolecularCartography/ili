'use strict';

define([
    'colormaps',
    'tabcontrollerbase',
    'workspace'
],
function (ColorMap, TabControllerBase, Workspace) {
    function TabControllerMapping(container, workspace, views) {
        var description = 'Settings of feature mapping visualization';
        var title = 'Mapping';
        TabControllerBase.call(this, container, title, description, workspace);

        var scaleOptions = [
            ['Linear', Workspace.Scale.LINEAR.id],
            ['Logarithmic', Workspace.Scale.LOG.id]
        ];
        this.addChoice(workspace, 'scaleId', 'Scale', scaleOptions);
        this.addNumeric(workspace, 'hotspotQuantile', 'Hotspot quantile', 0, 1);

        var colorMapOptions = Object.keys(ColorMap.Maps).reduce(function (prev, cur) {
            prev.push([ColorMap.Maps[cur].name, cur]);
            return prev;
        }, []);
        this.addChoice(workspace, 'colorMapId', 'Color map', colorMapOptions);

        this._minIntensity = this.addNumeric(workspace, 'minValue', 'Min intensity');
        this._maxIntensity = this.addNumeric(workspace, 'maxValue', 'Max intensity');
        this._autoMinMax = this.addFlag(workspace, 'autoMinMax', 'Auto Min/Max');
        workspace.addEventListener(Workspace.Events.AUTO_MAPPING_CHANGE, this._onAutoMappingChange.bind(this, workspace));

        return this;
    }

    TabControllerMapping.prototype = Object.create(TabControllerBase.prototype, {
        _onAutoMappingChange: {
            value: function (workspace) {
                var disabled = workspace.autoMinMax;

                if (disabled) {
                    this._minIntensity.disable();
                    this._maxIntensity.disable();
                } else {
                    this._minIntensity.enable();
                    this._maxIntensity.enable();
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
