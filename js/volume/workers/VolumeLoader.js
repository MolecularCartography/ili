/**
 * Web Worker. Loads a mesh from STL file.
 */

'use strict';

importScripts('../../lib/require.min.js');

require({
    'paths': {
        'utils': '../../common/utility/utils',
        'three': '../../lib/three.min',
        'nrrdloader': '../../lib/NRRDLoader',
        'gunzip': '../../lib/gunzip.min',
        'volume': '../../lib/volume',
        'bounds': '../../common/utility/bounds'
    }
}, [
    'utils', 'three', 'nrrdloader', 'bounds'
],
function (Utils, THREE, NRRDLoader, Bounds) {
    onmessage = function(e) {
        var file = e.data;
        try {
            var formatLoader = getFormatLoader(file.name.toLowerCase());
            var mesh = formatLoader(file);
        } catch (e) {
            console.info('Failure parsing volume file', e);
            postMessage({
                status: 'failed',
                message: 'Can not parse volume file. See log for details.',
            });
            return;
        }

        var resultMesh = {};
        resultMesh.xLength = mesh.xLength;
        resultMesh.yLength = mesh.yLength;
        resultMesh.zLength = mesh.zLength;
        resultMesh.valueBounds = new Bounds(mesh.min, mesh.max);
        resultMesh.data = Float32Array.from(mesh.data); // TODO:

        postMessage({
            shape: resultMesh,
            status: 'completed'
        });
    }

    // it's assumed that a format loader has method `parse(fileContent)`
    var FormatLoaders = {
        NRRD: {
            extension: 'nrrd',
            handler: function (file) {
                var reader = new FileReaderSync();
                var contents = reader.readAsArrayBuffer(file.data);
                var loader = new NRRDLoader();
                return loader.parse(contents);
            }
        },
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
