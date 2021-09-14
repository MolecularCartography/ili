'use strict';

define([
    'orbitcontrols', 'three', 'eventsource', 'actioncontroller'
],
function(OrbitControls, THREE, EventSource, actionController) {
    function View3DBase(group, div, camera, events) {
        EventSource.call(this, events ? Object.create(View3DBase.Events, events) : View3DBase.Events);
        this._group = group;
        this._div = div;
        this._left = 0;
        this._top = 0;
        this._width = 0;
        this._height = 0;
        this._camera = camera;
        this._camera.lookAt(this._group._scene.position);
        this._controls = new actionController(this._camera, this._div, this._group, this._requestDefaultView.bind(this));
        this._controls.autoRotate = false;
        this._controls.minZoom = 0.1;
        this._controls.maxZoom = 4.0;
        this._controls.autoRotateSpeed = 6.0;
        this._controls.update();
        this._controls.addEventListener('change', group.requestAnimationFrame.bind(group));
        this._controls.addEventListener('start', this._onOrbitStart.bind(this));
    }

    View3DBase.Events = {
        ASPECT_CHANGE: 'aspect-change'
    };

    View3DBase.prototype = Object.create(EventSource.prototype, {
        prepareUpdateLayout: {
            value: function() {
                this._left = this._div.offsetLeft;
                this._top = this._div.offsetTop;
                this._width = this._div.offsetWidth;
                this._height = this._div.offsetHeight;

                if (!this._width || !this._height) {
                    this._controls.autoRotate = false;
                }
            }
        },

        div: {
            get: function() {
                return this._div;
            }
        },

        finishUpdateLayout: {
            value: function() {
                const aspect = this.width / this.height;
                this._camera.aspect = aspect;
                this._notify(View3DBase.Events.ASPECT_CHANGE, aspect);
                this._camera.updateProjectionMatrix();
                this._controls.update();
            }
        },

        camera: {
            get: function() {
                return this._camera;
            }
        },

        left: {
            get: function() {
                return this._left;
            }
        },

        top: {
            get: function() {
                return this._top;
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

        setupRaycaster: {
            value: function(raycaster, pageX, pageY) {
                var x = pageX - this._left;
                var y = pageY - this._top;
                var coords = new THREE.Vector2(x * 2 / this._width - 1, 1 - y * 2 / this._height);
                raycaster.setFromCamera(coords, this._camera);
            }
        },

        projectPosition: {
            value: function(position) {
                var p = new THREE.Vector3().copy(position)
                p.project(this._camera);

                return {
                    x: this._width * (0.5 + p.x / 2),
                    y: this._height * (0.5 - p.y / 2),
                };
            }
        },

        onAnimationFrame: {
            value: function(now) {
                if (!this._controls.autoRotate) {
                    return;
                } else {
                    this._group.requestAnimationFrame();
                }
                this._controls.update();
            }
        },

        _onOrbitStart: {
            value: function() {
                this._controls.autoRotate = false;
            }
        },

        _updateControls: {
            value: function() {
                this._controls.update();
            }
        },

        toJSON: {
            value: function () {
                return {
                    camera_coords: this._camera.position.toArray(),
                    controls_target: this._camera.LookAt.toArray(),
                    camera_zoom: this._camera.zoom
                };
            }
        },

        fromJSON: {
            value: function (json) {
                this._camera.position.fromArray(json.camera_coords);
                this._camera.LookAt.fromArray(json.controls_target);
                this._camera.zoom = json.camera_zoom;
                this._controls.update();
                this._controls.defaultCameraProperties.defaultZoom = this._camera.zoom;
                this._controls.defaultCameraProperties.defaultPosition = this._camera.position.clone();
                this._controls.defaultCameraProperties.defaultLookAt = this._camera.LookAt
                this._controls.defaultCameraProperties.defaultLookUp = this._camera.up.clone();
            }
        }
    });

    return View3DBase;
});
