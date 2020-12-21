'use strict';

define([
    'three'
],
function(THREE) {
    
    const ThreeJsUtils = {

        createTexture3D: function(volumeData, type, format) {
            const texture = new three.DataTexture3D(
                volumeData.data,
                volumeData.lengthX,
                volumeData.lengthY,
                volumeData.lengthZ);
            texture.type = type;
            texture.format = format;
            texture.minFilter = texture.magFilter = three.LinearFilter;
            texture.unpackAlignment = 1;
            return texture;
        },

        createFloatTexture3D: function(volumeData) {
            return ThreeJsUtils.createTexture3D(volumeData, THREE.FloatType, THREE.RedFormat);
        },

        createNormalTexture3D: function(volumeData) {
            return ThreeJsUtils.createTexture3D(volumeData, THREE.FloatType, THREE.RedFormat);
        }

    };

    return ThreeJsUtils
});
