'use strict';

define([
    'settingscontrollerbase', 'volumeworkspace', 'volumetabcontrollerspots', 'volumetabcontroller3d', 'volumetabcontrollermapping',
    'volumetabcontrollerexamples', 'volumetabcontrollerdocumentation'
],
function (SettingsControllerBase, Workspace, TabControllerSpots, TabController3D, TabControllerMapping, TabControllerExamples, TabControllerDocumentation) {
    function SettingsController(appContainer, workspace, views) {
        SettingsControllerBase.call(this, appContainer, workspace, views);

        this.addTab(TabControllerSpots, 'spots');
        var tabMapping = this.addTab(TabControllerMapping, 'mapping');
        var tab3D = this.addTab(TabController3D, '3D');
        var tabExamples = this.addTab(TabControllerExamples, 'examples');
        this.addTab(TabControllerDocumentation, 'doc');

        tabExamples.activate();

        return this;
    }

    SettingsController.VERSION = SettingsControllerBase.VERSION;
    SettingsController.SETTINGS_KEYS = SettingsControllerBase.SETTINGS_KEYS;

    SettingsController.prototype = Object.create(SettingsControllerBase.prototype);

    return SettingsController;
});
