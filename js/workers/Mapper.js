/**
 * Web worker what builds association between points on the mesh (only used for
 * MODE_3D) and spots. Having this accosiation prebuilt recoloring the mesh for
 * any specific map related to the same spots could be done much faster.
 */

'use strict';

importScripts('../lib/require.min.js');

require([],
function() {
    onmessage = function(e) {
        var positions = e.data.verteces;
        var spots = e.data.spots;

        var pointCount = (positions.length / 3) | 0;
        var closestSpotIndeces = new Int32Array(pointCount);
        var closestSpotDistances = new Float32Array(pointCount);
        var progress = -1;
        var nextChunk = 0;
        var highlightedVerteces = 0;

        for (var i = 0; i < pointCount; i++) {
            while (i >= nextChunk) {
                progress++;
                nextChunk = Math.ceil((progress + 1) * pointCount / 100);
                postMessage({
                    status: 'working',
                    message: 'Mapping: ' + progress + '%',
                });
            }
            var positionOffset = i * 3;
            var x = positions[positionOffset + 0];
            var y = positions[positionOffset + 1];
            var z = positions[positionOffset + 2];

            var closestSpotIndex = -1;
            var closesSpotSquareDistance;

            for (var j = 0; j < spots.length; j++) {
                var spot = spots[j];

                var dx = spot.x - x;
                var dy = spot.y - y;
                var dz = spot.z - z;
                var rsq = dx * dx + dy * dy + dz * dz;

                if (rsq > spot.r * spot.r) continue;

                if (closestSpotIndex < 0 || rsq < closesSpotSquareDistance) {
                    closesSpotSquareDistance = rsq;
                    closestSpotIndex = j;
                }
            }

            closestSpotIndeces[i] = closestSpotIndex;
            if (closestSpotIndex >= 0) {
                closestSpotDistances[i] = Math.sqrt(closesSpotSquareDistance) /
                                          spots[closestSpotIndex].r;
                highlightedVerteces++;
            } else {
                closestSpotDistances[i] = 1.0;
            }
        }

        postMessage({
            status: 'completed',
            closestSpotIndeces: closestSpotIndeces,
            closestSpotDistances: closestSpotDistances,
        });
    };
    postMessage({
        status: 'ready'
    });
});
