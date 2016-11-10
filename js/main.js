/**
 * Main application page.
 */
'use strict';

define([
    'workspace', 'viewcontainer', 'viewgroup3d', 'mapselector', 'colormaps', 'filesaver', 'utils',
    'dragndrop', 'text!../template.html', 'jquery', 'jqueryui', 'tabcontroller2d', 'tabcontroller3d', 'tabcontrollermapping',
    'tabcontrollerexamples'
],
function (Workspace, ViewContainer, ViewGroup3D, MapSelector, ColorMap, saveAs, Utils, DragAndDrop, appLayout,
    $, $ui, TabController2D, TabController3D, TabControllerMapping, TabControllerExamples)
{
    function ili(appContainer) {
        this._appContainer = appContainer;
        this._appContainer.innerHTML = appLayout;

        this._workspace = new Workspace();
        this._views = new ViewContainer(this._workspace, this._appContainer.querySelector('#view-container'));
        this._mapSelector = new MapSelector(this._workspace, this._appContainer.querySelector('#map-selector'),
            this._appContainer.querySelector('#current-map-label'));

        this._initTabs();

        this._workspace.addEventListener(Workspace.Events.STATUS_CHANGE, this._onWorkspaceStatusChange.bind(this));
        this._workspace.addEventListener(Workspace.Events.ERRORS_CHANGE, this._onWorkspaceErrorsChange.bind(this));

        this._initKeyboardShortcuts(this._workspace, this._views, this._mapSelector);

        this._appContainer.querySelector('#open-button').onclick = this.chooseFilesToOpen.bind(this);
        this._appContainer.querySelector('#current-map-label').onclick = this._mapSelector.activate.bind(this._mapSelector);
        this._appContainer.querySelector('#view-container').onmousedown = this._mapSelector.deactivate.bind(this._mapSelector);
        this._appContainer.querySelector('div#errors #close').onclick = this._workspace.clearErrors.bind(this._workspace);
        window.addEventListener('resize', function() {
            this.resize.call(this, window.innerWidth, window.innerHeight);
        }.bind(this));

        this._dnd = new DragAndDrop(this._workspace, this._appContainer, this._openFiles.bind(this));

        if (window.location.search) {
            var fileNames = window.location.search.substr(1).split(';');
            this._workspace.download(fileNames);
        }
    }

    ili.prototype = Object.create(null, {
        chooseFilesToOpen: {
            value: function() {
                var fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.multiple = true;
                fileInput.addEventListener('change', function() {
                    this._openFiles(fileInput.files);
                }.bind(this));
                fileInput.click();
            }
        },

        takeSnapshot: {
            value: function() {
                var name = this._workspace.mapName || 'image';
                this._views.export().then(function(blob) {
                    saveAs(blob, name + '.png', 'image/png');
                });
            }
        },

        resize: {
            value: function(width, height) {
                this._views.updateLayout();
            }
        },

        render: {
            value: function () {
                if (this._workspace.mode == Workspace.Mode.MODE_2D) {
                    this._view.v2d._renderSpots();
                } else if (this._workspace.mode == Workspace.Mode.MODE_3D) {
                    this._views.g3d.requestAnimationFrame();
                }
            }
        },

        _initKeyboardShortcuts: {
            value: function() {
                this._keyboardShortcuts = {
                    '38': function() { // ArrowUp
                        this._mapSelector.blink();
                        this._mapSelector.navigate(MapSelector.Direction.UP);
                    },
                    '40': function() { // ArrowDown
                        this._mapSelector.blink();
                        this._mapSelector.navigate(MapSelector.Direction.DOWN);
                    }
                };
                this._keyboardShortcuts[Utils.isWebkit ? '79' : '111'] = this.chooseFilesToOpen; // Ctrl + O
                this._keyboardShortcuts[Utils.isWebkit ? '70' : '102'] = function() { this._mapSelector.activate(); }; // Ctrl + F
                this._keyboardShortcuts[Utils.isWebkit ? '83' : '115'] = this.takeSnapshot; // Ctrl + S

                this._keyboardShortcuts['38'] = this._keyboardShortcuts['38'];
                this._keyboardShortcuts['40'] = this._keyboardShortcuts['40'];

                document.addEventListener(Utils.keyPressEvent(), this._onKeyPress.bind(this), false);
            }
        },

        _onKeyPress: {
            value: function(event) {
                if ((/^Mac/i).test(navigator.platform)) {
                    if (event.ctrlKey || event.altKey || !event.metaKey) return;
                } else {
                    if (!event.ctrlKey || event.altKey || event.metaKey) return;
                }

                var key = (event.which ? event.which : event.keyCode).toString();
                if (key in this._keyboardShortcuts) {
                    event.preventDefault();
                    var handler = this._keyboardShortcuts[key];
                    handler.call(this);
                    return false;
                }
            }
        },

        _onWorkspaceStatusChange: {
            value: function() {
                var statusContainer = this._appContainer.querySelector('#status');
                if (this._workspace.status) {
                    statusContainer.innerHTML = this._workspace.status;
                    statusContainer.removeAttribute('hidden');
                } else {
                    statusContainer.setAttribute('hidden', 'true');
                }
            }
        },

        _onWorkspaceErrorsChange: {
            value: function () {
                var errorBox = this._appContainer.querySelector('div#errors');
                var list = errorBox.querySelector('ul');
                list.textContent = '';
                this._workspace.errors.forEach(function (error) {
                    var item = document.createElement('li');
                    item.textContent = error;
                    list.appendChild(item);
                });
                if (this._workspace.errors.length == 0) {
                    errorBox.setAttribute('hidden', 'true');
                } else {
                    errorBox.removeAttribute('hidden');
                }
            }
        },

        _initTabs: {
            value: function() {
                this._tabsContainer = $(this._appContainer.querySelector('#tabs-container'));
                this._tabHeadersList = $(this._appContainer.querySelector('#tabs-list'));

                this._tabs = [];
                var tab2D = this._addTab(TabController2D, this._workspace, this._views);
                this._tabs.push(tab2D);
                var tab3D = this._addTab(TabController3D, this._workspace, this._views);
                this._tabs.push(tab3D);
                this._tabs.push(this._addTab(TabControllerMapping, this._workspace, this._views));
                var tabExamples = this._addTab(TabControllerExamples, this._workspace, this._views);
                this._tabs.push(tabExamples);

                tabExamples.activate();

                this._workspace.addEventListener(Workspace.Events.MODE_CHANGE, function () {
                    if (this._workspace.mode === Workspace.Mode.MODE_2D) {
                        tab2D.activate();
                    } else if (this._workspace.mode === Workspace.Mode.MODE_3D) {
                        tab3D.activate();
                    }
                }.bind(this));
            }
        },

        _addTab: {
            value: function(viewConstructor, workspace, views) {
                // nothing but a temporary id
                var id = (Math.round(1000000 * Math.random())).toString();

                var tab = this._tabsContainer.append('<div class="emperor-tab-div tab-pane fade" id="' + id + '"></div>');

                // dynamically instantiate the controller, see:
                // http://stackoverflow.com/a/8843181
                var params = [null, '#' + id, workspace, views];
                var obj = new (Function.prototype.bind.apply(viewConstructor, params));

                // set the identifier of the div to the one defined by the object
                $('#' + id).attr('id', obj.identifier);

                // now add the list element linking to the container div with the proper
                // title
                this._tabHeadersList.append('<li><a data-toggle="tab" href="#'
                    + obj.identifier + '">' + obj.title + '</a></li>');

                return obj;
            }
        },

        _openFiles: {
            value: function(files) {
                var handlers = this._findFileHandlers(files);
                for (var i = 0; i < handlers.length; i++) {
                    handlers[i]();
                }
            }
        },

        _findFileHandlers: {
            value: function (files) {
                var result = [];
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];

                    if ((/\.png$/i.test(file.name))) {
                        result.push(this._workspace.loadImage.bind(this._workspace, file));
                    } else if (/\.stl$/i.test(file.name)) {
                        result.push(this._workspace.loadMesh.bind(this._workspace, file));
                    } else if (/\.csv$/i.test(file.name)) {
                        result.push(this._workspace.loadIntensities.bind(this._workspace, file));
                    }
                }
                return result;
            }
        }
    });

    return ili;
});
