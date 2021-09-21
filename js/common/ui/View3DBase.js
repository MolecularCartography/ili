'use strict';

define([
    'three', 'eventsource', 'actioncontroller', 'camerahelper', 'workspacebase'
],
function(THREE, EventSource, ActionController, CameraHelper, WorkspaceBase) {

    const AnimationDuration = 250;

    function View3DBase(workspace, group, div, camera, orientationWidget, projectionInfo, events) {
        EventSource.call(this, events ? Object.create(View3DBase.Events, events) : View3DBase.Events);
        CameraHelper.decorateCamera(camera, group._animationController);
        this._workspace = workspace;
        this._orientationWidget = orientationWidget;
        this._group = group;
        this._projectionInfo = projectionInfo;
        this._div = div;
        this._left = 0;
        this._top = 0;
        this._width = 0;
        this._height = 0;
        this._camera = camera;
        this._animationController = group._animationController;
        this._spotLabel = group._spotLabel;

        // specify orientation widget rotation callback.
        this._orientationWidget.initialize((eyeFixed) => {
            this._controls.stopAnimation();
            const lookAt = this._boundingBox ? this._boundingBox.getCenter(new THREE.Vector3()) : new THREE.Vector3();
            CameraHelper.rotateByOrientationWidget(
                this._camera, 
                lookAt, 
                eyeFixed, 
                AnimationDuration)
        });

        // create action controller responsible for interactivity.
        this._controls = new ActionController(this._camera, this._div, {
            spotLabel: this._spotLabel,
            setAnimationLoop: (action) => this._animationController.setAnimationLoop(action),
            requestRedraw: () => this._animationController.requestRedraw(),
            setDefaultView: () => this.setDefaultView(AnimationDuration)
        });

        // add data bounds change functionality.
        this._workspace.addEventListener(WorkspaceBase.Events.BOUNDS_CHANGE, () => {
            this._jsonCameraProperties = null;
            this._boundingBox = this._workspace.getDataBoundingBox();
            this.setDefaultView();
        });
    }

    View3DBase.Events = {
        ASPECT_CHANGE: 'aspect-change'
    };

    View3DBase.prototype = Object.create(EventSource.prototype, {

        setDefaultView: {
            value: function(duration) {
                // set json settings if presented.
                this._controls.stopAnimation();
                if (this._jsonCameraProperties) {
                    this._camera.setup(this._jsonCameraProperties, duration);
                    return;
                } 

                // try to set new default view.
                if (!this._boundingBox) {
                    return;
                }
                this._fitAspect();
                CameraHelper.setDefaultView(
                    this._camera, 
                    this._boundingBox,
                    this._projectionInfo.horizontalIndex, 
                    this._projectionInfo.verticalIndex,
                    duration);
                this._animationController.requestRedraw();
            }
        },

        prepareUpdateLayout: {
            value: function() {
                this._controls.stopAnimation();
                this._left = this._div.offsetLeft;
                this._top = this._div.offsetTop;
                this._width = this._div.offsetWidth;
                this._height = this._div.offsetHeight;
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
                this._fitAspect(); 
                this._notify(View3DBase.Events.ASPECT_CHANGE, aspect);
            }
        },

        orientationWidget: {
            get: function() {
                return this._orientationWidget;
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
                    camera_target: this._camera.getLookAt().toArray(),
                    camera_up: this.camera.up.toArray(),
                    camera_zoom: this._camera.zoom
                };
            }
        },

        fromJSON: {
            value: function (json) {
                this._camera.position.fromArray(json.camera_coords);
                this._camera.lookAt(new THREE.Vector3().fromArray(json.controls_target));
                this._camera.up.fromArray(json.camera_up);
                this._camera.zoom = json.camera_zoom;
                this._jsonCameraProperties = {
                    zoom: this._camera.zoom,
                    position: this._camera.position.clone(),
                    lookAt: this._camera.getLookAt(),
                    lookUp: this._camera.up.clone()
                };
            }
        },

        _fitAspect: {
            value: function() {
                if (!this._boundingBox) {
                    return;
                }
                CameraHelper.fitAspect(this._camera, this._boundingBox, 
                    this._projectionInfo.horizontalIndex, 
                    this._projectionInfo.verticalIndex);
            }
        }
    });

    return View3DBase;
});
