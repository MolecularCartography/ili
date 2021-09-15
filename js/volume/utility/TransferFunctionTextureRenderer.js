define(['three', 'lazytexturerenderer'], 
    function(THREE, LazyTextureRenderer) {
        
        function TransferFunctionTextureRenderer(textureSize) {
            LazyTextureRenderer.call(this, textureSize, 'TransferFunctionTexture');
        }

        TransferFunctionTextureRenderer.prototype = Object.create(LazyTextureRenderer.prototype, {
            fillBuffer: {
                value: function(buffer, textureSize) {
                    const step = 1.0 / textureSize;
                    for (let i = 0; i < textureSize; i++) {
                        const index = i * 4;
                        buffer[index] = 0;
                        buffer[index + 1] = 0;
                        buffer[index + 2] = 0;
                        buffer[index + 3] = this.source.map(step * i) * 255.0;
                    }
                }
            }
        });

        return TransferFunctionTextureRenderer;
    }
);
