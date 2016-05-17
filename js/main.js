/**
 * Main application page.
 */
'use strict';

define([
    'workspace', 'viewcontainer', 'viewgroup3d', 'mapselector', 'examples', 'datgui', 'colormaps', 'filesaver', 'utils', 'dragndrop', 'text!../template.html'
],
function(Workspace, ViewContainer, ViewGroup3D, MapSelector, Examples, dat, ColorMap, saveAs, Utils, DragAndDrop, appLayout) {
    function ili(appContainer) {
        this._appContainer = appContainer;
        this._appContainer.innerHTML = appLayout;

        this._workspace = new Workspace();
        this._views = new ViewContainer(this._workspace, this._appContainer.querySelector('#view-container'));
        this._mapSelector = new MapSelector(this._workspace, this._appContainer.querySelector('#map-selector'), this._appContainer.querySelector('#current-map-label'));

        this._initDashboard();
        this._examples = new Examples(this._appContainer, this._workspace, this._dashboard);

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

        _initDashboard: {
            value: function() {
                this._dashboard = new dat.GUI({autoPlace: false});

                var f2d = this._dashboard.addFolder('2D');
                f2d.add(this._workspace.scene2d, 'spotBorder', 0, 1).name('Spot border').step(0.01);

                var f3d = this._dashboard.addFolder('3D');
                f3d.add(this._views.g3d, 'layout', {
                    'Single view': ViewGroup3D.Layout.SINGLE,
                    'Double view': ViewGroup3D.Layout.DOUBLE,
                    'Triple view': ViewGroup3D.Layout.TRIPLE,
                    'Quadriple view': ViewGroup3D.Layout.QUADRIPLE
                }).name('Layout');
                f3d.addColor(this._workspace.scene3d, 'color').name('Color');
                f3d.addColor(this._workspace.scene3d, 'backgroundColor').name('Background');
                f3d.add(this._workspace.scene3d.frontLight, 'intensity', 0, 3).name('Light');
                f3d.add(this._workspace.scene3d, 'spotBorder', 0, 1).name('Spot border').step(0.01);
                f3d.add(this._views, 'exportPixelRatio3d', [0.5, 1.0, 2.0, 4.0]).name('Export pixel ratio');
                var adjustment = f3d.addFolder('Adjustment');
                adjustment.add(this._workspace.scene3d.adjustment, 'alpha', -180.0, 180.0).name('0X rotation').step(1);
                adjustment.add(this._workspace.scene3d.adjustment, 'beta', -180.0, 180.0).name('0Y rotation').step(1);
                adjustment.add(this._workspace.scene3d.adjustment, 'gamma', -180.0, 180.0).name('0Z rotation').step(1);
                adjustment.add(this._workspace.scene3d.adjustment, 'x').name('X offset').step(0.1);
                adjustment.add(this._workspace.scene3d.adjustment, 'y').name('Y offset').step(0.1);
                adjustment.add(this._workspace.scene3d.adjustment, 'z').name('Z offset').step(0.1);

                var fMapping = this._dashboard.addFolder('Mapping');
                fMapping.add(this._workspace, 'scaleId', {
                    'Linear': Workspace.Scale.LINEAR.id,
                    'Logarithmic': Workspace.Scale.LOG.id
                }).name('Scale');
                fMapping.add(this._workspace, 'hotspotQuantile').name('Hotspot quantile').step(0.0001);
                var colorMaps = Object.keys(ColorMap.Maps).reduce(function (m, k) {
                    m[ColorMap.Maps[k].name] = k;
                    return m;
                }, {});
                fMapping.add(this._workspace, 'colorMapId', colorMaps).name('Color map');

                var mapping = {
                    flag: fMapping.add(this._workspace, 'autoMinMax').name('Auto MinMax'),
                    min: fMapping.add(this._workspace, 'minValue').name('Min value').step(0.00001),
                    max: fMapping.add(this._workspace, 'maxValue').name('Max value').step(0.00001),
                };
                this._workspace.addEventListener(Workspace.Events.AUTO_MAPPING_CHANGE, this._onAutoMappingChange.bind(this, mapping));
                this._onAutoMappingChange(mapping);

                this._workspace.addEventListener(Workspace.Events.MODE_CHANGE, function() {
                    f2d.closed = (this._workspace.mode != Workspace.Mode.MODE_2D);
                    f3d.closed = (this._workspace.mode != Workspace.Mode.MODE_3D);
                }.bind(this));
                this._appContainer.querySelector('#controls-container').appendChild(this._dashboard.domElement);
            }
        },

        _onAutoMappingChange: {
            value: function(mapping) {
                var disabled = this._workspace.autoMinMax;

                if (disabled) {
                    mapping.min.domElement.querySelector('input').setAttribute('disabled', '');
                    mapping.max.domElement.querySelector('input').setAttribute('disabled', '');
                } else {
                    mapping.min.domElement.querySelector('input').removeAttribute('disabled');
                    mapping.max.domElement.querySelector('input').removeAttribute('disabled');
                }

                if (this._workspace.autoMinMax) {
                    mapping.min.updateDisplay();
                    mapping.max.updateDisplay();
                }
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
