function Scene2D() {
    EventSource.call(this, Scene2D.Events);

    this._spotBorder = 0.05;
    this._imageURL = null;
    this._width = 0;
    this._height = 0;
    this._spots = null;
};

Scene2D.Events = {
    IMAGE_CHANGE: 'image_change',
    PARAM_CHANGE: 'param_change',
    SPOTS_CHANGE: 'spots-change',
};

Scene2D.prototype = Object.create(EventSource.prototype, {
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
            this._notify(Scene2D.Events.IMAGE_CHANGE);
        }
    },

    imageURL: {
        get: function() {
            return this._imageURL;
        }
    },

    resetImage: {
        value: function() {
            this.setImage(null, 0, 0);
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
            this._notify(Scene2D.Events.PARAM_CHANGE);
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

            this._notify(Scene2D.Events.SPOTS_CHANGE);
        }
    },

    updateIntensities: {
        value: function(spots) {
            if (!this._spots) return;
            var startTime = new Date();

            for (var i = 0; i < this._spots.length; i++) {
                this._spots[i].intensity = spots[i] && spots[i].intensity;
            }
            this._notify(Scene2D.Events.SPOTS_CHANGE);
            var endTime = new Date();
            console.log('Spots updating time: ' +
                    (endTime.valueOf() - startTime.valueOf()) / 1000);
        }
    },

    colorMap: {
        get: function() {
            return this._colorMap;
        },

        set: function(value) {
            this._colorMap = value;
            this._notify(Scene2D.Events.SPOTS_CHANGE);
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
            return new Promise(function(accept, reject) {
                if (!this.width || !this.height) {
                    reject();
                    return;
                }

                var SVGNS = 'http://www.w3.org/2000/svg';
                var svgElement = document.createElementNS(SVGNS, 'svg');
                this._buildContent(svgElement);
                svgElement.removeChild(svgElement.querySelector('image'));
                var source =
                        '<svg xmlns="http://www.w3.org/2000/svg" width="' +
                        this.width + '" height="' + this.height + '">' +
                        svgElement.innerHTML +
                        '</svg>';
                var blob = new Blob([source], {type: 'image/svg+xml;charset=utf-8'});
                var image = new Image();
                image.width = this.width;
                image.height = this.height;
                image.onload = function() {
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(image, 0, 0);
                    URL.revokeObjectURL(image.src);
                    accept();
                };
                image.onerror = function(event) {
                    URL.revokeObjectURL(image.src);
                    console.log('Failed to load SVG', event);
                    reject();
                }
                image.src = URL.createObjectURL(blob);
            }.bind(this));
        }
    },

    findSpot: {
        value: function(point) {
            var spots = this._spots;
            return new Promise(function(accept, reject) {
                if (!spots) {
                    reject();
                    return;
                }

                for (var i = 0; i < spots.length; i++) {
                    var s = spots[i];
                    if (!isNaN(s.intensity) &&
                            point.x > s.x - s.r && point.x < s.x + s.r &&
                            point.y > s.y - s.r && point.y < s.y + s.r) {
                        var dx = point.x - s.x;
                        var dy = point.y - s.y;
                        if (dx * dx + dy * dy < s.r * s.r) {
                            accept(s)
                            return;
                        }
                    }
                }

                accept(null);
            });
        }
    },
});