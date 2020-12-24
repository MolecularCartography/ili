/**
 * Main application page.
 */
'use strict';

define(['volumeworkspace', 'volumeviewcontainer', 'volumemapselector', 'volumesettingscontroller', 'volumespotscontroller', 'appbase', 'utils'],
function (Workspace, ViewContainer, MapSelector, AppSettingsController, SpotsController, AppBase, Utils)
{
    const initializers = {
        createSpotsController: function() { return new SpotsController(); },
        createWorkspace: function(spotsController) { return new Workspace(spotsController); },
        createViewContainer: function(workspace, div) { return new ViewContainer(workspace, div); },
        createMapSelector: function(workspace, mapSelectorDiv, mapLabelDiv) { return new MapSelector(workspace, mapSelectorDiv, mapLabelDiv); },
        createSettingsController: function(div, workspace, viewContainer) { return new AppSettingsController(div, workspace, viewContainer); }
    };

    function ili(appEnvironment, appContainer) {
        AppBase.call(this, appEnvironment, appContainer, initializers, Utils.webgl2Enabled);
        return this;
    };

    ili.prototype = Object.create(AppBase.prototype, {
        render: {
            value: function () {
                this._views.g3d.requestAnimationFrame();
            }
        },
    });

    return ili;
});
