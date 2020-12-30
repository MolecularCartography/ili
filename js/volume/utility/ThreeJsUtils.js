'use strict';

define([
    'three'
],
function(THREE) {
    
    const ThreeJsUtils = {

        loadAsync: async function (loader, path, progressCallback) {
            console.log(loader);
            return new Promise((resolve, reject) => {
              loader.load(
                  path,
                  (successResponse) => {
                    resolve(successResponse);
                  },
                  progressCallback,
                  (errorResponse) => {
                    reject(errorResponse);
                  });
            });
        },

        createTexture3D: function(volumeData, type, format) {
            const texture = new THREE.DataTexture3D(
                volumeData.data,
                volumeData.lengthX,
                volumeData.lengthY,
                volumeData.lengthZ);
            texture.type = type;
            texture.format = format;
            texture.minFilter = texture.magFilter = THREE.LinearFilter;
            texture.unpackAlignment = 1;
            return texture;
        },

        createGenericTexture3D: function(volumeData) {
            const data = volumeData.data;
            let format = THREE.RedFormat;
            let type = THREE.FloatType;
            if (data) {
                if (data instanceof Float32Array) {
                    type = THREE.FloatType;
                } 
                else {
                    console.warn("The texture format is not supported yet.");
                    if (data instanceof Uint16Array) { 
                        type = THREE.UnsignedShortType;
                    } 
                    else if (data instanceof Int16Array) {
                        type = THREE.ShortType;
                    } 
                    else if (data instanceof Uint8Array) {
                        type = THREE.UnsignedByteType;
                    }
                    else if (data instanceof Int8Array) {
                        type = THREE.ByteType;
                    }
                }
            }   
            return ThreeJsUtils.createTexture3D(volumeData, type, format);
        },

        createFloatTexture3D: function(volumeData) {
            return ThreeJsUtils.createTexture3D(volumeData, THREE.FloatType, THREE.RedFormat);
        },

        createByteTexture3D: function(volumeData) {
            return ThreeJsUtils.createTexture3D(volumeData, THREE.UnsignedByteType, THREE.RedFormat);
        },

        createNormalTexture3D: function(volumeData) {
            return ThreeJsUtils.createTexture3D(volumeData, THREE.UnsignedByteType, THREE.RGBFormat);
        }

    };

    return ThreeJsUtils
});
