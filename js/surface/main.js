/**
 * Main application page.
 */
'use strict';

define(['surfaceworkspace', 'surfaceviewcontainer', 'surfacemapselector', 'surfacesettingscontroller', 'surfacespotscontroller', 'appbase', 'utils'],
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
        AppBase.call(this, appEnvironment, appContainer, initializers, Utils.webglEnabled);
        return this;
    };

    ili.prototype = Object.create(AppBase.prototype, {
        render: {
            value: function () {
                if (this._workspace.mode == Workspace.Mode.MODE_2D) {
                    this._view.v2d._renderSpots();
                } else if (this._workspace.mode == Workspace.Mode.MODE_3D) {
                    this._views.g3d.requestAnimationFrame();
                }
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

        /* @colors should be an object { spot_name: color_value }
            *
            * color_value can be expressed in the following ways:
            * * hex Number (e.g. 0xff0000)
            * * RGB string (e.g. "rgb(255, 0, 0)" or "rgb(100%, 0%, 0%)")
            * * X11 color name (e.g. "skyblue")
            * * HSL string (e.g. "hsl(0, 100%, 50%)")
            */
        spotColors: {
            get: function () {
                return this._spotsController.spotColors;
            },
            set: function (colors) {
                this._spotsController.spotColors = colors;
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
