/**
 * Web Worker. Loads a volume from a set of formats.
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
        'rawvolume': '../utility/RawVolumeData',
        'bounds': '../../common/utility/bounds'
    }
}, [
    'utils', 'three', 'nrrdloader', 'rawvolume', 'bounds'
],
function (Utils, THREE, NRRDLoader, RawVolume, Bounds) {
    onmessage = function(e) {
        var file = e.data;
        try {
            postMessage({
                status: 'working',
                message: 'Decoding the volume shape file.',
            });
            var formatLoader = getFormatLoader(file.name.toLowerCase());
            var volume = formatLoader(file);
        } catch (e) {
            console.info('Failure parsing volume file', e);
            postMessage({
                status: 'failed',
                message: 'Can not parse volume file. See log for details.',
            });
            return;
        }
        postMessage({
            shape: volume,
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
                const mesh = loader.parse(contents);

                return new RawVolume.SizedRawVolumeData(
                    Float32Array.from(mesh.data),
                    mesh.xLength, mesh.yLength, mesh.zLength,
                    mesh.xLength, mesh.yLength, mesh.zLength,
                    new Bounds(mesh.min, mesh.max)
                );
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
            throw 'Input files have unexpected extensions.';
        } else {
            return matchedFileHandler;
        }
    }

    postMessage({
        status: 'ready'
    });
});
