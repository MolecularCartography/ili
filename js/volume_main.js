/**
 * Main application page.
 */
'use strict';

define([
        'volumeworkspace', 'volumeviewcontainer', 'volumeviewgroup3d', 'mapselector', 'colormaps', 'filesaver', 'utils',
        'dragndrop', 'mainlayout', 'jquery', 'jqueryui', 'volumesettingscontroller', 'volumespotscontroller'
    ],
    function (VolumeWorkspace, VolumeViewContainer, VolumeViewGroup3D,
              MapSelector, ColorMap, saveAs, Utils,
              DragAndDrop, appLayout, $, $ui, VolumeSettingsController,
              VolumeSpotsController)
    {

        function ili(appContainer) {
            if (!webglEnabled()) {
                alert('WebGL technology is not enabled in your browser. Turn it on to get `ili functioning properly.');
            }
            this._appContainer = document.createElement('div');
            this._appContainer.id = 'ili-container';
            this._appContainer.innerHTML = appLayout;
            appContainer.appendChild(this._appContainer);
            this._volumeSpotsController = new VolumeSpotsController();

            this._volumeWorkspace = new VolumeWorkspace(this._volumeSpotsController);
            this._views = new VolumeViewContainer(this._volumeWorkspace, this._appContainer.querySelector('#view-container'));

            this._settingsController = new VolumeSettingsController(this._appContainer, this._volumeWorkspace, this._views);
            this._volumeWorkspace.addEventListener(VolumeWorkspace.Events.STATUS_CHANGE, this._onVolumeWorkspaceStatusChange.bind(this));

            this._initKeyboardShortcuts();

            this._appContainer.querySelector('#controls-switcher').onclick = this._toggleControls.bind(this);
            this._appContainer.querySelector('#open-button').onclick = this.chooseFilesToOpen.bind(this);

            window.addEventListener('resize', function () {
                this.resize.call(this, window.innerWidth, window.innerHeight);
            }.bind(this));

            this._dnd = new DragAndDrop(this._appContainer, this._volumeWorkspace.loadFiles.bind(this._volumeWorkspace));

            this._controlsVisible = true;
            this._processAddressLine();
        }

        ili.prototype = Object.create(null, {
            chooseFilesToOpen: {
                value: function() {
                    var fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.multiple = true;
                    fileInput.addEventListener('change', function () {
                        this._volumeWorkspace.loadFiles(
                            // handle files in the same way as drag and drop
                            Array.from(fileInput.files).map(function (file) {
                                return new Utils.File(file, file.name);
                            })
                        );
                    }.bind(this));
                    fileInput.click();
                }
            },

            takeSnapshot: {
                value: function() {
                    var name = this._volumeSpotsController.mapName || 'image';
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
                    if (this._volumeWorkspace.mode == VolumeWorkspace.Mode.MODE_2D) {
                        this._view.v2d._renderSpots();
                    } else if (this._volumeWorkspace.mode == VolumeWorkspace.Mode.MODE_3D) {
                        this._views.g3d.requestAnimationFrame();
                    }
                }
            },

            saveSettings: {
                value: function () {
                    var name = this._volumeSpotsController.mapName || 'ili_settings';
                    saveAs(this._settingsController.serialize(), name + '.json');
                }
            },


            /* Property used to show/hide the sidebar
             */
            controlsVisible: {
                get: function() {
                    return this._controlsVisible;
                },
                set: function (visible) {
                    visible = !!visible;
                    if (visible !== this._controlsVisible) {
                        var controlsSwitcher = this._appContainer.querySelector('#controls-switcher');
                        controlsSwitcher.click();
                        controlsSwitcher.style.visibility = visible ? 'visible' : 'hidden';
                        this._controlsVisible = visible;
                    }
                }
            },

            /* @opacity should be an object { spot_name: opacity_value }
             *
             * opacity_value should be a number from the interval of [0; 1]
             */
            spotOpacity: {
                get: function() {
                    return this._volumeSpotsController.spotOpacity;
                },
                set: function (opacity) {
                    this._volumeSpotsController.spotOpacity = opacity;
                }
            },

            /* @opacity should be a number from the interval of [0; 1]
             */
            globalSpotOpacity: {
                get: function () {
                    return this._volumeSpotsController.globalSpotOpacity;
                },
                set: function (opacity) {
                    this._volumeSpotsController.globalSpotOpacity = opacity;
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
                    return this._volumeSpotsController.spotColors;
                },
                set: function (colors) {
                    this._volumeSpotsController.spotColors = colors;
                }
            },

            /* @scale should be an object { spot_name: scale_value }
             *
             * scale_value should be a non-negative number
             */
            spotScale: {
                get: function() {
                    return this._volumeSpotsController.spotScale;
                },
                set: function (scale) {
                    this._volumeSpotsController.spotScale = scale;
                }
            },

            /* @scale should be a non-negative number
             */
            globalSpotScale: {
                get: function () {
                    return this._volumeSpotsController.globalSpotScale;
                },
                set: function (scale) {
                    this._volumeSpotsController.globalSpotScale = scale;
                }
            },

            _initKeyboardShortcuts: {
                value: function() {
                    this._keyboardShortcuts = {
                        /*'38': function() { // ArrowUp
                            this._mapSelector.blink();
                            this._mapSelector.navigate(MapSelector.Direction.UP);
                        },
                        '40': function() { // ArrowDown
                            this._mapSelector.blink();
                            this._mapSelector.navigate(MapSelector.Direction.DOWN);
                        }*/
                    };
                    this._keyboardShortcuts[Utils.isWebkit ? '79' : '111'] = this.chooseFilesToOpen; // Ctrl + O
                    // this._keyboardShortcuts[Utils.isWebkit ? '70' : '102'] = function() { this._mapSelector.activate(); }; // Ctrl + F
                    // this._keyboardShortcuts[Utils.isWebkit ? '83' : '115'] = this.takeSnapshot; // Ctrl + S
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

            _clickControlSwitch: {
                value: function() {
                    var controlsSwitcher = this._appContainer.querySelector('#controls-switcher');
                    controlsSwitcher.click();
                }
            },

            _processAddressLine: {
                value: function() {
                    if (window.location.search) {
                        this._clickControlSwitch();
                        var fileNames = window.location.search.substr(1).split(';');
                        this._volumeWorkspace.download(fileNames);
                    }
                }
            },

            _onVolumeWorkspaceStatusChange: {
                value: function() {
                    var statusContainer = this._appContainer.querySelector('#status');
                    if (this._volumeWorkspace.status) {
                        var textField = statusContainer.querySelector('span');
                        textField.innerHTML = this._volumeWorkspace.status;
                        statusContainer.style.visibility = 'visible';
                    } else {
                        statusContainer.style.visibility = 'hidden';
                    }
                }
            },

            _onVolumeWorkspaceErrorsChange: {
                value: function () {
                    var errorBox = this._appContainer.querySelector('div#errors');
                    var list = errorBox.querySelector('ul');
                    list.textContent = '';
                    this._volumeWorkspace.errors.forEach(function (error) {
                        var item = document.createElement('li');
                        item.textContent = error;
                        list.appendChild(item);
                    });
                    if (this._volumeWorkspace.errors.length == 0) {
                        errorBox.setAttribute('hidden', 'true');
                    } else {
                        errorBox.removeAttribute('hidden');
                    }
                }
            },

            _toggleControls: {
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
        });

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
        return ili;});
