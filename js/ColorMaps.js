'use striict';

/**
 * Base class for color maps.
 *
 * @param {Array<String>} colorValues Values are css-like colors at
 *                        i / (length - 1) point.
 */
function ColorMap(colorValues) {
    this._colors = new Array(colorValues.length);
    for (var i = 0; i < this._colors.length; i++) {
        this._colors[i] = new THREE.Color(colorValues[i]);
    }
}

ColorMap.prototype = Object.create(null, {
    /**
     * @param {THREE.Color} color Result (out parameter).
     * @param {Number} intensity In range of [0, 1].
     */
    map: {
        value: function(color, intensity) {
            if (intensity <= 0.0) {
                color.set(this._colors[0]);
                return;
            }
            if (intensity >= 1.0) {
                color.set(this._colors[this._colors.length - 1]);
                return;
            }

            var position = intensity * (this._colors.length - 1);
            var index = Math.floor(position);
            var alpha = position - index;

            color.set(this._colors[index]);
            color.lerp(this._colors[index + 1], alpha);
        }
    },

    /**
     * Creates data for CSS or SGV gradient stop points.
     *
     * @return {Hash<String>} Keys are stop-points (like '0%'), values are
     *                        colors.
     */
    gradient: {
        get: function() {
            var result = {};
            for (var i = 0; i < this._colors.length; i++) {
                var stop = 100 * i / (this._colors.length - 1);
                result[stop + '%'] = this._colors[i].getStyle();
            }
            return result;
        }
    }
});

function JetColorMap() {
    ColorMap.call(this, [
            '#00007F',
            'blue',
            '#007FFF',
            'cyan',
            '#7FFF7F',
            'yellow',
            '#FF7F00',
            'red',
            '#7F0000'
    ]);
};

JetColorMap.prototype = Object.create(ColorMap.prototype);