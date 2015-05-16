'use strict';

function View2D(workspace, div) {
    this._div = div;
    this._width = 0;
    this._height = 0;
    this._scale = 1.0;
    this._mouseAction = null;
    this._offset = {x: 0, y: 0};
    this._scene = workspace.scene2d;
    this._spotLabel = new SpotLabel2D(this);

    this._scene.view = this;

    this._div.addEventListener('mousewheel', this._onMouseWheel.bind(this));
    this._div.addEventListener('mousedown', this._onMouseDown.bind(this));
    this._div.addEventListener('dblclick', this._onDblClick.bind(this));
}

View2D.SCALE_CHANGE = 1.1;

View2D.prototype = Object.create(null, {
    div: {
        get: function() {
            return this._div;
        }
    },

    prepareUpdateLayout: {
        value: function() {
            this._width = this._div.clientWidth;
            this._height = this._div.clientHeight;
        }
    },

    contentElement: {
        get: function() {
            return this._div.querySelector('svg#contentElement');
        }
    },

    scale: {
        get: function() {
            return this._scale;
        }
    },

    finishUpdateLayout: {
        value: function() {
            this._reposition();
        }
    },

    offset: {
        get: function() {
            return {x: this._offset.x, y: this._offset.y};
        },

        set: function(offset) {
            this._offset.x = offset.x;
            this._offset.y = offset.y;

            this._reposition();
        }
    },

    adjustOffset: {
        value: function() {
            if (this._width > this._scene.width * this._scale) {
                this._offset.x = 0;
            } else {
                var max = Math.ceil(
                        (this._scene.width * this._scale - this._width) * 0.5);
                this._offset.x = Math.max(-max, Math.min(max, this._offset.x));
            }
            if (this._height > this._scene.height * this._scale) {
                this._offset.y = 0;
            } else {
                var max = Math.ceil(
                        (this._scene.height * this._scale - this._height) * 0.5);
                this._offset.y = Math.max(-max, Math.min(max, this._offset.y));
            }
            this._reposition();
        }
    },

    export: {
        value: function(canvas) {
            return new Promise(function(accept, reject) {

                canvas.width = this._scene.width;
                canvas.height = this._scene.height;

                this._scene.exportImage(canvas).then(function() {
                    this._scene.exportSpots(canvas).then(accept).catch(reject);
                }.bind(this)).catch(reject);
            }.bind(this));

            function loadImage(image, src) {
                return new Promise(function(accept, reject) {
                    image.onload = accept;
                    image.onerror = reject;
                    image.src = src;
                });
            }
        }
    },

    _onSceneChange: {
        value: function() {
            this._reposition();
        }
    },

    _reposition: {
        value: function() {
            var x = (this._width - this._scene.width * this._scale) / 2 +
                    this._offset.x;
            var y = (this._height - this._scene.height * this._scale) / 2 +
                    this._offset.y;
            var style = this.contentElement.style;
            style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(' + this._scale + ')';
            style.transformOrigin = '0 0';

            this._spotLabel.update();
        }
    },

    screenToImage: {
        value: function(point) {
            var local = {
                    x: point.x - this._div.offsetLeft - this._div.clientLeft,
                    y: point.y - this._div.offsetTop - this._div.clientTop
            };

            return {
                    x: (local.x - this._offset.x -
                            (this._width - this._scene.width * this._scale) / 2) /
                            this._scale,
                    y: (local.y - this._offset.y -
                            (this._height - this._scene.height * this._scale) / 2) /
                            this._scale
            };
        }
    },

    imageToClient: {
        value: function(coords) {
            return {
                x: (this._width - this._scene.width * this._scale) / 2 +
                    coords.x * this._scale + this._offset.x,
                y: (this._height - this._scene.height * this._scale) / 2 +
                    coords.y * this._scale + this._offset.y,
            };
        }
    },

    scrollToAndScale: {
        value: function(imagePoint, screenPoint, scaleChange) {
            this._scale *= scaleChange;

            var local = {
                    x: screenPoint.x - this._div.offsetLeft -
                            this._div.clientLeft,
                    y: screenPoint.y - this._div.offsetTop -
                            this._div.clientTop
            };

            var image = this._scene.imageSize;
            this.offset = {
                    x: local.x - (this._width - this._scene.width * this._scale) /
                            2 - this._scale * imagePoint.x,
                    y: local.y - (this._height - this._scene.height * this._scale) /
                            2 - this._scale * imagePoint.y
            };
        }
    },

    _onMouseWheel: {
        value: function(event) {
            if (this._mouseAction) return;

            event.preventDefault();
            event.stopPropagation();

            if (event.wheelDelta > 0) {
                this._scale *= View2D.SCALE_CHANGE;
                this._reposition();
            } else if (event.wheelDelta < 0) {
                this._scale /= View2D.SCALE_CHANGE;
                this._reposition();
            }
        }
    },

    _onMouseDown: {
        value: function(event) {
            event.preventDefault();
            document.body.focus();
            new View2D.MoveMouseAction().start(this, event);

            var spots = this.contentElement.querySelector('g#spots');
            if (event.target && event.target.parentElement == spots) {
                var index = Number(event.target.getAttribute('index'));
                var spot = this._scene.spots[index];
                this._spotLabel.showFor(spot);
            } else {
                this._spotLabel.hide();
            }
        }
    },

    _onDblClick: {
        value: function(event) {
            this.adjustOffset();
        }
    },

    _startAction: {
        value: function(state, event) {
            this._action = state;
        }
    },
});

View2D.MoveMouseAction = function() {
    this._view = null;
    this._imagePoint = null;
    this._handlers = {
            'mousemove': this._onMouseMove.bind(this),
            'mouseup': this._onMouseUp.bind(this),
            'mousewheel': this._onMouseWheel.bind(this),
    };
};

View2D.MoveMouseAction.prototype = Object.create(null, {
    _onMouseMove: {
        value: function(event) {
            this._onMoveAndScale(event, 1);
            event.stopPropagation();
            event.preventDefault();
        }
    },

    _onMouseUp: {
        value: function(event) {
            this.stop();
            event.stopPropagation();
            event.preventDefault();
        }
    },

    _onMouseWheel: {
        value: function(event) {
            if (event.wheelDelta > 0) {
                this._onMoveAndScale(event, View2D.SCALE_CHANGE);
            } else if (event.wheelDelta < 0) {
                this._onMoveAndScale(event, 1 / View2D.SCALE_CHANGE);
            }
            event.stopPropagation();
            event.preventDefault();
        }
    },

    _onMoveAndScale: {
        value: function(event, scaleFactor) {
            this._view.scrollToAndScale(
                      this._imagePoint,
                      {x: event.pageX, y: event.pageY},
                      scaleFactor);
        }
    },

    start: {
        value: function(view, event) {
            this._view = view;

            this._imagePoint = view.screenToImage(
                  {x: event.pageX, y: event.pageY});

            this._view._mouseAction = this;
            for (var i in this._handlers) {
                document.addEventListener(i, this._handlers[i], false);
            }
        }
    },

    stop: {
        value: function() {
            for (var i in this._handlers) {
                document.removeEventListener(i, this._handlers[i]);
            }
            this._view._reposition();
            this._view._mouseAction = null;
            this._view = null;
        }
    },
});