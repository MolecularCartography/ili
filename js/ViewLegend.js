'use strict';

define(['workspace'],
function(Workspace) {
    function ViewLegend(workspace, svg) {
        this._workspace = workspace;
        this._svg = svg;
        this._workspace.addEventListener(Workspace.Events.MAPPING_CHANGE, this.update.bind(this));
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
            value: function () {
                var description = this._workspace.colorMap.gradient;

                var colorBar = this._svg.getElementById('colorMapGradient');
                while (colorBar.firstChild) {
                    colorBar.removeChild(colorBar.firstChild);
                }
                for (var i in description) {
                    var stopNode = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                    stopNode.setAttribute('offset', i);
                    stopNode.setAttribute('stop-color', description[i]);
                    colorBar.appendChild(stopNode);
                }
                var workspace = this._workspace;
                this._svg.getElementById('minLabel').textContent = format(workspace.minValue);
                this._svg.getElementById('maxLabel').textContent = format(workspace.maxValue);
                this._svg.getElementById('scaleLabel').textContent = workspace.scale.legend;

                function format(x) {
                    return Number(x).toFixed(3);
                }
            }
        },

        export: {
            value: function(canvas, scale) {
                return new Promise(function(accept, reject) {


                    var OFFSET = 10;
                    var legendStyle = window.getComputedStyle(this._svg);
                    var width = parseInt(legendStyle.getPropertyValue('width'), 10);
                    var height = parseInt(legendStyle.getPropertyValue('height'), 10);

                    var source = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">';
                    var subElements = this._svg.childNodes;
                    for (var i = 0; i < subElements.length; ++i) {
                        var element = subElements[i];
                        source += new XMLSerializer().serializeToString(element);
                    }
                    source += '</svg>';

                    var image = new Image();
                    image.onload = function() {
                        var ctx = canvas.getContext('2d');
                        var left = canvas.width - (width + OFFSET) * scale;
                        var top = canvas.height - (height + OFFSET) * scale;
                        ctx.drawImage(image, left, top, width * scale, height * scale);
                        accept();
                    };
                    image.onerror = function(event) {
                        console.log('Failed to load SVG', event);
                        reject();
                    };
                    image.setAttribute("src", "data:image/svg+xml;base64," + window.btoa(source));
                }.bind(this));
            }
        },

        toJSON: {
            value: function () {
                return {};
            }
        },

        fromJSON: {
            value: function (json) {

            }
        }
    });

    return ViewLegend;
});
