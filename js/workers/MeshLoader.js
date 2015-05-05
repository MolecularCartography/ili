/**
 * Web Worker. Loads a mesh from STL file.
 */

importScripts('../lib/three.min.js', '../lib/STLLoader.js');

onmessage = function(e) {
    var blob = e.data;
    var reader = new FileReader();
    reader.onload = function(event) {
        readContents(event.target.result);
    };
    reader.onerror = console.error.bind(console);
    reader.readAsArrayBuffer(blob);
};

function readContents(contents) {
    try {
        var geometry = new THREE.STLLoader().parse(contents);
    } catch (e) {
        console.info('Failure parsing STL file', e);
        postMessage({
                status: 'failed',
                message: 'Can not parse STL file. See log for details.',
        });
    }
    geometry.addAttribute('original-position', cloneBufferAttribute(geometry.getAttribute('position')));
    geometry.center();

    // TODO: This only works with binary file format. Handle text format.
    var attributes = {};
    for (var name in geometry.attributes) {
        attributes[name] = {
            array: geometry.attributes[name].array,
            itemSize: geometry.attributes[name].itemSize
        };
    }

    postMessage({
            status: 'completed',
            attributes: attributes,
    });
}

function cloneBufferAttribute(origin) {
    var array = new Float32Array(origin.array.length);
    array.set(origin.array);
    return new THREE.BufferAttribute(array, origin.itemSize);
}