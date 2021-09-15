define(['three'], 
    function(THREE) {
        
        function LazyTextureRenderer(textureSize, textureName) {
            this._textureSize = textureSize;
            this._buffer = new Uint8Array(this._textureSize * 4);

            const texture = new THREE.DataTexture(
                this._buffer, 
                this._textureSize, 
                1);
            texture.type = THREE.UnsignedByteType;
            texture.format = THREE.RGBAFormat;
            texture.minFilter = texture.magFilter = THREE.LinearFilter;
            texture.unpackAlignment = 1;
            texture.name = textureName;

            this._texture = texture;
            this._isValid = false;
            this._source = null;
        }

        LazyTextureRenderer.prototype = Object.create(null, {
            dispose: {
                value: function() {
                    this._texture.dispose();
                }
            },

            texture: {
                get: function() {
                    if (!this._isValid) {
                        this.fillBuffer(this._buffer, this._textureSize);
                        this._texture.needsUpdate = true;
                        this._isValid = true;
                    }
                    return this._texture;
                }
            },

            invalidate: {
                value: function() {
                    this._isValid = false;
                }
            },

            source: {
                get: function() {
                    return this._source;
                },
                set: function(source) {
                    if (this._source === source) {
                        return;
                    }  
                    this._source = source;
                    this.invalidate();
                }
            }
        });

        return LazyTextureRenderer;
    }
);
