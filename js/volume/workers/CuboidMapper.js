/**
 * Web Worker. Loads a mesh from STL file.
 */

'use strict';

importScripts('../../lib/require.min.js');

require({
    'paths': {
        'utils': '../../common/utility/utils',
        'three': '../../lib/three.min',
        'bounds': '../../common/utility/Bounds',
        'rawvolumedata': '../utility/RawVolumeData',
        'indexer1d': '../../common/utility/Indexer1D',
        'remappingprocessor': '../utility/VolumeRemappingProcessor'
    }
}, [
    'utils', 'three', 'bounds', 'rawvolumedata', 'indexer1d', 'remappingprocessor'
],
function (Utils, THREE, Bounds, RawVolumeData, Indexer1D, RemappingProcessor) {
    onmessage = function(e) {
        const data = e.data;

        const cuboids = data.cuboids;
        const sizedVolume = data.volume;
        const intensities = data.intensities;
        const cuboidsSizeScale = data.cuboidsSizeScale;

        const processor = new RemappingProcessor(
            sizedVolume.lengthX, sizedVolume.lengthY, sizedVolume.lengthZ,
            sizedVolume.sizeX, sizedVolume.sizeY, sizedVolume.sizeZ,
            cuboids, intensities, cuboidsSizeScale, {
                setup: function(count) {
                    postMessage({
                        status: 'working',
                        message: `Count of operations: ${count}`
                    });
                },

                notify: function(progress, total) {
                    postMessage({
                        status: 'working',
                        message: `Performing cuboid remapping - ${progress} operation of ${total}`
                    });
                },

                finished: function() { 
                    postMessage({
                        data: processor._volume,
                        status: 'completed'
                    });
                }
            }
        );
        processor.calculate();
    }

    postMessage({
        status: 'ready'
    });
});
