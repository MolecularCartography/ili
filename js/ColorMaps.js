'use striict';

/**
 * Base class for color maps.
 *
 * @param {string} name.
 * @param {Array<String>} colorValues Values are css-like colors at
 *                        i / (length - 1) point.
 */
function ColorMap(name, colorValues) {
    this.name = name;
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

ColorMap.Maps = {
    JET: new ColorMap('Jet', [
            '#00007F',
            'blue',
            '#007FFF',
            'cyan',
            '#7FFF7F',
            'yellow',
            '#FF7F00',
            'red',
            '#7F0000']),

    HOT: new ColorMap('Hot', [
            '#ffffcc',
            '#ffeda0',
            '#fed976',
            '#feb24c',
            '#fd8d3c',
            '#fc4e2a',
            '#e31a1c',
            '#bd0026',
            '#800026']),

    RDBU: new ColorMap('RdBu', [
            '#b2182b',
            '#d6604d',
            '#f4a582',
            '#fddbc7',
            '#f7f7f7',
            '#d1e5f0',
            '#92c5de',
            '#4393c3',
            '#2166ac']),

    RDYLBU: new ColorMap('RdYlBu', [
            '#d73027',
            '#f46d43',
            '#fdae61',
            '#fee090',
            '#ffffbf',
            '#e0f3f8',
            '#abd9e9',
            '#74add1',
            '#4575b4']),

    PUOR: new ColorMap('PuOr', [
            '#b35806',
            '#e08214',
            '#fdb863',
            '#fee0b6',
            '#f7f7f7',
            '#d8daeb',
            '#b2abd2',
            '#8073ac',
            '#542788']),
};