define(
    ['indexer1d'],
    function(Indexer1D) {

        function VolumeRemappingProcessor() {
            return this;
        }

        VolumeRemappingProcessor.prototype = Object.create(null, {

            calculateOpacity: {
                value: function(volume, opacityBuffer, cuboids, intensities, sizeScale, borderOpacity, callback) {
                    const result = new Float32Array(buffer);
                    result.fill(Number.POSITIVE_INFINITY); // Fake value that indicates that voxel should not be colored.

                    const opacityResult = new Uint8Array(opacityBuffer);
                    opacityResult.fill(0);

                    const lengthX = volume.lengthX;
                    const lengthY = volume.lengthY;
                    const lengthZ = volume.lengthZ;
                    const count = lengthX * lengthY * lengthZ;
                    const sizeX = volume.sizeX;
                    const sizeY = volume.sizeY;
                    const sizeZ = volume.sizeZ;
    
                    const totalCount = count * cuboids.length;
                    callback.setup(totalCount);
    
                    const xStep = this._getStep(lengthX, sizeX);
                    const yStep = this._getStep(lengthY, sizeY);
                    const zStep = this._getStep(lengthZ, sizeZ);
    
                    const resultIndexer = new Indexer1D(lengthX, lengthY, lengthZ);
          
                    let progressIndex = 0;
                    cuboids.forEach((cuboid, index) => {
                        const cuboidXSize = cuboid.sizeX * sizeScale;
                        const cuboidYSize = cuboid.sizeY * sizeScale;
                        const cuboidZSize = cuboid.sizeZ * sizeScale;
    
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
    
                        const xSizeIndex = Math.abs(xEndIndex - xStartIndex);
                        const ySizeIndex = Math.abs(yEndIndex - yStartIndex);
                        const zSizeIndex = Math.abs(zEndIndex - zStartIndex);
                        const sizeIndex = Math.sqrt(xSizeIndex * xSizeIndex + ySizeIndex * ySizeIndex + zSizeIndex * zSizeIndex);
                        
                        for (let xIndex = xStartIndex; xIndex <= xEndIndex; ++xIndex) {
                            for (let yIndex = yStartIndex; yIndex <= yEndIndex; ++yIndex) {
                                for (let zIndex = zStartIndex; zIndex <= zEndIndex; ++zIndex) {  
                                    const rawIndex = resultIndexer.get(xIndex, yIndex, zIndex);
    
                                    const intensity = intensities[index];
                                    if (Number.isFinite(result[rawIndex])) {
                                        this._warnLossOfData(xIndex, yIndex, zIndex);
                                    }
                                    result[rawIndex] = intensity;
    
                                    const distanceXIndex = Math.abs(xIndex - xPivot);
                                    const distanceYIndex = Math.abs(yIndex - yPivot);
                                    const distanceZIndex = Math.abs(zIndex - zPivot);
                                    const distance = Math.sqrt(
                                        distanceXIndex * distanceXIndex + 
                                        distanceYIndex * distanceYIndex + 
                                        distanceZIndex * distanceZIndex);
                                    const relativeDistance = distance / sizeIndex;
                                    opacityResult[rawIndex] = relativeDistance * 255.0 * borderOpacity;

                                    callback.notify(progressIndex++, totalCount);
                                }
                            }
                        }            
                    });
                    callback.finished();
                }
            },

            calculate: {
                value: function(volume, buffer, opacityBuffer, cuboids, intensities, sizeScale, borderOpacity, callback) {
                    const result = new Float32Array(buffer);
                    result.fill(Number.POSITIVE_INFINITY); // Fake value that indicates that voxel should not be colored.

                    const opacityResult = new Uint8Array(opacityBuffer);
                    opacityResult.fill(0);

                    const lengthX = volume.lengthX;
                    const lengthY = volume.lengthY;
                    const lengthZ = volume.lengthZ;
                    const count = lengthX * lengthY * lengthZ;
                    const sizeX = volume.sizeX;
                    const sizeY = volume.sizeY;
                    const sizeZ = volume.sizeZ;
    
                    const totalCount = count * cuboids.length;
                    callback.setup(totalCount);
    
                    const xStep = this._getStep(lengthX, sizeX);
                    const yStep = this._getStep(lengthY, sizeY);
                    const zStep = this._getStep(lengthZ, sizeZ);
    
                    const resultIndexer = new Indexer1D(lengthX, lengthY, lengthZ);
          
                    let progressIndex = 0;
                    cuboids.forEach((cuboid, index) => {
                        const cuboidXSize = cuboid.sizeX * sizeScale;
                        const cuboidYSize = cuboid.sizeY * sizeScale;
                        const cuboidZSize = cuboid.sizeZ * sizeScale;
    
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
    
                        const xSizeIndex = Math.abs(xEndIndex - xStartIndex);
                        const ySizeIndex = Math.abs(yEndIndex - yStartIndex);
                        const zSizeIndex = Math.abs(zEndIndex - zStartIndex);
                        const sizeIndex = Math.sqrt(xSizeIndex * xSizeIndex + ySizeIndex * ySizeIndex + zSizeIndex * zSizeIndex);
                        
                        for (let xIndex = xStartIndex; xIndex <= xEndIndex; ++xIndex) {
                            for (let yIndex = yStartIndex; yIndex <= yEndIndex; ++yIndex) {
                                for (let zIndex = zStartIndex; zIndex <= zEndIndex; ++zIndex) {  
                                    const rawIndex = resultIndexer.get(xIndex, yIndex, zIndex);
    
                                    const intensity = intensities[index];
                                    if (Number.isFinite(result[rawIndex])) {
                                        this._warnLossOfData(xIndex, yIndex, zIndex);
                                    }
                                    result[rawIndex] = intensity;
    
                                    const distanceXIndex = Math.abs(xIndex - xPivot);
                                    const distanceYIndex = Math.abs(yIndex - yPivot);
                                    const distanceZIndex = Math.abs(zIndex - zPivot);
                                    const distance = Math.sqrt(
                                        distanceXIndex * distanceXIndex + 
                                        distanceYIndex * distanceYIndex + 
                                        distanceZIndex * distanceZIndex);
                                    const relativeDistance = distance / sizeIndex;
                                    opacityResult[rawIndex] = relativeDistance * 255.0 * borderOpacity;
    
                                    callback.notify(progressIndex++, totalCount);
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
