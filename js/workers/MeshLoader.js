/**
 * Web Worker. Loads a mesh from STL file.
 */

'use strict';

importScripts('../lib/require.min.js');

require({
    'paths': {
        'utils': '../utils',
        'three': '../lib/three.min',
        'stlloader': '../lib/STLLoader',
        'objloader': '../lib/OBJLoader'
    }
}, [
    'utils', 'three', 'stlloader', 'objloader'
],
function (Utils, THREE, STLLoader, OBJLoader) {
    onmessage = function(e) {
        var file = e.data;
        try {
            var formatLoader = getFormatLoader(file.name.toLowerCase());
            var mesh = formatLoader(file);
        } catch (e) {
            console.info('Failure parsing mesh file', e);
            postMessage({
                status: 'failed',
                message: 'Can not parse mesh file. See log for details.',
            });
            return;
        }

        // TODO: This only works with binary file format. Handle text format.
        var attributes = {
            geometry: {},
            materialName: null
        };
        if (mesh.materialName) {
            attributes.materialName = mesh.materialName;
        }
        for (var name in mesh.geometry.attributes) {
            attributes.geometry[name] = {
                array: mesh.geometry.attributes[name].array,
                itemSize: mesh.geometry.attributes[name].itemSize
            };
        }

        postMessage({
            status: 'completed',
            attributes: attributes,
        });
    }

    // it's assumed that a format loader has method `parse(fileContent)`
    var FormatLoaders = {
        STL: {
            extension: 'stl',
            handler: function (file) {
                var reader = new FileReaderSync();
                var contents = reader.readAsArrayBuffer(file);
                return {
                    geometry: new STLLoader().parse(contents),
                    materialName: null
                };
            }
        },
        OBJ: {
            extension: 'obj',
            handler: function (file) {
                var reader = new FileReaderSync();
                var contents = reader.readAsText(file);
                var meshes = new OBJLoader().parse(contents);
                if (meshes.children.length == 0) {
                    throw 'File "' + file.name + '" contains no meshes.';
                } else if (meshes.children.length > 1) {
                    console.info('File "' + file.name + '" contains ' + meshes.children.length.toString()
                        + 'meshes. Only one of them will be loaded');
                }
                var lastMesh = meshes.children[0];
                return {
                    geometry: lastMesh.geometry,
                    materialName: lastMesh.material.name
                }
            }
        }
    };

    function getFormatLoader(fileUrl) {
        var extension = Utils.getFileExtension(fileUrl);
        var matchedFileHandler = null;
        for (var formatTag in FormatLoaders) {
            if (FormatLoaders[formatTag].extension === extension) {
                matchedFileHandler = FormatLoaders[formatTag].handler;
                break;
            }
        }

        if (!matchedFileHandler) {
            throw 'Input files have unexpected extensions.'
        } else {
            return matchedFileHandler;
        }
    }

    postMessage({
        status: 'ready'
    });
});
