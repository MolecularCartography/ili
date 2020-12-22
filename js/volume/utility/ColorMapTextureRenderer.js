define(['three'], 
    function(THREE) {
        const colorMapSize = 10;

        function ColorMapTextureRenderer() {
            this._textureSize = colorMapSize;
            this._buffer = new Uint8Array(this._textureSize * 4);
            this._colorCache = new THREE.Color();

            const texture = new THREE.DataTexture(
                this._buffer, 
                this._textureSize, 
                1);
            texture.type = THREE.UnsignedByteType;
            texture.format = THREE.RGBAFormat;
            texture.minFilter = texture.magFilter = THREE.LinearFilter;
            texture.unpackAlignment = 1;
            texture.name = 'ColorMapTexture';

            this._texture = texture;
            this._isValid = false;
            this._colorMap = null;
        }

        ColorMapTextureRenderer.prototype = Object.create(null, {
            texture: {
                get: function() {
                    if (!this._isValid) {
                        const buffer = this._buffer;
                        const step = 1.0 / this._textureSize;
                        const color = this._colorCache;
                        for (let i = 0; i < this._textureSize; i++) {
                            const index = i * 4;
                            this._colorMap.map(color, step * i);
                            buffer[index] = Math.floor(color.r * 255.0);
                            buffer[index + 1] = Math.floor(color.g * 255.0);
                            buffer[index + 2] = Math.floor(color.b * 255.0);
                            buffer[index + 3] = 255; //Math.floor(color.a * 255.0);
                        }
                        this._texture.needsUpdate = true;
                        this._isValid = true;
                    }
                    return this._texture;
                }
            },

            update: {
                value: function(colorMap) {
                    this._isValid = false;
                    this._colorMap = colorMap;
                },
            }
        });

        return ColorMapTextureRenderer;
    }
);
