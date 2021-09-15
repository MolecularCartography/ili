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
            value: function(renderer, camera, orientationWidget) {
                this._frontLight.position.set(camera.position.x, camera.position.y, camera.position.z);
                renderer.render(this._scene, camera);
                orientationWidget.transform = `translateZ(-300px)  ${this.getCameraCSSMatrix(camera.matrixWorldInverse)}`;
            }
        },
        getCameraCSSMatrix:{
            value: function(matrix) {
                let elements = matrix.elements;
                return 'matrix3d(' +
                    epsilon(elements[0]) + ',' +
                    epsilon(-elements[1]) + ',' +
                    epsilon(elements[2]) + ',' +
                    epsilon(elements[3]) + ',' +
                    epsilon(elements[4]) + ',' +
                    epsilon(-elements[5]) + ',' +
                    epsilon(elements[6]) + ',' +
                    epsilon(elements[7]) + ',' +
                    epsilon(elements[8]) + ',' +
                    epsilon(-elements[9]) + ',' +
                    epsilon(elements[10]) + ',' +
                    epsilon(elements[11]) + ',' +
                    0 + ',' +
                    0 + ',' +
                    0 + ',' +
                    1 +
                    ')';
            }
        }
    });


function epsilon( value ) {
    return Math.abs( value ) < 1e-10 ? 0 : value;}

    return Scene3DBase;
});
