'use strict';

define([
        'eventsource', 'volumespotscontroller', 'three'
    ],
    function(EventSource, VolumeSpotsController, THREE) {
        function VollumeScene3D(volumeSpotsController) {
            EventSource.call(this, VollumeScene3D.Events);

            this._volumeSpotsController = volumeSpotsController;
            this._scene = new THREE.Scene();
            this._frontLight = new THREE.PointLight(0xffffff, 1.5, 0);

            this._color = new THREE.Color('#575757');
            this._backgroundColor = new THREE.Color('black');

            this._opacity = 0.1;
            this._filling = 0.2;
            this._spacing = 0.3;
            this._shadowing = 0.4;


            this._adjustment = { x: 0, y: 0, z: 0, alpha: 0, beta: 0, gamma: 0 };


            this._axisHelper = new THREE.AxisHelper(20);
            this._scene.add(this._axisHelper);
        };

        VollumeScene3D.Events = {
            CHANGE: 'change',
        };


        VollumeScene3D._makeLightProperty = function(field) {
            return VollumeScene3D._makeProxyProperty(field, ['intensity'], function() {
                this._notify(VollumeScene3D.Events.CHANGE);
            });
        };

        VollumeScene3D._makeProxyProperty = function(field, properties, callback) {
            const proxyName = 'proxy' + field;
            this[proxyName] = null;
            return {
                get: function() {
                    if (this[proxyName]) return this[proxyName];
                    this[proxyName] = {};
                    for (let i = 0; i < properties.length; i++) {
                        Object.defineProperty(this[proxyName], properties[i], {
                            get: function(prop) {
                                return this[field][prop]
                            }.bind(this, properties[i]),

                            set: function(prop, value) {
                                this[field][prop] = value;
                                callback.call(this);
                            }.bind(this, properties[i])
                        });
                    }
                    return this[proxyName];
                },

                set: function(value) {
                    for (let i = 0; i < properties.length; i++) {
                        const prop = properties[i];
                        this[field][prop] = value[prop];
                    }
                    callback.call(this);
                }
            }
        };

        VollumeScene3D.prototype = Object.create(EventSource.prototype, {

            frontLight: VollumeScene3D._makeLightProperty('_frontLight'),

            color: {
                get: function() {
                    return '#' + this._color.getHexString();
                },

                set: function(value) {
                    const color = new THREE.Color(value);
                    if (!color.equals(this._color)) {
                        this._color.set(color);
                        this._onGeometryColorChange();
                    }
                }
            },

            opacity:{
                get: function() {
                    return this._opacity;
            },
                set:function (value){
                    console.log('opacity: ', value);
                }
            },
            filling:{
                get: function() {
                    return this._filling;
                },
                set:function (value){
                    console.log('filling: ', value);
                }
            },
            spacing:{
                get: function() {
                    return this._spacing;
                },
                set:function (value){
                    console.log('spacing: ', value);
                }
            },

            shadowing:{
                get: function() {
                    return this._shadowing;
                },
                set:function (value){
                    console.log('shadowing: ', value);
                }
            },

            backgroundColor: {
                get: function() {
                    return '#' + this._backgroundColor.getHexString();
                },

                set: function(value) {
                    console.log('background color: ', value);
                    const color = new THREE.Color(value);
                    if (!color.equals(this._backgroundColor)) {
                        this._backgroundColor.set(color);
                        this._notify(VollumeScene3D.Events.CHANGE);
                    }
                }
            },

            backgroundColorValue: {
                get: function() {
                    return this._backgroundColor;
                }
            },

            _onGeometryColorChange: {
                value: function () {
                    console.log('changing main color', this.color);
                }
            },


            axisHelper: {
                get: function() {
                    return -1 !== this._scene.children.indexOf(this._axisHelper);
                },

                set: function (value) {
                    console.log('axis helper: ', value);
                    if (value && !this.axisHelper) {
                        this._scene.add(this._axisHelper);
                    } else if (!value) {
                        this._scene.remove(this._axisHelper);
                    }
                    this._notify(VollumeScene3D.Events.CHANGE);
                }
            },

            adjustment: VollumeScene3D._makeProxyProperty('_adjustment', ['x', 'y', 'z', 'alpha', 'beta', 'gamma'],
                function() {
                console.log('adjustment:', this.adjustment);

                }),

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

            raycast: {
                value: function(raycaster) {
                    if (!this._mesh || !this._volumeSpotsController.spots || !this._mapping) {
                        return null;
                    }
                    const message = {
                        positions: this._mesh.geometry.attributes.position.array,
                        origin: new THREE.Vector3().copy(raycaster.ray.origin),
                        direction: new THREE.Vector3().copy(raycaster.ray.direction),
                        matrixWorld: new THREE.Matrix4().copy(this._mesh.matrixWorld),
                    };
                    const closestSpotIndeces = this._mapping.closestSpotIndeces;
                    const spots = this._volumeSpotsController.spots;
                    const worker = new Worker(require.toUrl('js/workers/Raycaster.js'));

                    const promise = new Promise(function (accept, reject) {
                        worker.onmessage = function (event) {
                            if (!event.data) {
                                return;
                            }
                            if (event.data.status === 'ready') {
                                worker.postMessage(message);
                            } else if (event.data.status === 'completed') {
                                worker.terminate();
                                const face = event.data;
                                let spotIndex = -1;
                                for (let i in (face || {})) {
                                    if (closestSpotIndeces[face[i]] >= 0) {
                                        spotIndex = closestSpotIndeces[face[i]];
                                        break;
                                    }
                                }
                                accept(spots[spotIndex]);
                            }
                        };
                        worker.onerror = function (event) {
                            console.log('Reycasting failed', event);
                            worker.terminate();
                            reject();
                        };
                    });

                    Object.defineProperty(promise, 'cancel', {
                        value: function() {
                            worker.terminate();
                        }
                    });

                    return promise;
                }
            },
        });

        return VollumeScene3D;
    });
