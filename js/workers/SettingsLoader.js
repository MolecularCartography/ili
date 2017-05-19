/** 
 * Web Worker that loads measures and spots from the CSV file.
 * First row of the CSV file is a header with column names. First 5 column
 * are predefined and their names are ignored:
 * 1. Spot name.
 * 2. X coordinate of the spot.
 * 3. Y coordinate.
 * 4. Z coordinate. Ignored for MODE_2D (values should be empty).
 * 5. Radius.
 *
 * Coordinates for MODE_2D are in pixels, for MODE_3D are in mesh's units.
 *
 * Subsequent columns are measures. Column names are displayed in the
 * MapSelector. Missing values should have empty cells. That spots won't be
 * highlighted.
 */

'use strict';

importScripts('../lib/require.min.js');

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
