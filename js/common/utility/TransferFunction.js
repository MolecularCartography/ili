'use strict';

define([
    'three'
],
function(THREE) {

    function TransferFunction(points) {
        this.points = points.map(v => new THREE.Vector2(v.x, v.y));
    }

    TransferFunction.prototype = Object.create(null, {

        map: {
            value: function(relativePosition) {
                // Out of range values.
                if (relativePosition <= 0.0) {
                    return this.points[0].y;
                }
                if (relativePosition >= 1.0) {
                    return this.points[this._points.length - 1].y;
                }

                // Default interpolation.
                const prevIndex = this.points.findIndex(v => v.x > relativePosition) - 1;
                const prevPoint = this.points[prevIndex];
                const nextPoint = this.points[prevIndex + 1];
                const k = (relativePosition - prevPoint.x) / (nextPoint.x - prevPoint.x);
                return prevPoint.y + (nextPoint.y - prevPoint.y) * k;
            }
        }

    });

    TransferFunction.getDefault = function() {
        return new TransferFunction([
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1, 1)
        ]);
    };

    return TransferFunction;
});
