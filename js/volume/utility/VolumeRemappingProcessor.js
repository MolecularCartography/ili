define(
    ['indexer1d'],
    function(Indexer1D) {

        function VolumeRemappingProcessor() {
            return this;
        }

        VolumeRemappingProcessor.prototype = Object.create(null, {
            calculate: {
                value: function(volume, buffer, opacityBuffer, cuboids, intensities, sizeScale, borderOpacity, isEllipsoidMode, callback) {
                    const result = new Float32Array(buffer);
                    result.fill(Number.POSITIVE_INFINITY); // Fake value that indicates that voxel should not be colored.

                    const opacityResult = new Uint8Array(opacityBuffer);
                    opacityResult.fill(0);

                    const inverseBorderOpacity = (1 - borderOpacity);
                    const lengthX = volume.lengthX;
                    const lengthY = volume.lengthY;
                    const lengthZ = volume.lengthZ;
                    const count = lengthX * lengthY * lengthZ;
                    const sizeX = volume.sizeX;
                    const sizeY = volume.sizeY;
                    const sizeZ = volume.sizeZ;
    
                    const xStep = this._getStep(lengthX, sizeX);
                    const yStep = this._getStep(lengthY, sizeY);
                    const zStep = this._getStep(lengthZ, sizeZ);
    
                    const resultIndexer = new Indexer1D(lengthX, lengthY, lengthZ);

                    let totalIterationCount = 0;

                    // accumulate cuboids data.
                    const computedCuboids = cuboids.map((cuboid) => {
                        const result = Object.create(null);
                        result.cuboid = cuboid;

                        const cuboidXSize = cuboid.sizeX * sizeScale;
                        const cuboidYSize = cuboid.sizeY * sizeScale;
                        const cuboidZSize = cuboid.sizeZ * sizeScale;
    
                        const xPivot = this._getPivot(cuboid.centerX, cuboidXSize);
                        const yPivot = this._getPivot(cuboid.centerY, cuboidYSize);
                        const zPivot = this._getPivot(cuboid.centerZ, cuboidZSize);
    
                        result.xStartIndex = Math.floor(this._getIndex(xPivot, xStep, lengthX));
                        result.yStartIndex = Math.floor(this._getIndex(yPivot, yStep, lengthY));
                        result.zStartIndex = Math.floor(this._getIndex(zPivot, zStep, lengthZ));
    
                        result.xEndIndex = Math.floor(this._getIndex(
                            this._getEndPosition(xPivot, cuboidXSize, sizeX),
                            xStep,
                            lengthX));
                        result.yEndIndex = Math.floor(this._getIndex(
                            this._getEndPosition(yPivot, cuboidYSize, sizeY),
                            yStep,
                            lengthY));
                        result.zEndIndex = Math.floor(this._getIndex(
                            this._getEndPosition(zPivot, cuboidZSize, sizeZ),
                            zStep,
                            lengthZ));

                        result.xCenterIndex = (result.xStartIndex + result.xEndIndex) / 2;
                        result.yCenterIndex = (result.yStartIndex + result.yEndIndex) / 2;
                        result.zCenterIndex = (result.zStartIndex + result.zEndIndex) / 2;
    
                        result.xSizeIndex = Math.abs(result.xEndIndex - result.xStartIndex);
                        result.ySizeIndex = Math.abs(result.yEndIndex - result.yStartIndex);
                        result.zSizeIndex = Math.abs(result.zEndIndex - result.zStartIndex);

                      
                       

                        if (isEllipsoidMode) {
                            result.xSizeIndexHalf = result.xSizeIndex / 2;
                            result.ySizeIndexHalf = result.ySizeIndex / 2;
                            result.zSizeIndexHalf = result.zSizeIndex / 2;

                            result.squaredRadiusX = result.xSizeIndexHalf * result.xSizeIndexHalf;
                            result.squaredRadiusY = result.ySizeIndexHalf * result.ySizeIndexHalf;
                            result.squaredRadiusZ = result.zSizeIndexHalf * result.zSizeIndexHalf;

                            result.volume = Math.floor(result.xSizeIndexHalf * result.ySizeIndexHalf * result.zSizeIndexHalf * Math.PI * (4 / 3)) * 2;
                        }
                        else {
                            result.volume = result.xSizeIndex * result.ySizeIndex * result.zSizeIndex;
                        }

                        totalIterationCount += result.volume;

                        result.halfSizeIndex = Math.sqrt(
                            result.xSizeIndex * result.xSizeIndex + 
                            result.ySizeIndex * result.ySizeIndex + 
                            result.zSizeIndex * result.zSizeIndex) / 2;
                        return result;
                    });

                    callback.setup(totalIterationCount);

                    let progressIndex = 0;
                    computedCuboids.forEach((computedCuboid, index) => {
                        for (let xIndex = computedCuboid.xStartIndex; xIndex <= computedCuboid.xEndIndex; ++xIndex) {
                            for (let yIndex = computedCuboid.yStartIndex; yIndex <= computedCuboid.yEndIndex; ++yIndex) {
                                for (let zIndex = computedCuboid.zStartIndex; zIndex <= computedCuboid.zEndIndex; ++zIndex) {  
                                    const rawIndex = resultIndexer.get(xIndex, yIndex, zIndex);

                                    const distanceXIndex = Math.abs(xIndex - computedCuboid.xCenterIndex);
                                    const distanceYIndex = Math.abs(yIndex - computedCuboid.yCenterIndex);
                                    const distanceZIndex = Math.abs(zIndex - computedCuboid.zCenterIndex);

                                    const squaredDistanceXIndex = distanceXIndex * distanceXIndex;
                                    const squaredDistanceYIndex = distanceYIndex * distanceYIndex;
                                    const squaredDistanceZIndex = distanceZIndex * distanceZIndex;
                                    
                                    let relativeDistance = null;
                                    if (isEllipsoidMode) {
                                        relativeDistance = 
                                            squaredDistanceXIndex / computedCuboid.squaredRadiusX + 
                                            squaredDistanceYIndex / computedCuboid.squaredRadiusY + 
                                            squaredDistanceZIndex / computedCuboid.squaredRadiusZ;  
                                    } else {
                                        const distance = Math.sqrt(squaredDistanceXIndex + squaredDistanceYIndex + squaredDistanceZIndex);
                                        relativeDistance = distance / computedCuboid.halfSizeIndex;
                                    }

                                    if (relativeDistance <= 1) {
                                        if (Number.isFinite(result[rawIndex])) {
                                            this._warnLossOfData(xIndex, yIndex, zIndex);
                                        }
                                        const intensity = intensities[index];
                                        result[rawIndex] = intensity;
                                        opacityResult[rawIndex] = (borderOpacity + (1 - relativeDistance) * inverseBorderOpacity) * 255.0;   
                                    }                                                     
    
                                    callback.notify(progressIndex++, totalIterationCount);
                                }
                            }
                        }            
                    });
                    callback.finished();
                }
            },

            _warnLossOfData: {
                value: function(xIndex, yIndex, zIndex) {
                    if (this.lossOfDataLogged) {
                        return;
                    }
                    console.warn(
                        'Loss of data. Rewriting non-empty intensity value at',
                        xIndex,
                        yIndex,
                        zIndex);
                    this.lossOfDataLogged = true;
                }
            },

            _getPivot: {
                value: function(center, size) {
                    return center - size / 2;
                }
            },

            _getStep: {
                value: function(length, size) {
                    return size / length;
                }
            },

            _getIndex: {
                value: function(position, step, limit) {
                    const index = position / step;
                    return Math.min(Math.max(index, 0), limit - 1);
                }
            },

            _getEndPosition: {
                value: function(startPosition, size, limit) {
                    const endPosition = startPosition + size;
                    if (endPosition > limit) {
                        this._warnOutOfLimits(endPosition, limit);
                        return limit;
                    } else {
                        return endPosition;
                    }
                }
            },

            _warnOutOfLimits: {
                value: function(endPosition, limit) {
                    if (this.outOfLimitsLogged) {
                        return;
                    }
                    console.warn(
                        'Cuboid is out of volume limits. Cuboid\'s end position: ' +
                        endPosition +
                        ' , Limit: ' +
                        limit);
                    this.outOfLimitsLogged = true;
                }
            }
        });

        return VolumeRemappingProcessor;
    },
);
