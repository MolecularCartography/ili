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
    VIRIDIS: new ColorMap('Viridis', [
        '#440154',
        '#482777',
        '#3F4A8A',
        '#31678E',
        '#26838F',
        '#1F9D8A',
        '#6CCE5A',
        '#B6DE2B',
        '#FEE825']),

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
            '#800026',
            '#bd0026',
            '#e31a1c',
            '#fc4e2a',
            '#fd8d3c',
            '#feb24c',
            '#fed976',
            '#ffeda0',
            '#ffffcc']),

    RDBU: new ColorMap('Blue-Red', [
            '#2166ac',
            '#4393c3',
            '#92c5de',
            '#d1e5f0',
            '#f7f7f7',
            '#fddbc7',
            '#f4a582',
            '#d6604d',
            '#b2182b']),

    PUOR: new ColorMap('Purple-Orange', [
            '#542788',
            '#8073ac',
            '#b2abd2',
            '#d8daeb',
            '#f7f7f7',
            '#fee0b6',
            '#fdb863',
            '#e08214',
            '#b35806']),

};
