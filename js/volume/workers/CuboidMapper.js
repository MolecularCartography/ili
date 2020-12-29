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
        'threejsutils': '../utility/ThreeJsUtils',
        'remappingprocessor': '../utility/VolumeRemappingProcessor'
    }
}, [
    'utils', 'three', 'bounds', 'rawvolumedata', 'indexer1d', 'threejsutils', 'remappingprocessor'
],
function (Utils, THREE, Bounds, RawVolumeData, Indexer1D, ThreeUtils, RemappingProcessor) {
    onmessage = function(e) {
        const data = e.data;

        const cuboids = data.cuboids;
        const intensities = data.intensities;
        const cuboidsSizeScale = data.cuboidsSizeScale;

        let progressReportTime = new Date().valueOf();

        const buffer = data.buffer;
        const processor = new RemappingProcessor();
        processor.calculate(data.volume, buffer, cuboids, intensities, cuboidsSizeScale, {
            setup: function(count) {
                postMessage({
                    status: 'working',
                    message: `Remapping cuboids...`
                });
            },

            notify: function(progress, total) {
                var now = new Date().valueOf();
                if (now < progressReportTime + 100) return;
                progressReportTime = now;
                postMessage({
                    status: 'working',
                    message: `Cuboid remapping - ${progress} operations of ${total}`
                });
            },

            finished: function() { 
                postMessage({
                    status: 'completed',
                    buffer: buffer
                }, [buffer]);
            }
        });
    }

    postMessage({
        status: 'ready'
    });
});
