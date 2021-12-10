define(
    ['rawvolumedata'],
    function(RawVolumeData) {

        function VolumeTextureCache(activator) {
            this._activator = activator;
            return this;
        }

        VolumeTextureCache.prototype = Object.create(null, {
            
            texture: {
                get: function() {
                    return this._texture;
                }
            },

            setup: {
                value: function(volume, buffer) {
                    if (this._volume != volume) {
                        if (this._texture) {
                            this._texture.dispose();
                        }
                        this._volume = volume;
                        this._texture = this._activator(volume);
                    }
                    else if (volume.data) {
                        this._texture.image.data = volume.data;
                        this._texture.needsUpdate = true;
                    }   
                }
            }

        });

        function VolumeDataCache(sizeActivator, bufferActivator) {
            this._sizeActivator = sizeActivator;
            this._bufferActivator = bufferActivator;
            return this;
        }

        VolumeDataCache.prototype = Object.create(null, {
            buffer: {
                get: function() {
                    return this.volume.data.buffer;
                }
            },

            volume: {
                get: function() {
                    return this._volume;
                }
            },

            fill: {
                value: function(value) {
                    this._volume.data.fill(value);
                }
            },

            
            updateBuffer: {
                value: function(buffer) {
                    this._volume.data = this._bufferActivator(buffer);
                }
            },


            tryResize: {
                value: function(lengthX, lengthY, lengthZ, sizeX, sizeY, sizeZ) {
                    sizeX = sizeX ? sizeX : lengthX;
                    sizeY = sizeY ? sizeY : lengthY;                 
                    sizeZ = sizeZ ? sizeZ : lengthZ;

                    const newCount = lengthX * lengthY * lengthZ;
                    if (newCount != this._count) {
                        this._count = newCount;
                        const result = this._sizeActivator(this._count);
                        this._volume = new RawVolumeData.SizedRawVolumeData(
                            result,
                            lengthX, lengthY, lengthZ,
                            sizeX, sizeY, sizeZ);
                        return true;
                    } else {
                        this._volume.sizeX = sizeX;
                        this._volume.sizeY = sizeY;
                        this._volume.sizeZ = sizeZ;
                        return false;
                    }
                },
            },

        });

        return { VolumeTextureCache, VolumeDataCache };
    },
);
