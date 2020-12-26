define(
    ['bounds', 'rawvolumedata', 'indexer1d'],
    function(Bounds, RawVolumeData, Indexer1D) {
        function VolumeRemappingProcessor(
            lengthX, lengthY,  lengthZ,
            sizeX, sizeY, sizeZ,
            cuboids, intensities,
            callback) {
            this._count = lengthX * lengthY * lengthZ;
            const result = new Float32Array(this._count);
            result.fill(Number.NaN); // Fake value that indicates that voxel should not be colored.
            this._volume = new RawVolumeData.SizedRawVolumeData(
                result,
                lengthX, lengthY, lengthZ,
                sizeX, sizeY, sizeZ);

            this._callback = callback;
            this._cuboids = cuboids;
            this._intensities = intensities;
            return this;
        }

        VolumeRemappingProcessor.prototype = {
            calculate: function() {
                const callback = this._callback;
                const cuboids = this._cuboids;
                const volume = this._volume;

                const lengthX = volume.lengthX;
                const lengthY = volume.lengthY;
                const lengthZ = volume.lengthZ;

                callback.setup(this._count);

                const sizeX = volume.sizeX;
                const sizeY = volume.sizeY;
                const sizeZ = volume.sizeZ;

                const xStep = this._getStep(lengthX, sizeX);
                const yStep = this._getStep(lengthY, sizeY);
                const zStep = this._getStep(lengthZ, sizeZ);

                const resultIndexer = new Indexer1D(lengthX, lengthY, lengthZ);
                const result = this._volume.data;

                const intensityBounds = Bounds.fromArray(this._intensities);
                this._volume.bounds = intensityBounds;

                cuboids.forEach((cuboid, index) => {
                    const xPivot = this._getXPivot(cuboid);
                    const yPivot = this._getYPivot(cuboid);
                    const zPivot = this._getZPivot(cuboid);

                    const xStartIndex = Math.floor(this._getIndex(xPivot, xStep, lengthX));
                    const yStartIndex = Math.floor(this._getIndex(yPivot, yStep, lengthY));
                    const zStartIndex = Math.floor(this._getIndex(zPivot, zStep, lengthZ));

                    const xEndIndex = Math.floor(this._getIndex(
                        this._getEndPosition(xPivot, cuboid.sizeX, sizeX),
                        xStep,
                        lengthX));
                    const yEndIndex = Math.floor(this._getIndex(
                        this._getEndPosition(yPivot, cuboid.sizeY, sizeY),
                        yStep,
                        lengthY));
                    const zEndIndex = Math.floor(this._getIndex(
                        this._getEndPosition(zPivot, cuboid.sizeZ, sizeZ),
                        zStep,
                        lengthZ));

                    for (let xIndex = xStartIndex; xIndex <= xEndIndex; ++xIndex) {
                        for (let yIndex = yStartIndex; yIndex <= yEndIndex; ++yIndex) {
                            for (let zIndex = zStartIndex; zIndex <= zEndIndex; ++zIndex) {
                                const intensity = this._intensities[index];
                                result[resultIndexer.get(xIndex, yIndex, zIndex)] = intensity;
                            }
                        }
                    }
                    callback.notify(index, this._count);
                });
                this.volume = this._volume;
                callback.finished();
                return result;
            },

            _getXPivot: function(cuboid) {
                return cuboid.centerX - cuboid.sizeX / 2;
            },

            _getYPivot: function(cuboid) {
                return cuboid.centerY - cuboid.sizeY / 2;
            },

            _getZPivot: function(cuboid) {
                return cuboid.centerZ - cuboid.sizeZ / 2;
            },

            _getStep: function(length, size) {
                return size / length;
            },

            _getIndex: function(position, step, limit) {
                return Math.min(position / step, limit - 1);
            },

            _getEndPosition: function(startPosition, size, limit) {
                const endPosition = startPosition + size;
                if (endPosition > limit) {
                    console.error(
                        'Cuboid is out of volume limits. Cuboid\'s end position: ' +
                        endPosition +
                        ' , Limit: ' +
                        limit);
                    return limit;
                } else {
                    return endPosition;
                }
            },

            _map(value, minFrom, maxFrom, minTo, maxTo) {
                return minTo + (maxTo - minTo) * ((value - minFrom) / (maxFrom - minFrom));
            }
        };

        return VolumeRemappingProcessor;
    },
);
