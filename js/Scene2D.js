function Scene2D() {
    this._spotBorder = 0.05;
    this._views = [];
    this._imageURL = null;
    this._width = 0;
    this._height = 0;
    this._spots = null;
};

Scene2D.prototype = Object.create(null, {
    view: {
        set: function(value) {
            this._views = [value];
            this._buildContent(value.contentElement);
        }
    },

    width: {
        get: function() {
            return this._width;
        }
    },

    height: {
        get: function() {
            return this._height;
        }
    },

    hasImage: {
        get: function() {
            return !!this._imageURL;
        }
    },

    setImage: {
        value: function(imageURL, width, height) {
            if (this._imageURL) {
                URL.revokeObjectURL(this._imageURL);
            }
            this._imageURL = imageURL;
            this._width = width;
            this._height = height;

            for (var i = 0; i < this._views.length; i++) {
                var contentElement = this._views[i].contentElement;
                this._updateImage(contentElement, contentElement.querySelector('image'));
                this._views[i].adjustOffset();
            }
        }
    },

    resetImage: {
        value: function() {
            this.setImage(null, 0, 0);
        }
    },

    _updateImage: {
        value: function(contentElement, imageElement) {
            imageElement.href.baseVal = this._imageURL || '';
            imageElement.width.baseVal.value = this._width;
            imageElement.height.baseVal.value = this._height;
            contentElement.setAttribute('width', this._width);
            contentElement.setAttribute('height', this._height);
        }
    },

    _buildContent: {
        value: function(contentElement) {
            var SVGNS = 'http://www.w3.org/2000/svg';
            var imageElement = document.createElementNS(SVGNS, 'image');
            this._updateImage(contentElement, imageElement);
            contentElement.appendChild(imageElement);

            var defsElement = document.createElementNS(SVGNS, 'defs');
            contentElement.appendChild(defsElement);

            var spotsGroupElement = document.createElementNS(SVGNS, 'g');
            spotsGroupElement.setAttribute('id', 'spots');
            contentElement.appendChild(spotsGroupElement);

            if (this._spots) {
                this._createSpots(
                        spotsGroupElement, defsElement);
            }
        }
    },

    spotBorder: {
        get: function() {
            return this._spotBorder;
        },

        set: function(value) {
            if (this._spotBorder == value) return;
            if (value < 0.0) value = 0.0;
            if (value > 1.0) value = 1.0;
            this._spotBorder = value;
            if (this._spots) this._updateSpots();
        }
    },

    spots: {
        get: function() {
            return this._spots;
        },

        set: function(value) {
            if (value) {
                this._spots = value.map(function(s) {
                    return {
                        x: s.x,
                        y: s.y,
                        r: s.r,
                        name: s.name,
                        intensity: s.intensity,
                    };
                });
            } else {
                this._spots = null;
                return;
            }

            for (var i = 0; i < this._views.length; i++) {
                var c = this._views[i].contentElement;
                var spotsGroupElement = c.querySelector('#spots');
                var defsElement = c.querySelector('defs');
                spotsGroupElement.textContent = '';
                defsElement.textContent = '';
                if (this._spots) {
                    this._createSpots(
                                    spotsGroupElement, defsElement);
                }
            }
        }
    },

    updateIntensities: {
        value: function(spots) {
            if (!this._spots) return;

            for (var i = 0; i < this._spots.length; i++) {
                this._spots[i].intensity = spots[i] && spots[i].intensity;
            }
            this._updateSpots();
        }
    },

    colorMap: {
        get: function() {
            return this._colorMap;
        },

        set: function(value) {
            this._colorMap = value;
            if (this._spots) this._updateSpots();
        }
    },

    exportImage: {
        value: function(canvas) {
            return new Promise(function(accept, reject) {
                if (!this._imageURL) {
                    reject();
                    return;
                }
                var image = new Image();
                image.width = this.width;
                image.height = this.height;
                image.onload = function() {
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(image, 0, 0);
                    accept();
                };
                image.onerror = function(event) {
                    console.log('Failed to load SVG', event);
                    reject();
                }
                image.src = this._imageURL;
            }.bind(this));
        }
    },

    exportSpots: {
        value: function(canvas) {
            var spots = this._spots;
            var color = new THREE.Color();
            var colorMap = this._colorMap;
            var borderGradientSuffix = this._spotBorder + ')';
            return new Promise(function(accept, reject) {
                if (!spots) {
                    reject();
                    return;
                }

                var ctx = canvas.getContext('2d');
                for (var i = 0; i < spots.length; i++) {
                    var s = spots[i];
                    if (isNaN(s.intensity)) continue;
                    colorMap.map(color, s.intensity);

                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI, false);
                    var gdx = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
                    var rgba = 'rgba(' + Math.round(color.r * 155) + ',' +
                            Math.round(color.g * 255) + ',' + Math.round(color.b * 255) + ',';

                    gdx.addColorStop(0, rgba + '1)');
                    gdx.addColorStop(1, rgba + borderGradientSuffix);
                    ctx.fillStyle = gdx;
                    ctx.fill();
                }

                accept();
            }.bind(this));
        }
    },

    _updateSpots: {
        value: function() {
            this._forContentElement(function(contentElement) {
                this._updateSpotsGradients(contentElement.querySelector('defs'));
            }.bind(this));
        }
    },

    _updateSpotsGradients: {
        value: function(defsElement) {
            var startTime = new Date();

            var intensityColor = new THREE.Color();
            for (var i = 0; i < defsElement.childElementCount; i++) {
                var g = defsElement.children[i];
                var stop0 = g.children[0];
                var stop1 = g.children[1];

                var spot = this._spots[i];
                if (spot && !isNaN(spot.intensity)) {
                    this._colorMap.map(intensityColor, spot.intensity);
                    stop0.style.stopColor = stop1.style.stopColor =
                            intensityColor.getStyle();
                    stop0.style.stopOpacity = 1.0;
                    stop1.style.stopOpacity = this._spotBorder;
                } else {
                    stop0.style.stopColor = stop1.style.stopColor = '';
                    stop0.style.stopOpacity = stop1.style.stopOpacity = 0;
                }
            }

            var endTime = new Date();
            console.log('Recoloring time: ' +
                    (endTime.valueOf() - startTime.valueOf()) / 1000);
        }
    },

    _createSpots: {
        value: function(spotsGrpupElement, defsElement) {
            var SVGNS = 'http://www.w3.org/2000/svg';

            var document = spotsGrpupElement.ownerDocument;

            for (var i = 0; i < this._spots.length; i++) {
                var spot = this._spots[i];

                var gradientElement = document.createElementNS(
                    SVGNS, 'radialGradient');
                gradientElement.cx.baseVal = "50%";
                gradientElement.cy.baseVal = "50%";
                gradientElement.r.baseVal = "50%";
                gradientElement.fx.baseVal = "50%";
                gradientElement.fy.baseVal = "50%";
                gradientElement.id = "spot" + i;

                gradientElement.innerHTML = '<stop offset="0%" />' +
                                            '<stop offset="100%" />';
                defsElement.appendChild(gradientElement);

                var spotElement = document.createElementNS(SVGNS, 'ellipse');
                spotElement.setAttribute('index', i);
                spotElement.rx.baseVal.value = spot.r;
                spotElement.ry.baseVal.value = spot.r;
                spotElement.cx.baseVal.value = spot.x;
                spotElement.cy.baseVal.value = spot.y;
                spotElement.style.fill = 'url(#spot' + i + ')';
                spotsGrpupElement.appendChild(spotElement);
            }

            this._updateSpotsGradients(defsElement);
        }
    },

    _forContentElement: {
        value: function(fn) {
            for (var i = 0; i < this._views.length; i++) {
                fn(this._views[i].contentElement);
            }
        }
    },
});
