'use strict';

importScripts('../lib/require.min.js');

require({
    'paths': {
        'three': '../lib/three.min'
    }
}, [
    'three'
],
function(THREE) {
    onmessage = function(e) {
        var startTime = new Date();

        var origin = new THREE.Vector3().copy(e.data.origin);
        var direction = new THREE.Vector3().copy(e.data.direction);
        var positions = e.data.positions;
        var matrixWorld = new THREE.Matrix4().copy(e.data.matrixWorld);

        var ray = new THREE.Ray(origin, direction);
        var inverseMatrix = new THREE.Matrix4().getInverse(matrixWorld);
        var inverseRay = new THREE.Ray().copy(ray).applyMatrix4(inverseMatrix);
        var inverseOrigin = new THREE.Vector3().copy(origin).applyMatrix4(inverseMatrix);

        var vA = new THREE.Vector3();
        var vB = new THREE.Vector3();
        var vC = new THREE.Vector3();

        var result = null;

        for (var i = 0, j = 0, il = positions.length; i < il; i += 3, j += 9) {
            var a = i;
            var b = i + 1;
            var c = i + 2;
            vA.fromArray(positions, j);
            vB.fromArray(positions, j + 3);
            vC.fromArray(positions, j + 6);

            var intersectionPoint = inverseRay.intersectTriangle(vC, vB, vA, false);
            if (!intersectionPoint) continue;

            var distance = inverseOrigin.distanceTo(intersectionPoint);
            if (!result || distance < result.distance) {
                result = {
                    a: a,
                    b: b,
                    c: c,
                    distance: distance
                };
            }
        }

        if (result) {
            result.status = 'completed';
        }
        postMessage(result);

        var endTime = new Date();
        console.log('Raycast time: ' +
            (endTime.valueOf() - startTime.valueOf()) / 1000);
    };
    postMessage({
        status: 'ready'
    });
});
