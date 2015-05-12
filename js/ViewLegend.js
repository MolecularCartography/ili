'use strict';

function ViewLegend(workspace, svg) {
    this._workspace = workspace;
    this._svg = svg;
    this._workspace.addEventListener('mapping-change', this.update.bind(this));
    this.update();
}

ViewLegend.prototype = Object.create(null, {
    prepareUpdateLayout: {
        value: function() {}
    },

    finishUpdateLayout: {
        value: function() {}
    },

    update: {
        value: function() {
            var description = this._workspace.colorMap.gradient;
            var stops = [];
            for (var i in description) {
                stops.push('<stop offset="' + i + '" style="stop-color:' +
                           description[i] + '" />');
            }
            this._svg.getElementById('colorMapGradient').innerHTML =
                    stops.join('');

            var workspace = this._workspace;
            this._svg.getElementById('minLabel').textContent = format(workspace.minValue);
            this._svg.getElementById('maxLabel').textContent = format(workspace.maxValue);

            function format(x) {
                return workspace.scale.function(Number(x)).toFixed(3);
            }
        }
    },

    export: {
        value: function(canvas, scale) {
            return new Promise(function(accept, reject) {
                var OFFSET = 10;
                var width = this._svg.clientWidth;
                var height = this._svg.clientHeight;
                var source =
                        '<svg xmlns="http://www.w3.org/2000/svg" width="' +
                        width + '" height="' + height + '">' +
                        this._svg.innerHTML +
                        '</svg>';
                var blob = new Blob([source], {type: 'image/svg+xml;charset=utf-8'});
                var image = new Image();
                image.onload = function() {
                    var ctx = canvas.getContext('2d');
                    var left = canvas.width - (width + OFFSET) * scale;
                    var top = canvas.height - (height + OFFSET) * scale;
                    ctx.drawImage(image, left, top, width * scale, height * scale);
                    URL.revokeObjectURL(image.src);
                    accept();
                };
                image.onerror = function(event) {
                    URL.revokeObjectURL(image.src);
                    console.log('Failed to load SVG', event);
                    reject();
                };
                image.src = URL.createObjectURL(blob);
            }.bind(this));
        }
    },
});
