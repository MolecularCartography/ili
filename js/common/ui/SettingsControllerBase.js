'use strict';

define([
    'workspacebase'
],
function (WorkspaceBase) {
    function SettingsControllerBase(appContainer, workspace, views) {
        this._workspace = workspace;
        this._views = views;
        this._tabsContainer = $(appContainer.querySelector('#tabs-container'));
        this._tabHeadersList = $(appContainer.querySelector('#tabs-list'));

        this._tabs = {};

        this._workspace.addEventListener(WorkspaceBase.Events.SETTINGS_CHANGE, this.restore.bind(this));
        this._workspace.addEventListener(WorkspaceBase.Events.REQUEST_SETTINGS, this._onSettingsRequest.bind(this));

        return this;
    }

    SettingsControllerBase.VERSION = {
        current: 1,
        minCompatible: 1
    };

    SettingsControllerBase.SETTINGS_KEYS = {
        VERSION: 'version',
        SELECTED_MAP: 'selected_map',
        VIEWS: 'views_state',
        PARAMS: 'params'
    };

    SettingsControllerBase.prototype = Object.create(null, {
        serialize: {
            value: function () {
                return new Blob([JSON.stringify(this._getCurrentSettings())], { type: 'application/json' })
            }
        },

        restore: {
            value: function() {
                var newSettings = this._workspace.loadedSettings;

                var newSettingsVersion = newSettings[SettingsControllerBase.SETTINGS_KEYS.VERSION];
                if (typeof newSettingsVersion == 'undefined') {
                    alert('Loading failed: the file with visualization settings does not contain information about `ili version it is compatible with.');
                    return;
                }
                if (SettingsControllerBase.VERSION.current > newSettingsVersion.current) {
                    alert('Warning: the file with visualization settings was created by an older version of `ili. Settings may be restored partially.');
                }
                if (SettingsControllerBase.VERSION.current < newSettingsVersion.minCompatible) {
                    alert('Loading failed: the file with visualization settings was created by a newer version of `ili that is not compatible with the current one.');
                    return;
                }

                var viewsSettings = newSettings[SettingsControllerBase.SETTINGS_KEYS.VIEWS];
                if (typeof viewsSettings != 'undefined') {
                    this._views.fromJSON(viewsSettings);
                } else {
                    console.error('File with settings does not contain info about views state.');
                }

                var tabs = newSettings[SettingsControllerBase.SETTINGS_KEYS.PARAMS];
                for (var tabId in tabs) {
                    if (tabId in this._tabs) {
                        this._tabs[tabId].fromJSON(tabs[tabId]);
                    } else {
                        console.error('Tab with ID "' + tabId + '" is not present on the sidebar, but found in the file with visualization settings.');
                    }
                }
            }
        },

        _addTab: {
            value: function (viewConstructor, views, tag) {
                // nothing but a temporary id
                var id = (Math.round(1000000 * Math.random())).toString();

                var tab = this._tabsContainer.append('<div class="emperor-tab-div tab-pane fade" id="' + id + '"></div>');
    
                // dynamically instantiate the controller, see:
                // http://stackoverflow.com/a/8843181
                var params = [null, '#' + id, this._workspace, views];
                var obj = new (Function.prototype.bind.apply(viewConstructor, params));
                this._tabs[tag] = obj;

                // set the identifier of the div to the one defined by the object
                $('#' + id).attr('id', obj.identifier);

                // now add the list element linking to the container div with the proper
                // title
                this._tabHeadersList.append('<li><a data-toggle="tab" href="#'
                    + obj.identifier + '">' + obj.title + '</a></li>');

                return obj;
            }
        },

        addTab: {
            value: function (viewConstructor, tag) {
                return this._addTab(viewConstructor, this._views, tag);
            }
        },

        _getCurrentSettings: {
            value: function() {
                var data = {};
                data[SettingsControllerBase.SETTINGS_KEYS.VERSION] = SettingsControllerBase.VERSION;
                data[SettingsControllerBase.SETTINGS_KEYS.SELECTED_MAP] = this._workspace.spotsController.mapName;
                data[SettingsControllerBase.SETTINGS_KEYS.VIEWS] = this._views.toJSON();

                var tabs = {};
                data[SettingsControllerBase.SETTINGS_KEYS.PARAMS] = tabs;
                for (var key in this._tabs) {
                    tabs[key] = this._tabs[key];
                }
                return data;
            }
        },

        _onSettingsRequest: {
            value: function() {
                this._workspace.currentSettings = this._getCurrentSettings();
            }
        }
    });

    return SettingsControllerBase;
});
