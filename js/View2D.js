'use strict';

function View2D(model, svg) {
    this._svg = svg;
    this._contentElement = svg.querySelector('#contentElement');
    this._width = 0;
    this._height = 0;
    this._scale = 1.0;
    this._mouseAction = null;
    this._offset = {x: 0, y: 0};
    this._scene = model.scene2d;

    this._scene.view = this;

    this._svg.addEventListener('mousewheel', this._onMouseWheel.bind(this));
    this._svg.addEventListener('mousedown', this._onMouseDown.bind(this));
}

View2D.SCALE_CHANGE = 1.2;

View2D.prototype = Object.create(null, {
    prepareUpdateLayout: {
        value: function() {
            this._width = this._svg.clientWidth;
            this._height = this._svg.clientHeight;
        }
    },

    contentElement: {
        get: function() {
            return this._contentElement;
        }
    },

    finishUpdateLayout: {
        value: function() {
            this.adjustOffset();
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
            this._contentElement.setAttribute('transform',
                    'translate(' + x + ', ' + y + ') scale(' + this._scale +
                            ')');
        }
    },

    screenToImage: {
        value: function(point) {
            var local = {
                    x: point.x - this._svg.offsetLeft - this._svg.clientLeft,
                    y: point.y - this._svg.offsetTop - this._svg.clientTop
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

    scrollToAndScale: {
        value: function(imagePoint, screenPoint, scaleChange) {
            this._scale *= scaleChange;

            var local = {
                    x: screenPoint.x - this._svg.offsetLeft -
                            this._svg.clientLeft,
                    y: screenPoint.y - this._svg.offsetTop -
                            this._svg.clientTop
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
                this.adjustOffset();
            } else if (event.wheelDelta < 0) {
                this._scale /= View2D.SCALE_CHANGE;
                this.adjustOffset();
            }
        }
    },

    _onMouseDown: {
        value: function(event) {
            event.preventDefault();
            document.body.focus();
            new View2D.MoveMouseAction().start(this, event);
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
            this._view.adjustOffset();
            this._view._mouseAction = null;
            this._view = null;
        }
    },
});