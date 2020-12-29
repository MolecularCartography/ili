define(
    ['indexer1d', 'bounds'],
    function(Indexer1D, Bounds) {

        const NormalizationBounds = new Bounds(0, 255);

        function VolumeNormalsProcessor() {
            return this;
        }

        VolumeNormalsProcessor.prototype = {
            calculate: function(volume, buffer, callback) {
                const bounds = NormalizationBounds;
                const inputVolume = volume;
                const xLength = inputVolume.xLength;
                const yLength = inputVolume.yLength;
                const zLength = inputVolume.zLength;
                const count = xLength * yLength * zLength;

                callback.setup(count);

                const inputIndexer = new Indexer1D(xLength, yLength, zLength);

                const result = new Uint8Array(buffer);
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
                                resultIndex,
                                bounds);
                            computeIndex++;
                            callback.notify(computeIndex, count);
                        }
                    }
                }

                callback.finished();
            },

            _calculateNormal: function(input, indexer, xIndex, yIndex, zIndex, output, outputIndex, bounds) {
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

                output[outputIndex] = this._mapRange(xRange, vectorLength, bounds);
                output[outputIndex + 1] = this._mapRange(yRange, vectorLength, bounds);
                output[outputIndex + 2] = this._mapRange(zRange, vectorLength, bounds);
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
