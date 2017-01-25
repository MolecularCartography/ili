'use strict';

define([
    'workspace', 'tabcontroller2d', 'tabcontroller3d', 'tabcontrollermapping',
    'tabcontrollerexamples', 'tabcontrollerdocumentation'
],
function (Workspace, TabController2D, TabController3D, TabControllerMapping, TabControllerExamples, TabControllerDocumentation) {
    function AppSettingsController(appContainer, workspace, views) {
        this._workspace = workspace;
        this._tabsContainer = $(appContainer.querySelector('#tabs-container'));
        this._tabHeadersList = $(appContainer.querySelector('#tabs-list'));

        this._tabs = {};
        var tab2D = this._addTab(TabController2D, views);
        this._tabs['2D'] = tab2D;
        var tab3D = this._addTab(TabController3D, views);
        this._tabs['3D'] = tab3D;
        this._tabs['mapping'] = this._addTab(TabControllerMapping, views);
        var tabExamples = this._addTab(TabControllerExamples, views);
        this._tabs['examples'] = tabExamples;
        this._tabs['doc'] = this._addTab(TabControllerDocumentation, views);

        tabExamples.activate();

        this._workspace.addEventListener(Workspace.Events.MODE_CHANGE, function () {
            if (this._workspace.mode === Workspace.Mode.MODE_2D) {
                tab2D.activate();
            } else if (this._workspace.mode === Workspace.Mode.MODE_3D) {
                tab3D.activate();
            }
        }.bind(this));

        return this;
    }

    AppSettingsController.VERSION = {
        current: 1.0,
        minCompatible: 1.0
    };

    AppSettingsController.SETTINGS_KEYS = {
        VERSION: 'version',
        SELECTED_MAP: 'selected_map'
    };

    AppSettingsController.prototype = Object.create(null, {
        serialize: {
            value: function () {
                var data = {};
                data[AppSettingsController.SETTINGS_KEYS.VERSION] = AppSettingsController.VERSION;
                data[AppSettingsController.SETTINGS_KEYS.SELECTED_MAP] = this._workspace.mapName;
                for (var key in this._tabs) {
                    data[key] = this._tabs[key];
                }
                return new Blob([JSON.stringify(data)], { type: 'application/json' })
            }
        },

        _addTab: {
            value: function (viewConstructor, views) {
                // nothing but a temporary id
                var id = (Math.round(1000000 * Math.random())).toString();

                var tab = this._tabsContainer.append('<div class="emperor-tab-div tab-pane fade" id="' + id + '"></div>');

                // dynamically instantiate the controller, see:
                // http://stackoverflow.com/a/8843181
                var params = [null, '#' + id, this._workspace, views];
                var obj = new (Function.prototype.bind.apply(viewConstructor, params));

                // set the identifier of the div to the one defined by the object
                $('#' + id).attr('id', obj.identifier);

                // now add the list element linking to the container div with the proper
                // title
                this._tabHeadersList.append('<li><a data-toggle="tab" href="#'
                    + obj.identifier + '">' + obj.title + '</a></li>');

                return obj;
            }
        }
    });

    return AppSettingsController;
});
