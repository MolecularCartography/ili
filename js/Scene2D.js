'use strict';

define([
    'eventsource', 'spotscontroller', 'three'
],
function(EventSource, SpotsController, THREE) {
    function Scene2D(spotsController) {
        EventSource.call(this, Scene2D.Events);

        this._spotsController = spotsController;
        this._imageURL = null;
        this._width = 0;
        this._height = 0;
    };

    Scene2D.Events = {
        IMAGE_CHANGE: 'image_change'
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
                var spots = this._spotsController.spots;
                var color = new THREE.Color();
                var borderOpacity = this._spotsController.spotBorder;
                var globalScale = this._spotsController.globalSpotScale;
                var globalOpacity = this._spotsController.globalSpotOpacity;
                return new Promise(function(accept, reject) {
                    if (!spots) {
                        reject();
                        return;
                    }

                    var ctx = canvas.getContext('2d');
                    for (var i = 0; i < spots.length; i++) {
                        var s = spots[i];
                        if (isNaN(s.intensity)) continue;
                        var color = s.color;
                        var scale = s.scale * globalScale;

                        ctx.beginPath();
                        ctx.arc(s.x, s.y, s.r * scale, 0, 2 * Math.PI, false);
                        var gdx = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * scale);
                        var rgba = 'rgba(' + Math.round(color.r * 255) + ',' + Math.round(color.g * 255) + ',' + Math.round(color.b * 255) + ',';

                        var opacity = globalOpacity * s.opacity;
                        gdx.addColorStop(0, rgba + opacity + ')');
                        gdx.addColorStop(1, rgba + borderOpacity * opacity + ')');
                        ctx.fillStyle = gdx;
                        ctx.fill();
                    }

                    accept();
                }.bind(this));
            }
        },

        findSpot: {
            value: function(point) {
                var spots = this._spotsController.spots;
                var globalScale = this._spotsController.globalSpotScale;
                return new Promise(function(accept, reject) {
                    if (!spots) {
                        reject();
                        return;
                    }

                    for (var i = 0; i < spots.length; i++) {
                        var s = spots[i];
                        var scaleFactor = globalScale * s.scale;
                        if (!isNaN(s.intensity) &&
                            point.x > s.x - s.r * scaleFactor && point.x < s.x + s.r * scaleFactor
                            && point.y > s.y - s.r * scaleFactor && point.y < s.y + s.r * scaleFactor)
                        {
                            var dx = point.x - s.x;
                            var dy = point.y - s.y;
                            if (dx * dx + dy * dy < s.r * s.r * scaleFactor * scaleFactor) {
                                accept(s)
                                return;
                            }
                        }
                    }

                    accept(null);
                });
            }
        }
    });

    return Scene2D;
});
