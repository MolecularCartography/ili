/**
 * Main application page.
 */
'use strict';

define(['volumeworkspace', 'volumeviewcontainer', 'volumemapselector', 'volumesettingscontroller', 'volumespotscontroller', 'appbase'],
function (Workspace, ViewContainer, MapSelector, AppSettingsController, SpotsController, AppBase)
{
    const initializers = {
        createSpotsController: function() { return new SpotsController(); },
        createWorkspace: function(spotsController) { return new Workspace(spotsController); },
        createViewContainer: function(workspace, div) { return new ViewContainer(workspace, div); },
        createMapSelector: function(workspace, mapSelectorDiv, mapLabelDiv) { return new MapSelector(workspace, mapSelectorDiv, mapLabelDiv); },
        createSettingsController: function(div, workspace, viewContainer) { return new AppSettingsController(div, workspace, viewContainer); }
    };

    function ili(appContainer) {
        AppBase.call(this, appContainer, initializers);
        return this;
    };

    ili.prototype = Object.create(AppBase.prototype, {
        render: {
            value: function () {
                console.log('VolumeRender');
            }
        },

        /* @opacity should be an object { spot_name: opacity_value }
            *
            * opacity_value should be a number from the interval of [0; 1]
            */
        spotOpacity: {
            get: function() {
                return this._spotsController.spotOpacity;
            },
            set: function (opacity) {
                this._spotsController.spotOpacity = opacity;
            }
        },

        /* @opacity should be a number from the interval of [0; 1]
            */
        globalSpotOpacity: {
            get: function () {
                return this._spotsController.globalSpotOpacity;
            },
            set: function (opacity) {
                this._spotsController.globalSpotOpacity = opacity;
            }
        },

        /* @scale should be an object { spot_name: scale_value }
            *
            * scale_value should be a non-negative number
            */
        spotScale: {
            get: function() {
                return this._spotsController.spotScale;
            },
            set: function (scale) {
                this._spotsController.spotScale = scale;
            }
        },

        /* @scale should be a non-negative number
            */
        globalSpotScale: {
            get: function () {
                return this._spotsController.globalSpotScale;
            },
            set: function (scale) {
                this._spotsController.globalSpotScale = scale;
            }
        },
    });

    return ili;
});
