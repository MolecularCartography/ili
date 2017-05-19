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

require({
    'paths': {
        'papa': '../lib/papaparse.min'
    },
    'shim': {
        'papa': {
            exports: 'Papa'
        }
    }
},[
    'papa'
],
function(Papa) {
    onmessage = function(e) {
        var blob = e.data.data;
        Papa.parse(blob, new Handler());
    };

    function Handler() {
        this._row = -1;
        this._progressReportTime = new Date().valueOf();
        this.spots = [];
        this.measures = null;

        this.step = this._step.bind(this);
        this.complete = this._complete.bind(this);
    }

    Handler.prototype = {
        _step: function(results, parser) {
            if (++this._row === 0) {
                this._handleHeader(results.data[0]);
                return;
            }

            if (results.error) {
                parser.abort();
                this._reportError('Parsing error');
                return;
            }

            var row = results.data[0];
            if (row.length == 1 && row[0] === '') return; // Ignore empty lines
            if (row.length < 5 + this.measures.length) {
                parser.abort();
                this._reportError('Too few elements');
                return;
            }
            var spot = {
                name: row[0],
                x: Number(row[1]),
                y: Number(row[2]),
                z: Number(row[3]),
                r: Number(row[4]),
                intensity: NaN,
            };
            if (isNaN(spot.x) || isNaN(spot.y) || isNaN(spot.y) ||
                isNaN(spot.z) || isNaN(spot.r)) {
                parser.abort();
                this._reportError('Invalid spot coordinates');
                return;
            }

            for (var j = 0; j < this.measures.length; j++) {
                var value = row[j + 5];
                this.measures[j].values[this.spots.length] =
                    value === '' ? NaN : Number(value);
            }

            this.spots.push(spot);

            if (this._row % 10 === 0) this._reportProgress();
        },

        _handleHeader: function(header) {
            this.measures = header.slice(5).map(function(name, index) {
                return {
                    name: name,
                    index: index,
                    values: [],
                };
            });
        },

        _complete: function() {
            // Convert measures in memory efficient format.
            for (var i = 0; i < this.measures.length; i++) {
                var m = this.measures[i];
                var values = new Float32Array(m.values.length);
                values.set(m.values);
                m.values = values;
            }

            postMessage({
                status: 'completed',
                spots: this.spots,
                measures: this.measures,
            });
        },

        _reportError: function(message) {
            postMessage({
                status: 'failed',
                message: 'Failure in row ' + this._row + ': ' + message,
            });
        },

        _reportProgress: function() {
            var now = new Date().valueOf();
            if (now < this._progressReportTime + 100) return;

            this._progressReportTime = now;

            postMessage({
                status: 'working',
                message: 'Loading measures: ' + this._row + ' rows processed',
            });
        },
    };
    postMessage({
        status: 'ready'
    });
});
