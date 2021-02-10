define(
    ['indexer1d', 'bounds'],
    function(Indexer1D, Bounds) {

        /**
         * defines constants required for normals packing.
         */
        const Uint8Max = 255;
        const minNormalized = -1;
        const maxNormalized = 1;
        const sizeNormalized = maxNormalized - minNormalized;

        function VolumeNormalsProcessor(normalizationBounds) {
            return this;
        }

        VolumeNormalsProcessor.prototype = Object.create(null, {
            calculate: {
                value: function(volume, buffer, callback) {
                   
                    this._zeroCounts = 0;

                    const result = new Uint8Array(buffer);

                    const inputVolume = volume;
                    const data = volume.data;
                    const xLength = inputVolume.lengthX;
                    const yLength = inputVolume.lengthY;
                    const zLength = inputVolume.lengthZ;
                    const count = xLength * yLength * zLength;
    
                    callback.setup(count);
    
                    const inputIndexer = new Indexer1D(xLength, yLength, zLength);

                    let computeIndex = 0;
                    for (let xIndex = 0; xIndex < xLength; ++xIndex) {
                        for (let yIndex = 0; yIndex < yLength; ++yIndex) {
                            for (let zIndex = 0; zIndex < zLength; ++zIndex) {
                                const resultIndex = inputIndexer.get(xIndex, yIndex, zIndex) * 3;
                                this._calculateNormal(
                                    data,
                                    inputIndexer,
                                    xIndex,
                                    yIndex,
                                    zIndex,
                                    result,
                                    resultIndex);
                                computeIndex++;
                                callback.notify(computeIndex, count);
                            }
                        }
                    }
                    callback.finished();
                }
            },

            _calculateNormal: {
                value: function(input, indexer, xIndex, yIndex, zIndex, output, outputIndex) {
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

                    const xRangeNormalized = xRange / vectorLength;
                    const yRangeNormalized = yRange / vectorLength;
                    const zRangeNormalized = zRange / vectorLength;

                    output[outputIndex] = this._mapRange(xRangeNormalized);
                    output[outputIndex + 1] = this._mapRange(yRangeNormalized);
                    output[outputIndex + 2] = this._mapRange(zRangeNormalized);
                }
            },

            _mapRange: {
                value: function(value) {
                    return ((value - minNormalized) / sizeNormalized) * Uint8Max;
                }
            },
        });

        return VolumeNormalsProcessor;
    },
);
