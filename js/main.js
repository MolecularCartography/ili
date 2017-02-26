/**
 * Main application page.
 */
'use strict';

define([
    'workspace', 'viewcontainer', 'viewgroup3d', 'mapselector', 'colormaps', 'filesaver', 'utils',
    'dragndrop', 'text!../template.html', 'jquery', 'jqueryui', 'appsettingscontroller'
],
function (Workspace, ViewContainer, ViewGroup3D, MapSelector, ColorMap, saveAs, Utils,
    DragAndDrop, appLayout, $, $ui, AppSettingsController)
{
    // Copied from https://github.com/miguelmota/webgl-detect
    function webglEnabled() {
        var canvas = document.createElement('canvas');
        var contextNames = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'];
        var context;

        if (navigator.userAgent.indexOf('MSIE') > -1) {
            try {
                context = WebGLHelper.CreateGLContext(canvas, 'canvas');
            } catch (e) { }
        } else {
            for (var i = 0; i < contextNames.length; i++) {
                try {
                    context = canvas.getContext(contextNames[i]);
                    if (context) {
                        break;
                    }
                } catch (e) { }
            }
        }
        return !!context;
    }

    function ili(appContainer) {
        if (!webglEnabled()) {
            alert('WebGL technology is not enabled in your browser. Please, turn it on to get `ili functioning properly.');
        }

        this._appContainer = appContainer;
        this._appContainer.innerHTML = appLayout;

        this._workspace = new Workspace();
        this._views = new ViewContainer(this._workspace, this._appContainer.querySelector('#view-container'));
        this._mapSelector = new MapSelector(this._workspace, this._appContainer.querySelector('#map-selector'),
            this._appContainer.querySelector('#current-map-label'));
        this._settingsController = new AppSettingsController(this._appContainer, this._workspace, this._views);

        this._workspace.addEventListener(Workspace.Events.STATUS_CHANGE, this._onWorkspaceStatusChange.bind(this));
        this._workspace.addEventListener(Workspace.Events.ERRORS_CHANGE, this._onWorkspaceErrorsChange.bind(this));

        this._initKeyboardShortcuts(this._workspace, this._views, this._mapSelector);

        this._appContainer.querySelector('#controls-switcher').onclick = this._toggleControlsPanel.bind(this);
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

        saveSettings: {
            value: function () {
                var name = this._workspace.mapName || 'ili_settings';
                saveAs(this._settingsController.serialize(), name + '.json');
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
                this._keyboardShortcuts[Utils.isWebkit ? '69' : '101'] = this.saveSettings; // Ctrl + E

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

        _toggleControlsPanel: {
            value: function () {
                // timeout is used because a blank vertical stripe remains from a scrollbar of the sidebar,
                // which gets updated asynchronously, it seems
                window.setTimeout(function () {
                    // update rendering area width
                    var renderingArea = $(this._appContainer.querySelector('#rendering-area'));
                    renderingArea.toggleClass('col-xs-8');
                    renderingArea.toggleClass('col-xs-12');
                    // change toggle button icon
                    var sideBarSwitcher = $(this._appContainer.querySelector('#controls-switcher .glyphicon'));
                    sideBarSwitcher.toggleClass('glyphicon-chevron-right');
                    sideBarSwitcher.toggleClass('glyphicon-chevron-left');
                    // redraw the scene
                    this._views.updateLayout();
                }.bind(this));
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
                var unrecognizedFiles = [];
                var settingsFile = null;
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    var filenameLowecased = file.name.toLowerCase();
                    if (filenameLowecased.endsWith('.png') || filenameLowecased.endsWith('.jpeg')) {
                        result.push(this._workspace.loadImage.bind(this._workspace, file));
                    } else if (filenameLowecased.endsWith('.stl')) {
                        result.push(this._workspace.loadMesh.bind(this._workspace, file));
                    } else if (filenameLowecased.endsWith('.csv')) {
                        result.push(this._workspace.loadIntensities.bind(this._workspace, file));
                    } else if (filenameLowecased.endsWith('.json')) {
                        settingsFile = file;
                    } else {
                        unrecognizedFiles.push(file.name);
                    }
                }
                if (settingsFile !== null) {
                    result.push(this._workspace.loadSettings.bind(this._workspace, settingsFile));
                }

                if (unrecognizedFiles.length > 0) {
                    alert('Some files have not been recognized by `ili: ' + unrecognizedFiles.join(', '));
                }
                return result;
            }
        }
    });

    return ili;
});
