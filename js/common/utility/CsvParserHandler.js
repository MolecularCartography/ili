
'use strict';

importScripts('../../lib/require.min.js');

// TODO: process.
require({
    'paths': {
        'papa': '../../lib/papaparse.min'
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
    function Handler(valueCount, controller) {
        this._controller = controller;
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

            const validationResult = this._controller.validateRow(row);
            if (validationResult) {
                parser.abort();
                this._reportError(validationResult);
                return;
            }

            var spot = this._controller.getObject(row);
            if (!spot) {
                parser.abort();
                this._reportError('Invalid object parameters');
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
