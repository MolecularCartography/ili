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
    
    Scene3DBase.prototype = Object.create(EventSource.prototype, {
        backgroundColor: {
            set: function(value) {
                this._backgroundColor = value;
                this._notify(Scene3DBase.Events.CHANGE);
            },
            get: function() {
                return this._backgroundColor;
            }
        },

        position: {
            get: function() {
                return this._scene.position.clone();
            }
        },

        render: {
            value: function(renderer, camera) {
                renderer.render(this._scene, camera);
            }
        },

    });




    return Scene3DBase;
});
