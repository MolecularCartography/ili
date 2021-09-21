'use strict';

define([
    'eventsource', 'spotscontrollerbase', 'three', 'camerahelper'
],
function(EventSource, SpotsController, THREE, CameraHelper) {
    function Scene3DBase(spotsController) {
        EventSource.call(this, Scene3DBase.Events);

        this._spotsController = spotsController;
        this._scene = new THREE.Scene();
        this._meshContainer = new THREE.Object3D();
   
        this._backgroundColor = new THREE.Color('black');
        this._mapping = null;

        this._scene.add(this._meshContainer);
    };

    Scene3DBase.Events = {
        CHANGE: 'change',
    };

    Scene3DBase.RecoloringMode = {
        USE_COLORMAP: 'colormap',
        NO_COLORMAP: 'no-colormap'
    };

    Scene3DBase.prototype = Object.create(EventSource.prototype, {
        backgroundColor: {
            get: function() {
                return '#' + this._backgroundColor.getHexString();
            },

            set: function(value) {
                var color = new THREE.Color(value);
                if (!color.equals(this._backgroundColor)) {
                    this._backgroundColor.set(color);
                    this._notify(Scene3DBase.Events.CHANGE);
                }
            }
        },

        backgroundColorValue: {
            get: function() {
                return this._backgroundColor;
            }
        },

        refreshSpots: {
            value: function () {
                this._recolor(Scene3DBase.RecoloringMode.NO_COLORMAP);
                this._notify(Scene3DBase.Events.CHANGE);
            }
        },

        position: {
            get: function() {
                return this._scene.position.clone();
            }
        },

        render: {
            value: function(renderer, camera, orientationWidget) {
                renderer.render(this._scene, camera);
                orientationWidget.transform = `translateZ(-300px)  ${CameraHelper.getCameraCSSMatrix(camera.matrixWorldInverse)}`;
            }
        },

    });




    return Scene3DBase;
});
