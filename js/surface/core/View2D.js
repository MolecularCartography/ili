'use strict';

define([
    'three', 'surfacescene2d', 'spotlabel2d', 'surfacespotscontroller'
],
function(THREE, Scene2D, SpotLabel2D, SpotsController) {
    function View2D(workspace, div) {
        this._div = div;
        this._img = this._div.querySelector('img');
        this._canvas = this._div.querySelector('canvas');
        this._renderer = new THREE.WebGLRenderer({
            canvas: this._canvas,
            alpha: true,
            antialias: true,
        });
        this._renderer.setClearColor(0x000000, 0.0);
        this._width = 0;
        this._height = 0;
        this._scale = 1.0;
        this._mouseAction = null;
        this._offset = {x: 0, y: 0};
        this._pixelRatio = 1;
        this._spotsController = workspace.spotsController;
        this._scene = workspace.scene2d;
        this._spotLabel = new SpotLabel2D(this);

        this._uniforms = {
            imageSize: { type: 'v2', value: new THREE.Vector2() },
            canvasSize: { type: 'v2', value: new THREE.Vector2() },
            offset: { type: 'v2', value: new THREE.Vector2() },
            scale: { type: 'f', value: 1 },
            opacityDecay: { type: 'f', value: 1 },
        };
        this._material = new THREE.ShaderMaterial({
            uniforms: this._uniforms,
            vertexShader: View2D.VERTEX_SHADER,
            fragmentShader: View2D.FRAGMENT_SHADER,
            vertexColors: THREE.VertexColors,
            depthTest: true,
            transparent: true,
        });
        this._scene3js = new THREE.Scene();
        this._dummyCamera = new THREE.OrthographicCamera();

        this._scene.addEventListener(Scene2D.Events.IMAGE_CHANGE, this._onImageChange.bind(this));
        this._spotsController.addEventListener(SpotsController.Events.ATTR_CHANGE, this._onSpotsAttrChange.bind(this));
        this._spotsController.addEventListener(SpotsController.Events.SCALE_CHANGE, this._onSpotsAttrChange.bind(this));
        this._spotsController.addEventListener(SpotsController.Events.SPOTS_CHANGE, this._onSpotsUpdate.bind(this));
        this._spotsController.addEventListener(SpotsController.Events.INTENSITIES_CHANGE, this._onSpotsUpdate.bind(this));
        this._spotsController.addEventListener(SpotsController.Events.MAPPING_CHANGE, this._onSpotsUpdate.bind(this));

        this._div.addEventListener('wheel', this._onMouseWheel.bind(this));
        this._div.addEventListener('mousedown', this._onMouseDown.bind(this));
        this._div.addEventListener('dblclick', this._onDblClick.bind(this));
    }

    View2D.SCALE_CHANGE = 1.1;

    View2D.RecoloringMode = {
        USE_COLORMAP: 'colormap',
        NO_COLORMAP: 'no-colormap'
    };

    View2D.VERTEX_SHADER =
            'uniform vec2 imageSize;' +
            'uniform vec2 canvasSize;' +
            'uniform vec2 offset;' +
            'uniform float scale;' +
            'varying vec2 vUv;' +
            'varying vec3 vColor;' +
            'varying float vScale;' +
            'varying float vOpacity;' +
            'void main() {' +
                'vUv = uv;' +
                'vColor = color;' +
                'vScale = normal.x;' +
                'vOpacity = normal.y;' +
                'vec2 halfImageSize = imageSize * 0.5;' +
                'vec2 halfCanvasSize = canvasSize * 0.5;' +
                'vec2 normalizedPosition = (position.xy - halfImageSize);' +
                'vec2 coords = (normalizedPosition * scale + offset) / halfCanvasSize;' +

                'gl_Position = vec4(coords.x, -coords.y, 0.0, 1.0);' +
            '}';

    View2D.FRAGMENT_SHADER =
            'varying vec2 vUv;' +
            'varying vec3 vColor;' +
            'varying float vScale;' +
            'varying float vOpacity;' +
            'uniform float opacityDecay;' +
            'void main() {' +
                'float r = distance(vUv, vec2(0.0, 0.0));' +
                'if (r > vScale) discard;' +
                'gl_FragColor = vec4(vColor, (1.0 - opacityDecay * r / vScale) * vOpacity);' +
            '}';

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
                this._pixelRatio = window.devicePixelRatio;
            }
        },

        finishUpdateLayout: {
            value: function() {
                this.adjustOffset();

                // Make sure view looks good with zoom and on retina.
                this._renderer.setPixelRatio(this._pixelRatio);
                this._renderer.setSize(this._width, this._height);
                this._renderSpots();
            }
        },

        _onImageChange: {
            value: function() {
                this._img.src = this._scene.imageURL || '';
                this.adjustOffset();
            }
        },

        _onSpotsUpdate: {
            value: function() {
                this._recalculateSpots(View2D.RecoloringMode.USE_COLORMAP);
            }
        },

        _onSpotsAttrChange: {
            value: function () {
                this._recalculateSpots(View2D.RecoloringMode.NO_COLORMAP);
            }
        },

        _recalculateSpots: {
            value: function(recoloringMode) {
                var spots = this._spotsController.spots;
                while (this._scene3js.children.length) {
                    this._scene3js.remove(this._scene3js.children[0]);
                }
                if (!spots) {
                    this._renderSpots();
                    return;
                }

                spots = spots.filter(function(s) {
                    return !isNaN(s.intensity);
                });
                var spotsCount = spots.length;
                var positions = new Float32Array(spotsCount * 6 * 3);
                var uvs = new Float32Array(spotsCount * 6 * 2);
                var colors = new Float32Array(spotsCount * 6 * 3);
                var scales = new Float32Array(spotsCount * 6 * 3);
                var colorMap = this._spotsController.colorMap;
                var globalSpotsScale = this._spotsController.globalSpotScale;
                var globalSpotsOpacity = this._spotsController.globalSpotOpacity;

                function setPoint(index, dx, dy) {
                    var idx = i * 6 + index;
                    positions[idx * 3 + 0] = s.x + s.r * s.scale * dx * globalSpotsScale;
                    positions[idx * 3 + 1] = s.y + s.r * s.scale * dy * globalSpotsScale;
                    positions[idx * 3 + 2] = 0;
                    uvs[idx * 2 + 0] = dx * s.scale * globalSpotsScale;
                    uvs[idx * 2 + 1] = dy * s.scale * globalSpotsScale;
                    scales[idx * 3 + 0] = s.scale * globalSpotsScale;
                    scales[idx * 3 + 1] = s.opacity * globalSpotsOpacity;
                    scales[idx * 3 + 2] = 0;
                    colors[idx * 3 + 0] = color.r;
                    colors[idx * 3 + 1] = color.g;
                    colors[idx * 3 + 2] = color.b;
                }

                var useColorMap = recoloringMode == View2D.RecoloringMode.USE_COLORMAP;
                for (var i = 0; i < spotsCount; i++) {
                    var s = spots[i];
                    var color = null;
                    if (useColorMap) {
                        var color = new THREE.Color();
                        colorMap.map(color, s.intensity);
                        s.color = color;
                    } else {
                        color = s.color;
                    }
                    setPoint(0, 1, 1);
                    setPoint(1, 1, -1);
                    setPoint(2, -1, -1);
                    setPoint(3, -1, -1);
                    setPoint(4, -1, 1);
                    setPoint(5, 1, 1);
                }

                var geometry = new THREE.BufferGeometry();
                geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
                geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
                geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
                geometry.addAttribute('normal', new THREE.BufferAttribute(scales, 3));

                this._scene3js.add(new THREE.Mesh(geometry, this._material));
                this._renderSpots();
            }
        },

        scale: {
            get: function() {
                return this._scale;
            }
        },

        offset: {
            get: function() {
                return {x: this._offset.x, y: this._offset.y};
            },

            set: function(offset) {
                this._offset.x = offset.x;
                this._offset.y = offset.y;

                this._repositionImage();
                this._renderSpots();
            }
        },

        adjustOffset: {
            value: function(viewFactor) {
                viewFactor = viewFactor || 0.6;
                var width = this._scene.width * this._scale;
                var height = this._scene.height * this._scale;
                var viewWidth = this._width * viewFactor;
                var viewHeight = this._height * viewFactor;
                if (viewWidth > width * this._scale) {
                    this._offset.x = 0;
                } else {
                    var max = Math.ceil((width - viewWidth) * 0.5);
                    this._offset.x = Math.max(-max, Math.min(max, this._offset.x));
                }
                if (viewHeight > height) {
                    this._offset.y = 0;
                } else {
                    var max = Math.ceil((height - viewHeight) * 0.5);
                    this._offset.y = Math.max(-max, Math.min(max, this._offset.y));
                }
                this._renderSpots();
                this._repositionImage();
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

        _repositionImage: {
            value: function() {
                var x = (this._width - this._scene.width * this._scale) / 2 +
                        this._offset.x;
                var y = (this._height - this._scene.height * this._scale) / 2 +
                        this._offset.y;
                var style = this._img.style;
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

        _renderSpots: {
            value: function() {
                var u = this._uniforms;
                u.canvasSize.value.set(this._width, this._height);
                u.imageSize.value.set(this._scene.width, this._scene.height);
                u.offset.value.copy(this._offset);
                u.scale.value = this._scale;
                u.opacityDecay.value = 1 - this._spotsController.spotBorder;
                this._renderer.render(this._scene3js, this._dummyCamera);
            }
        },

        _onMouseWheel: {
            value: function(event) {
                if (this._mouseAction) return;

                event.preventDefault();
                event.stopPropagation();

                if (event.deltaY < 0) {
                    this._scale *= View2D.SCALE_CHANGE;
                    this.adjustOffset();
                } else if (event.deltaY > 0) {
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

                this._spotLabel.hide();
                var parentRect = this._div.getBoundingClientRect();
                var point = this.screenToImage({x: event.pageX - parentRect.left, y: event.pageY - parentRect.top});
                this._scene.findSpot(point).then(function(spot) {
                    if (spot) {
                        this._spotLabel.showFor(spot);
                    }
                }.bind(this));
            }
        },

        _onDblClick: {
            value: function(event) {
                this.adjustOffset(1.0);
            }
        },

        _startAction: {
            value: function(state, event) {
                this._action = state;
            }
        },

        toJSON: {
            value: function () {
                return {
                    scale: this._scale,
                    offset: this._offset
                };
            }
        },

        fromJSON: {
            value: function (json) {
                this._scale = json.scale;
                this.offset = json.offset;
            }
        }
    });

    View2D.MoveMouseAction = function() {
        this._view = null;
        this._imagePoint = null;
        this._handlers = {
                'mousemove': this._onMouseMove.bind(this),
                'mouseup': this._onMouseUp.bind(this),
                'wheel': this._onMouseWheel.bind(this),
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
                if (event.deltaY < 0) {
                    this._onMoveAndScale(event, View2D.SCALE_CHANGE);
                } else if (event.deltaY > 0) {
                    this._onMoveAndScale(event, 1 / View2D.SCALE_CHANGE);
                }
                event.stopPropagation();
                event.preventDefault();
            }
        },

        _onMoveAndScale: {
            value: function(event, scaleFactor) {
                this._view.scrollToAndScale(this._imagePoint, {x: event.pageX, y: event.pageY}, scaleFactor);
            }
        },

        start: {
            value: function(view, event) {
                this._view = view;

                this._imagePoint = view.screenToImage({x: event.pageX, y: event.pageY});

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

    return View2D;
});
