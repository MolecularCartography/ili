define(['three', 'lazytexturerenderer'], 
    function(THREE, LazyTextureRenderer) {
        
        function ColorMapTextureRenderer(textureSize) {
            this._colorCache = new THREE.Color();
            LazyTextureRenderer.call(this, textureSize, 'ColorMapTexture');
        }

        ColorMapTextureRenderer.prototype = Object.create(LazyTextureRenderer.prototype, {
            fillBuffer: {
                value: function(buffer, textureSize) {
                    const color = this._colorCache;
                    const step = 1 / textureSize;
                    for (let i = 0; i < textureSize; i++) {
                        const index = i * 4;
                        this.source.map(color, step * i);
                        buffer[index] = Math.floor(color.r * 255.0);
                        buffer[index + 1] = Math.floor(color.g * 255.0);
                        buffer[index + 2] = Math.floor(color.b * 255.0);
                        buffer[index + 3] = 255;
                    }
                }
            }
        });

        return ColorMapTextureRenderer;
    }
);
