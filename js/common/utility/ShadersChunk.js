'use strict';

define(['three', 'utils', 'shaderloader'],
function (THREE, Utils, ShaderLoader) {

    function ShadersChunk(controller, headerFiles) {
        this._controller = controller;
        this._shaderLoader = new ShaderLoader();
        this._shadersMap = new Map();

        this._headerFiles = headerFiles;
        this._headerFilesPromise = !this._headerFiles || this._headerFiles.length === 0 ?
            Promise.resolve() :
            Promise.all(this._headerFiles.map((v) => this._loadShader(v)));
    }

    ShadersChunk.prototype = Object.create(null, {

        getShaderById: {
            value: function(id) {
                return new Promise((resolve, reject) => {
                    Promise.all([
                        this._headerFilesPromise,
                        this._loadShader(id)
                    ]).then((values) => {
                        resolve(values[1]);
                    });
                });    
            }
        },

        _loadShader: {
            value: function(originalId) {
                const id = `${originalId}.glsl`;
                return new Promise((resolve, reject) => {
                    const shader = this._shadersMap.get(id);
                    if (shader) {
                        resolve(shader);
                    }
                    const path = this._controller.extendPath(id);
                    if (!path) {
                        console.error(`Cannot find the shader id: ${id}`);
                        reject();
                    }
                    this._shaderLoader.load(
                        path,
                        (data) => {
                            console.info(`Shader has been loaded: ${id}.`);
                            THREE.ShaderChunk[originalId] = data;
                            this._shadersMap.set(originalId, data);
                            resolve(data);
                        },
                        (progress) => {},
                        (error) => {
                            console.error(`Failed to load shader: ${id}.`, error);
                            reject(error);
                        }
                    );
                });    
              
            }
        }
    });

    return ShadersChunk;
});
