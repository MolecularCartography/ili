/**
 * Main application page.
 */
'use strict';

// High level object. Could be easily accessed from Web Inspector.
var g_workspace;
var g_views;
var g_gui;
var g_mapSelector;

/*
 * On load initialization.
 */
function init() {
    g_workspace = new Workspace();
    g_views = new ViewContainer(g_workspace, $('#view-container')[0]);
    g_mapSelector = new MapSelector(
            g_workspace,
            $('#map-selector')[0],
            $('#current-map-label')[0]);

    initGUI();

    g_workspace.addEventListener(Workspace.Events.STATUS_CHANGE,
                                 onWorkspaceStatusChange);
    g_workspace.addEventListener(Workspace.Events.ERRORS_CHANGE,
                                 onWorkspaceErrorsChange);

    document.addEventListener('keydown', onKeyDown, false);

    $('#open-button').click(chooseFilesToOpen);
    $('#current-map-label').click(function() {g_mapSelector.activate();});
    $('#view-container').mousedown(function(event) {g_mapSelector.deactivate();});
    $('dialog#errors #close').click(clearErrors);

    for (var e in DragAndDrop) {
        var fn = DragAndDrop[e];
        if (typeof fn != 'function') continue;
        document.addEventListener(e, DragAndDrop[e], true);
    }

    if (window.location.search) {
        var fileNames = window.location.search.substr(1).split(';');
        g_workspace.download(fileNames);
    }
}

var KEYBOARD_SHORTCUTS = {
    'U+004F': chooseFilesToOpen, // Ctrl + O
    'U+0046': function() { // Ctrl + F
        g_mapSelector.activate();
    },
    'U+0053': function() { // Ctrl + S
        var name = g_workspace.mapName || 'image';
        g_views.export().then(function(blob) {
            saveAs(blob, name + '.png');
        });
    },
    'Up': function() {
        g_mapSelector.blink();
        g_mapSelector.navigate(MapSelector.Direction.UP);
    },
    'Down': function() {
        g_mapSelector.blink();
        g_mapSelector.navigate(MapSelector.Direction.DOWN);
    },
};

function onKeyDown(event) {
    if ((/^Mac/i).test(navigator.platform)) {
        if (event.ctrlKey || event.altKey || !event.metaKey) return;
    } else {
        if (!event.ctrlKey || event.altKey || event.metaKey) return;
    }

    if (event.keyIdentifier in KEYBOARD_SHORTCUTS) {
        var handler = KEYBOARD_SHORTCUTS[event.keyIdentifier];
        handler();
        event.stopPropagation();
        event.preventDefault();
    }
}

function onWorkspaceStatusChange() {
    if (g_workspace.status) {
        $('#status').text(g_workspace.status);
        $('#status').prop('hidden', false);
    } else {
        $('#status').prop('hidden', true);
    }
}

function onWorkspaceErrorsChange() {
    var dialog = document.querySelector('dialog#errors');
    var list = dialog.querySelector('ul');
    list.textContent = '';
    g_workspace.errors.forEach(function(error) {
        var item = document.createElement('li');
        item.textContent = error;
        list.appendChild(item);
    });
    if (g_workspace.errors.length == 0) {
        dialog.close();
        dialog.hidden = true;
    } else {
        dialog.hidden = false;
        if (!dialog.open) dialog.showModal();
    }
}

function clearErrors() {
    g_workspace.clearErrors();
}

/*
 * Initializing DAT.GUI (http://workshop.chromeexperiments.com/examples/gui) controls.
 */
