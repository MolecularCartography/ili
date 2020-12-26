define(
    ['rawvolumedata', 'indexer1d'],
    function(RawVolumeData, Indexer1D) {
        function VolumeNormalsProcessor(inputVolume, bounds, callback) {
            this._inputVolume = inputVolume;
            this._bounds = bounds;
            this._callback = callback;

            this._count =  inputVolume.lengthX * inputVolume.lengthY * inputVolume.lengthZ;
            const totalByteSize = this._count * 3;

            const result = new Uint8Array(totalByteSize);
            this._volume = new RawVolumeData.RawVolumeData(
                result,
                inputVolume.lengthX,
                inputVolume.lengthY,
                inputVolume.lengthZ,
                undefined);

            return this;
        }

        VolumeNormalsProcessor.prototype = {
            calculate: function() {
                const callback = this._callback;
                const inputVolume = this._inputVolume;
                const xLength = inputVolume.xLength;
                const yLength = inputVolume.yLength;
                const zLength = inputVolume.zLength;

                callback.setup(this._count);

                const inputIndexer = new Indexer1D(xLength, yLength, zLength);

                const result = this._volume.data;
                const resultIndexer = new Indexer1D(
                    inputVolume.xLength,
                    inputVolume.yLength,
                    inputVolume.zLength * 3);

                let computeIndex = 0;
                for (let xIndex = 0; xIndex < xLength; ++xIndex) {
                    for (let yIndex = 0; yIndex < yLength; ++yIndex) {
                        for (let zIndex = 0; zIndex < zLength; ++zIndex) {
                            const resultIndex = resultIndexer.get(xIndex, yIndex, zIndex * 3);
                            _calculateNormal(
                                inputVolume,
                                inputIndexer,
                                xIndex,
                                yIndex,
                                zIndex,
                                result,
                                resultIndex);
                            computeIndex++;
                            callback.notify(computeIndex);
                        }
                    }
                }

                callback.finished();
            },

            _calculateNormal: function(input, indexer, xIndex, yIndex, zIndex, output, outputIndex) {
                const leftXValue = input[indexer.getXClipped(xIndex - 1, yIndex, zIndex)];
                const rightXValue = input[indexer.getXClipped(xIndex + 1, yIndex, zIndex)];

                const leftYValue = input[indexer.getYClipped(xIndex, yIndex - 1, zIndex)];
                const rightYValue = input[indexer.getYClipped(xIndex, yIndex + 1, zIndex)];

                const leftZValue = input[indexer.getZClipped(xIndex, yIndex, zIndex - 1)];
                const rightZValue = input[indexer.getZClipped(xIndex, yIndex, zIndex + 1)];

                const xRange = rightXValue - leftXValue;
                const yRange = rightYValue - leftYValue;
                const zRange = rightZValue - leftZValue;

                const vectorLength = Math.sqrt(xRange * xRange + yRange * yRange + zRange * zRange);

                output[outputIndex] = this._mapRange(xRange, vectorLength, this._bounds);
                output[outputIndex + 1] = this._mapRange(yRange, vectorLength, this._bounds);
                output[outputIndex + 2] = this._mapRange(zRange, vectorLength, this._bounds);
            },

            _mapRange: function(range, length, bounds) {
                return this._map(range / length, 0, 1, bounds.min, bounds.max);
            },

            _map: function(value, minFrom, maxFrom, minTo, maxTo) {
                return minTo + (maxTo - minTo) * ((value - minFrom) / (maxFrom - minFrom));
            }
        };

        return VolumeNormalsProcessor;
    },
);
