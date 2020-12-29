define(
    ['bounds', 'rawvolumedata', 'indexer1d'],
    function(Bounds, RawVolumeData, Indexer1D) {
        function VolumeRemappingProcessor(
            lengthX, lengthY,  lengthZ,
            sizeX, sizeY, sizeZ,
            cuboids, intensities, cuboidsSizeScale,
            callback) {
            this._count = lengthX * lengthY * lengthZ;
            this._cuboidsSizeScale = cuboidsSizeScale;
            const result = new Float32Array(this._count);
            result.fill(Number.POSITIVE_INFINITY); // Fake value that indicates that voxel should not be colored.
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
                    const cuboidXSize = cuboid.sizeX * this._cuboidsSizeScale;
                    const cuboidYSize = cuboid.sizeY * this._cuboidsSizeScale;
                    const cuboidZSize = cuboid.sizeZ * this._cuboidsSizeScale;

                    const xPivot = this._getPivot(cuboid.centerX, cuboidXSize);
                    const yPivot = this._getPivot(cuboid.centerY, cuboidYSize);
                    const zPivot = this._getPivot(cuboid.centerZ, cuboidZSize);

                    const xStartIndex = Math.floor(this._getIndex(xPivot, xStep, lengthX));
                    const yStartIndex = Math.floor(this._getIndex(yPivot, yStep, lengthY));
                    const zStartIndex = Math.floor(this._getIndex(zPivot, zStep, lengthZ));

                    const xEndIndex = Math.floor(this._getIndex(
                        this._getEndPosition(xPivot, cuboidXSize, sizeX),
                        xStep,
                        lengthX));
                    const yEndIndex = Math.floor(this._getIndex(
                        this._getEndPosition(yPivot, cuboidYSize, sizeY),
                        yStep,
                        lengthY));
                    const zEndIndex = Math.floor(this._getIndex(
                        this._getEndPosition(zPivot, cuboidZSize, sizeZ),
                        zStep,
                        lengthZ));

                    for (let xIndex = xStartIndex; xIndex <= xEndIndex; ++xIndex) {
                        for (let yIndex = yStartIndex; yIndex <= yEndIndex; ++yIndex) {
                            for (let zIndex = zStartIndex; zIndex <= zEndIndex; ++zIndex) {
                                const intensity = this._intensities[index];
                                const resultIndex = resultIndexer.get(xIndex, yIndex, zIndex);
                                if (!isNaN(result[resultIndex])) {
                                    this._warnLossOfData(xIndex, yIndex, zIndex);
                                }
                                result[resultIndex] = intensity;
                            }
                        }
                    }
                    callback.notify(index, this._count);
                });
                this.volume = this._volume;
                callback.finished();
                return result;
            },

            _warnLossOfData: function(xIndex, yIndex, zIndex) {
                if (this.lossOfDataLogged) {
                    return;
                }
                console.warn(
                    'Loss of data. Rewriting non-empty intensity value at',
                    xIndex,
                    yIndex,
                    zIndex);
                this.lossOfDataLogged = true;
            },

            _getPivot: function(center, size) {
                return center - size / 2;
            },

            _getStep: function(length, size) {
                return size / length;
            },

            _getIndex: function(position, step, limit) {
                const index = position / step;
                return Math.min(Math.max(index, 0), limit - 1);
            },

            _getEndPosition: function(startPosition, size, limit) {
                const endPosition = startPosition + size;
                if (endPosition > limit) {
                    this._warnOutOfLimits(endPosition, limit);
                    return limit;
                } else {
                    return endPosition;
                }
            },

            _warnOutOfLimits: function(endPosition, limit) {
                if (this.outOfLimitsLogged) {
                    return;
                }
                console.warn(
                    'Cuboid is out of volume limits. Cuboid\'s end position: ' +
                    endPosition +
                    ' , Limit: ' +
                    limit);
                this.outOfLimitsLogged = true;
            },

            _map(value, minFrom, maxFrom, minTo, maxTo) {
                return minTo + (maxTo - minTo) * ((value - minFrom) / (maxFrom - minFrom));
            }
        };

        return VolumeRemappingProcessor;
    },
);
