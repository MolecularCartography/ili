'use strict';

importScripts('../../lib/require.min.js');

require([],
function () {
    onmessage = function (e) {
        var blob = e.data.data;
        var reader = new FileReaderSync();
        try {
            var settings = JSON.parse(reader.readAsText(blob));
        } catch (e) {
            postMessage({
                status: 'failed',
                message: e.message,
            });
        }
        postMessage({
            status: 'completed',
            settings: settings
        });
    };
    postMessage({
        status: 'ready'
    });
});
