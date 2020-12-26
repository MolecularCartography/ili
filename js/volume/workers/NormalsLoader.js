'use strict';

importScripts('../../lib/require.min.js');

require({
    'paths': {
        'utils': '../../common/utility/utils',
        'three': '../../lib/three.min',
        'bounds': '../../common/utility/Bounds',
        'rawvolumedata': '../utility/RawVolumeData',
        'indexer1d': '../../common/utility/Indexer1D',
        'volumeNormalsProcessor': '../utility/VolumeNormalsProcessor'
    }
}, [
    'utils', 'three', 'bounds', 'rawvolumedata', 'indexer1d', 'volumeNormalsProcessor'
],
function (Utils, THREE, Bounds, RawVolumeData, Indexer1D, VolumeNormalsProcessor) {
    onmessage = function(e) {
        const inputVolume = e.data;
        const normalsBounds = new Bounds(0, 255); 

        const processor = new VolumeNormalsProcessor(
            inputVolume,
            normalsBounds,
            {
                setup: function(count) {
                    postMessage({
                        status: 'working',
                        message: `Count of operations: ${count}`
                    });
                },

                notify: function(progress, total) {
                    postMessage({
                        status: 'working',
                        message: `Calculating normlas - ${progress} operation of ${total}`
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
