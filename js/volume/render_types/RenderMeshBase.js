'use strict';

define([
    'three', 'threejsutils', 'propertychangedmanager'
],
    function(THREE, ThreeUtils, PropertyChangedManager) {

        class RenderMeshBase {

            constructor(controller, eventMap, uniforms) {
                this.controller = controller;
                this.dataContainer = controller.dataContainer;
                this.shaderChunk = controller.shaderChunk;

                this.customMaterials = [];
                this._eventMap = eventMap;
                this._delayedUpdaters = new Map();
                this.uniforms = Object.assign({}, uniforms);
                
                this._propertyChangedManager = new PropertyChangedManager(this.dataContainer, eventMap, this);
    
                this.resetListener = () => this.reset();
                this.dataContainer.addEventListener('reset', this.resetListener);

                this.container = new THREE.Object3D();
            }

            dispose() {
                this._propertyChangedManager.dispose();
                this.dataContainer.removeEventListener('reset', this.resetListener);
            }

            reset() {

            }

            loadMaterial(vertexShaderId, fragmentShaderId, defaultMaterial = true) {
                const MaterialType = defaultMaterial ? THREE.ShaderMaterial : THREE.RawShaderMaterial;
                const fragmentShaderPromise = this.shaderChunk.getShaderById(fragmentShaderId);
                const vertexShaderPromise = this.shaderChunk.getShaderById(vertexShaderId);
                return new Promise((resolve, reject) => {
                    Promise.all([fragmentShaderPromise, vertexShaderPromise]).then((values) => {
                        const material = new MaterialType({
                            uniforms: this.uniforms,
                            fragmentShader: values[0],
                            vertexShader: values[1]
                        });
                        this.customMaterials.push(material);
                        resolve(material);
                        this.requestRedraw();
                    });
                });            
            }

            requestRedraw() {
                this.controller.requestRedraw();
            }

            invokeEventActions() {
                this._propertyChangedManager.invokeAllActions();
            }

            _setUniform(tag, value) {
                this.uniforms[tag].value = value;
            }

        }

        return RenderMeshBase;
    });