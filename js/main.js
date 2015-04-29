/**
 * Main application page.
 */
'use strict';

// High level object. Could be easily accessed from Web Inspector.
var g_model;
var g_views;
var g_gui;
var g_mapSelector;

/*
 * On load initialization.
 */
function init() {
    g_model = new Model();
    g_views = new ViewContainer(g_model, $('#view-container')[0]);
    g_mapSelector = new MapSelector(g_model, $('#map-selector')[0], $('#current-map-name')[0]);

    initGUI();

    g_model.addEventListener('status-change', onModelStatusChange);

    document.addEventListener('keydown', onKeyDown, false);

    $('#open-button').click(chooseFilesToOpen);
    $('#current-map-label').click(function() {g_mapSelector.activate();});
    $('#view-container').mousedown(function(event) {g_mapSelector.deactivate();});

    for (var e in DragAndDrop) {
        document.addEventListener(e, DragAndDrop[e], true);
    }
}

var KEYBOARD_SHORTCUTS = {
    "U+004F": chooseFilesToOpen, // Ctrl + O
    "U+0046": function() { g_mapSelector.activate(); } // Ctrl + F
};

function onKeyDown(event) {
    if (event.ctrlKey && !event.altKey && event.keyIdentifier in KEYBOARD_SHORTCUTS) {
        var handler = KEYBOARD_SHORTCUTS[event.keyIdentifier];
        handler();
        event.stopPropagation();
        event.preventDefault();
    }
}

function onModelStatusChange() {
    if (g_model.status) {
        $('#status').text(g_model.status);
        $('#status').prop('hidden', false);
    } else {
        $('#status').prop('hidden', true);
    }
}

/*
 * Initializing DAT.GUI (http://workshop.chromeexperiments.com/examples/gui) controls.
 */
function initGUI() {
    g_gui = new dat.GUI();

    var f3d = g_gui.addFolder('3D');
    f3d.add(g_views.g3d, 'layout', {
        'Single view': ViewGroup3D.Layout.SINGLE,
        'Double view': ViewGroup3D.Layout.DOUBLE,
        'Triple view': ViewGroup3D.Layout.TRIPLE,
        'Quadriple view': ViewGroup3D.Layout.QUADRIPLE,
    }).name('Layout');
    f3d.addColor(g_model, 'color').name('Color');
    f3d.addColor(g_model, 'backgroundColor').name('Background');
    f3d.add(g_model, 'lightIntensity1', 0, 1).name('Light 1');
    f3d.add(g_model, 'lightIntensity2', 0, 1).name('Light 2');
    f3d.add(g_model, 'lightIntensity3', 0, 1).name('Light 3');

    var fMapping = g_gui.addFolder('Mapping');
    fMapping.add(g_model, 'scaleId', {'Linear': Model.Scale.LINEAR.id, 'Logarithmic': Model.Scale.LOG.id}).name('Scale');
    fMapping.add(g_model, 'hotspotQuantile').name('Hotspot quantile').step(0.0001);
    fMapping.add(g_model, 'spotBorder', 0, 1).name('Spot border').step(0.01);
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
            result.push(g_model.loadImage.bind(g_model, file));
        } else if (/\.stl$/i.test(file.name)) {
            result.push(g_model.loadMesh.bind(g_model, file));
        } else if (/\.csv$/i.test(file.name)) {
            result.push(g_model.loadIntensities.bind(g_model, file));
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