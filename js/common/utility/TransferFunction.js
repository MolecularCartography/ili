'use strict';

define([
    'three'
],
function(THREE) {

    function TransferFunction(points) {
        this._points = points.map(v => v.clone());
    }

    TransferFunction.prototype = Object.create(null, {

        map: {
            value: function(relativePosition) {
                // Out of range values.
                if (relativePosition <= 0.0) {
                    return this._points[0].y;
                }
                if (relativePosition >= 1.0) {
                    return this._points[this._points.length - 1].y;
                }

                // Default interpolation.
                const prevIndex = this._points.findIndex(v => v.x > relativePosition) - 1;
                const prevPoint = this._points[prevIndex];
                const nextPoint = this._points[prevIndex + 1];
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
