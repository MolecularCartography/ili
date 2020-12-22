'use strict';

define([
    'eventsource', 'spotscontrollerbase', 'three', 
],
function(EventSource, SpotsController, THREE) {
    function Scene3DBase(spotsController) {
        EventSource.call(this, Scene3DBase.Events);

        this._spotsController = spotsController;
        this._scene = new THREE.Scene();
        this._meshContainer = new THREE.Object3D();
   
        this._backgroundColor = new THREE.Color('black');
        this._mapping = null;

        this._spotsController.addEventListener(SpotsController.Events.SPOTS_CHANGE, this._onSpotsChange.bind(this));
        this._spotsController.addEventListener(SpotsController.Events.ATTR_CHANGE, this._onAttrChange.bind(this));
        this._spotsController.addEventListener(SpotsController.Events.INTENSITIES_CHANGE, this._onIntensitiesChange.bind(this));
        this._spotsController.addEventListener(SpotsController.Events.MAPPING_CHANGE, this._onMappingChange.bind(this));

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
            value: function(renderer, camera) {
                this._frontLight.position.set(camera.position.x, camera.position.y, camera.position.z);
                renderer.render(this._scene, camera);
            }
        },
    });

    return Scene3DBase;
});
