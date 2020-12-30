'use strict';

importScripts('../../lib/require.min.js');

require({
    'paths': {
        'utils': '../../common/utility/utils',
        'three': '../../lib/three.min',
        'bounds': '../../common/utility/Bounds',
        'rawvolumedata': '../utility/RawVolumeData',
        'indexer1d': '../../common/utility/Indexer1D',
        'volumenormalsprocessor': '../utility/VolumeNormalsProcessor'
    }
}, [
    'utils', 'three', 'bounds', 'rawvolumedata', 'indexer1d', 'volumenormalsprocessor'
],
function (Utils, THREE, Bounds, RawVolumeData, Indexer1D, VolumeNormalsProcessor) {

    onmessage = function(e) {
        const data = e.data;
  
        let progressReportTime = new Date().valueOf();

        const processor = new VolumeNormalsProcessor();
        const buffer = data.buffer;
        processor.calculate(data.volume, buffer, {
            setup: function(count) {
                postMessage({
                    status: 'working',
                    message: `Calculating normals...`
                });
            },

            notify: function(progress, total) {
                var now = new Date().valueOf();
                if (now < progressReportTime + 500) return;
                progressReportTime = now;
                postMessage({
                    status: 'working',
                    message: `Calculating normals - ${progress} operation of ${total}`
                });
            },

            finished: function() { 
                postMessage({
                    buffer: buffer,
                    status: 'completed'
                }, [buffe]);
            }
        });
    }

    postMessage({
        status: 'ready'
    });
});
