/**
 * Main application page.
 */
'use strict';

define([
    'workspace', 'viewcontainer', 'viewgroup3d', 'mapselector', 'examples', 'datgui', 'colormaps', 'filesaver', 'utils', 'text!../template.html'
],
function(Workspace, ViewContainer, ViewGroup3D, MapSelector, Examples, dat, ColorMap, saveAs, Utils, appLayout) {
    function init(appContainer) {
        appContainer.innerHTML = appLayout;

        var workspace = new Workspace();
        var views = new ViewContainer(workspace, appContainer.querySelector('#view-container'));
        var mapSelector = new MapSelector(workspace, appContainer.querySelector('#map-selector'), appContainer.querySelector('#current-map-label'));

        var dashboard = initDashboard(appContainer, workspace, views);
        var examples = new Examples(appContainer, workspace, dashboard);

        workspace.addEventListener(Workspace.Events.STATUS_CHANGE,
                                     onWorkspaceStatusChange.bind(null, appContainer, workspace));
        workspace.addEventListener(Workspace.Events.ERRORS_CHANGE,
                                     onWorkspaceErrorsChange.bind(null, appContainer, workspace));

        initKeyboardShortcuts(appContainer, workspace, views, mapSelector);

        appContainer.querySelector('#open-button').onclick = chooseFilesToOpen.bind(null, workspace);
        appContainer.querySelector('#current-map-label').onclick = function() {mapSelector.activate();};
        appContainer.querySelector('#view-container').onmousedown = function(event) {mapSelector.deactivate();};
        appContainer.querySelector('div#errors #close').onclick = clearErrors.bind(null, workspace);

        DragAndDrop._workspace = workspace;
        DragAndDrop._appContainer = appContainer;
        for (var e in DragAndDrop) {
            var fn = DragAndDrop[e];
            if (typeof fn != 'function') continue;
            appContainer.addEventListener(e, DragAndDrop[e], true);
        }

        if (window.location.search) {
            var fileNames = window.location.search.substr(1).split(';');
            workspace.download(fileNames);
        }
    }

    var KEYBOARD_SHORTCUTS = {
        '38': function(mapSelector) { // ArrowUp
            mapSelector.blink();
            mapSelector.navigate(MapSelector.Direction.UP);
        },
        '40': function(mapSelector) { // ArrowDown
            mapSelector.blink();
            mapSelector.navigate(MapSelector.Direction.DOWN);
        }
    };

    function initKeyboardShortcuts(appContainer, workspace, views, mapSelector) {
        KEYBOARD_SHORTCUTS[Utils.isWebkit ? '79' : '111'] = chooseFilesToOpen.bind(null, workspace); // Ctrl + O
        KEYBOARD_SHORTCUTS[Utils.isWebkit ? '70' : '102'] = mapSelector.activate.bind(mapSelector); // Ctrl + F
        KEYBOARD_SHORTCUTS[Utils.isWebkit ? '83' : '115'] = takeSnapshot.bind(null, workspace, views); // Ctrl + S

        KEYBOARD_SHORTCUTS['38'] = KEYBOARD_SHORTCUTS['38'].bind(null, mapSelector);
        KEYBOARD_SHORTCUTS['40'] = KEYBOARD_SHORTCUTS['40'].bind(null, mapSelector);

        document.addEventListener(Utils.keyPressEvent(), onKeyPress, false);
    }

    function takeSnapshot(workspace, views) {
        var name = workspace.mapName || 'image';
        views.export().then(function(blob) {
            saveAs(blob, name + '.png', 'image/png');
        });
    }

    function onKeyPress(event) {
        if ((/^Mac/i).test(navigator.platform)) {
            if (event.ctrlKey || event.altKey || !event.metaKey) return;
        } else {
            if (!event.ctrlKey || event.altKey || event.metaKey) return;
        }

        var key = (event.which ? event.which : event.keyCode).toString();
        if (key in KEYBOARD_SHORTCUTS) {
            event.preventDefault();
            var handler = KEYBOARD_SHORTCUTS[key];
            handler();
            return false;
        }
    }

    function onWorkspaceStatusChange(appContainer, workspace) {
        var statusContainer = appContainer.querySelector('#status');
        if (workspace.status) {
            statusContainer.innerHTML = workspace.status;
            statusContainer.removeAttribute('hidden');
        } else {
            statusContainer.setAttribute('hidden', 'true');
        }
    }

    function onWorkspaceErrorsChange(appContainer, workspace) {
        var errorBox = appContainer.querySelector('div#errors');
        var list = errorBox.querySelector('ul');
        list.textContent = '';
        workspace.errors.forEach(function(error) {
            var item = document.createElement('li');
            item.textContent = error;
            list.appendChild(item);
        });
        if (workspace.errors.length == 0) {
            errorBox.setAttribute('hidden', 'true');
        } else {
            errorBox.removeAttribute('hidden');
        }
    }

    function clearErrors(workspace) {
        workspace.clearErrors();
    }

    /*
     * Initializing DAT.GUI (http://workshop.chromeexperiments.com/examples/gui) controls.
     */
    function initDashboard(appContainer, workspace, views) {
        var dashboard = new dat.GUI({autoPlace: false});

        var f2d = dashboard.addFolder('2D');
        f2d.add(workspace.scene2d, 'spotBorder', 0, 1).name('Spot border').step(0.01);

        var f3d = dashboard.addFolder('3D');
        f3d.add(views.g3d, 'layout', {
            'Single view': ViewGroup3D.Layout.SINGLE,
            'Double view': ViewGroup3D.Layout.DOUBLE,
            'Triple view': ViewGroup3D.Layout.TRIPLE,
            'Quadriple view': ViewGroup3D.Layout.QUADRIPLE,
        }).name('Layout');
        f3d.addColor(workspace.scene3d, 'color').name('Color');
        f3d.addColor(workspace.scene3d, 'backgroundColor').name('Background');
        f3d.add(workspace.scene3d.frontLight, 'intensity', 0, 3).name('Light');
        f3d.add(workspace.scene3d, 'spotBorder', 0, 1).name('Spot border').step(0.01);
        f3d.add(views, 'exportPixelRatio3d', [0.5, 1.0, 2.0, 4.0]).name('Export pixel ratio');
        var adjustment = f3d.addFolder('Adjustment');
        adjustment.add(workspace.scene3d.adjustment, 'alpha', -180.0, 180.0).name('0X rotation').step(1);
        adjustment.add(workspace.scene3d.adjustment, 'beta', -180.0, 180.0).name('0Y rotation').step(1);
        adjustment.add(workspace.scene3d.adjustment, 'gamma', -180.0, 180.0).name('0Z rotation').step(1);
        adjustment.add(workspace.scene3d.adjustment, 'x').name('X offset').step(0.1);
        adjustment.add(workspace.scene3d.adjustment, 'y').name('Y offset').step(0.1);
        adjustment.add(workspace.scene3d.adjustment, 'z').name('Z offset').step(0.1);

        var fMapping = dashboard.addFolder('Mapping');
        fMapping.add(workspace, 'scaleId', {'Linear': Workspace.Scale.LINEAR.id, 'Logarithmic': Workspace.Scale.LOG.id}).name('Scale');
        fMapping.add(workspace, 'hotspotQuantile').name('Hotspot quantile').step(0.0001);
        var colorMaps = Object.keys(ColorMap.Maps).reduce(function(m, k) {
            m[ColorMap.Maps[k].name] = k;
            return m;
        }, {});
        fMapping.add(workspace, 'colorMapId', colorMaps).name('Color map');

        var mapping = {
            flag: fMapping.add(workspace, 'autoMinMax').name('Auto MinMax'),
            min: fMapping.add(workspace, 'minValue').name('Min value').step(0.00001),
            max: fMapping.add(workspace, 'maxValue').name('Max value').step(0.00001),
        };
        workspace.addEventListener(Workspace.Events.AUTO_MAPPING_CHANGE,
                                     onAutoMappingChange.bind(null, workspace, mapping));
        onAutoMappingChange(workspace, mapping);

        workspace.addEventListener(Workspace.Events.MODE_CHANGE, function() {
            f2d.closed = (workspace.mode != Workspace.Mode.MODE_2D);
            f3d.closed = (workspace.mode != Workspace.Mode.MODE_3D);
        });
        appContainer.querySelector('#controls-container').appendChild(dashboard.domElement);
        return dashboard;
    }

    function onAutoMappingChange(workspace, mapping) {
        var disabled = workspace.autoMinMax;

        if (disabled) {
            mapping.min.domElement.querySelector('input').setAttribute('disabled', '');
            mapping.max.domElement.querySelector('input').setAttribute('disabled', '');
        } else {
            mapping.min.domElement.querySelector('input').removeAttribute('disabled');
            mapping.max.domElement.querySelector('input').removeAttribute('disabled');
        }

        if (workspace.autoMinMax) {
            mapping.min.updateDisplay();
            mapping.max.updateDisplay();
        }
    }

    /**
     * Implementation of dropping files via system's D&D.'
     */
    var DragAndDrop = {
        _counter: 0,
        _workspace: null,
        _appContainer: null,

        dragenter: function(e) {
            e.preventDefault();
            if (++DragAndDrop._counter == 1)
                DragAndDrop._appContainer.setAttribute('drop-target', '');
        },

        dragleave: function(e) {
            e.preventDefault();
            if (--DragAndDrop._counter === 0)
                DragAndDrop._appContainer.removeAttribute('drop-target');
        },

        dragover: function(e) {
            e.preventDefault();
        },

        drop: function(e) {
            DragAndDrop._counter = 0;
            DragAndDrop._appContainer.removeAttribute('drop-target');

            e.preventDefault();
            e.stopPropagation();

            openFiles(DragAndDrop._workspace, e.dataTransfer.files);
        }
    };

    function openFiles(workspace, files) {
        var handlers = findFileHandlers(workspace, files);
        for (var i = 0; i < handlers.length; i++) {
            handlers[i]();
        }
    };

    function findFileHandlers(workspace, files) {
        var result = [];
        for (var i = 0; i < files.length; i++) {
            var file = files[i];

            if ((/\.png$/i.test(file.name))) {
                result.push(workspace.loadImage.bind(workspace, file));
            } else if (/\.stl$/i.test(file.name)) {
                result.push(workspace.loadMesh.bind(workspace, file));
            } else if (/\.csv$/i.test(file.name)) {
                result.push(workspace.loadIntensities.bind(workspace, file));
            }
        }
        return result;
    }

    /**
     * Shows file open dialog.
     */
    function chooseFilesToOpen(workspace) {
        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.addEventListener('change', function() {
            openFiles(workspace, fileInput.files);
        });
        fileInput.click();
    }

    return init;
});