function initGUI() {
    g_gui = new dat.GUI();


    var f2d = g_gui.addFolder('2D');
    f2d.add(g_workspace.scene2d, 'spotBorder', 0, 1).name('Spot border').step(0.01);

    var f3d = g_gui.addFolder('3D');
    f3d.add(g_views.g3d, 'layout', {
        'Single view': ViewGroup3D.Layout.SINGLE,
        'Double view': ViewGroup3D.Layout.DOUBLE,
        'Triple view': ViewGroup3D.Layout.TRIPLE,
        'Quadriple view': ViewGroup3D.Layout.QUADRIPLE,
    }).name('Layout');
    f3d.addColor(g_workspace.scene3d, 'color').name('Color');
    f3d.addColor(g_workspace.scene3d, 'backgroundColor').name('Background');
    f3d.add(g_workspace.scene3d.light1, 'intensity', 0, 1).name('Light 1');
    f3d.add(g_workspace.scene3d.light2, 'intensity', 0, 1).name('Light 2');
    f3d.add(g_workspace.scene3d.light3, 'intensity', 0, 1).name('Light 3');
    f3d.add(g_workspace.scene3d, 'spotBorder', 0, 1).name('Spot border').step(0.01);
    f3d.add(g_views, 'exportPixelRatio3d', [0.5, 1.0, 2.0, 4.0]).name('Export pixel ratio');
    var adjustment = f3d.addFolder('Adjustment');
    adjustment.add(g_workspace.scene3d.adjustment, 'alpha', -180.0, 180.0).name('0X rotation').step(1);
    adjustment.add(g_workspace.scene3d.adjustment, 'beta', -180.0, 180.0).name('0Y rotation').step(1);
    adjustment.add(g_workspace.scene3d.adjustment, 'gamma', -180.0, 180.0).name('0Z rotation').step(1);
    adjustment.add(g_workspace.scene3d.adjustment, 'x').name('X offset').step(0.1);
    adjustment.add(g_workspace.scene3d.adjustment, 'y').name('Y offset').step(0.1);
    adjustment.add(g_workspace.scene3d.adjustment, 'z').name('Z offset').step(0.1);

    var fMapping = g_gui.addFolder('Mapping');
    fMapping.add(g_workspace, 'scaleId', {'Linear': Workspace.Scale.LINEAR.id, 'Logarithmic': Workspace.Scale.LOG.id}).name('Scale');
    fMapping.add(g_workspace, 'hotspotQuantile').name('Hotspot quantile').step(0.0001);
    var colorMaps = Object.keys(ColorMap.Maps).reduce(function(m, k) {
        m[ColorMap.Maps[k].name] = k;
        return m;
    }, {});
    fMapping.add(g_workspace, 'colorMapId', colorMaps).name('Color map');

    var mapping = {
        flag: fMapping.add(g_workspace, 'autoMinMax').name('Auto MinMax'),
        min: fMapping.add(g_workspace, 'minValue').name('Min value').step(0.00001),
        max: fMapping.add(g_workspace, 'maxValue').name('Max value').step(0.00001),
    };
    g_workspace.addEventListener(Workspace.Events.AUTO_MAPPING_CHANGE,
                                 onAutoMappingChange.bind(null, mapping));
    onAutoMappingChange(mapping);

    g_workspace.addEventListener(Workspace.Events.MODE_CHANGE, function() {
        f2d.closed = (g_workspace.mode != Workspace.Mode.MODE_2D);
        f3d.closed = (g_workspace.mode != Workspace.Mode.MODE_3D);
    });
}

function onAutoMappingChange(mapping) {
    var disabled = g_workspace.autoMinMax ? '' : null;
    $(mapping.min.domElement).find('input').attr('disabled', disabled);
    $(mapping.max.domElement).find('input').attr('disabled', disabled);
    if (g_workspace.autoMinMax) {
        mapping.min.updateDisplay();
        mapping.max.updateDisplay();
    }
}

/**
 * Implementation of dropping files via system's D&D.'
 */
var DragAndDrop = {
    _counter: 0,

    dragenter: function(e) {
        e.preventDefault();
        if (++DragAndDrop._counter == 1)
            $('body').attr('drop-target', '');
    },

    dragleave: function(e) {
        e.preventDefault();
        if (--DragAndDrop._counter === 0)
            $('body').removeAttr('drop-target');
    },

    dragover: function(e) {
        e.preventDefault();
    },

    drop: function(e) {
        DragAndDrop._counter = 0;
        $('body').removeAttr('drop-target');

        e.preventDefault();
        e.stopPropagation();

        openFiles(e.dataTransfer.files);
    }
};

function openFiles(files) {
    var handlers = findFileHandlers(files);
    for (var i = 0; i < handlers.length; i++) {
        handlers[i]();
    }
};

function findFileHandlers(files) {
    var result = [];
    for (var i = 0; i < files.length; i++) {
        var file = files[i];

        if ((/\.png$/i.test(file.name))) {
            result.push(g_workspace.loadImage.bind(g_workspace, file));
        } else if (/\.stl$/i.test(file.name)) {
            result.push(g_workspace.loadMesh.bind(g_workspace, file));
        } else if (/\.csv$/i.test(file.name)) {
            result.push(g_workspace.loadIntensities.bind(g_workspace, file));
        }
    }
    return result;
}

/**
 * Shows file open dialog.
 */
function chooseFilesToOpen() {
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.addEventListener('change', function() {
        openFiles(fileInput.files);
    });
    fileInput.click();
}

$(init);
