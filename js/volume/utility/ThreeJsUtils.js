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
