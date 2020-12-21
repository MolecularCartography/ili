define(
    ['lib', 'bounds'],
    function(lib, Bounds) {
      function VolumeRemappingProcessor(
          xLength, yLength,  zLength, xSize, ySize, zSize, cuboids, callback) {
        this._count = xLength * yLength * zLength;
        const result = new Float32Array(this._count);
        result.fill(Number.NaN); // Fake value that indicates that voxel should not be colored.
        this._volume = new SizedVolume(
            result,
            xLength, yLength, zLength,
            xSize, ySize, zSize);

        this._callback = callback;
        this._cuboids = cuboids;
        this._calculated = false;
      }

      VolumeRemappingProcessor.prototype = Object.create(null, {
        calculate: function() {
          if (this._calculated) {
            return;
          }
  
          const callback = this._callback;
          const cuboids = this._cuboids;
          const xLength = source.volume.xLength;
          const yLength = source.volume.yLength;
          const zLength = source.volume.zLength;

          callback.setup(_count);
  
          const xSize = source.volume.xSize;
          const ySize = source.volume.ySize;
          const zSize = source.volume.zSize;
  
          const xStep = getStep(xLength, xSize);
          const yStep = getStep(yLength, ySize);
          const zStep = getStep(zLength, zSize);
  
          const resultIndexer = new Indexer1D(xLength, yLength, zLength);
          const result = source.volume.data;
  
          const intensities = cuboids
              .map((cuboid) => cuboid.molecules)
              .reduce((left, right) => left.concat(right))
              .map((molecule) => molecule.intensity);
          const cuboidBounds = Bounds.fromArray(intensities);
  
          source.cuboids.forEach((cuboid, index) => {
            const xPivot = this._getXPivot(cuboid);
            const yPivot = this._getYPivot(cuboid);
            const zPivot = this._getZPivot(cuboid);
  
            const xStartIndex = Math.floor(this._getIndex(xPivot, xStep, xLength));
            const yStartIndex = Math.floor(this._getIndex(yPivot, yStep, yLength));
            const zStartIndex = Math.floor(this._getIndex(zPivot, zStep, zLength));
  
            const xEndIndex = Math.floor(this._getIndex(
              this._getEndPosition(xPivot, cuboid.xSize, xSize),
                xStep,
                xLength));
            const yEndIndex = Math.floor(this._getIndex(
              this._getEndPosition(yPivot, cuboid.ySize, ySize),
                yStep,
                yLength));
            const zEndIndex = Math.floor(this._getIndex(
              this._getEndPosition(zPivot, cuboid.zSize, zSize),
                zStep,
                zLength));
  
            for (let xIndex = xStartIndex; xIndex <= xEndIndex; ++xIndex) {
              for (let yIndex = yStartIndex; yIndex <= yEndIndex; ++yIndex) {
                for (let zIndex = zStartIndex; zIndex <= zEndIndex; ++zIndex) {
                  result[resultIndexer.get(xIndex, yIndex, zIndex)] = cuboidBounds.normalize(cuboid.intensity);
                }
              }
            }
            callback.notify(index);
          });
          source._calculated = true;
          callback.finished();
        },

        _getXPivot: function(cuboid) {
          return cuboid.xCenter - cuboid.xSize / 2;
        },

        _getYPivot: function(cuboid) {
          return cuboid.yCenter - cuboid.ySize / 2;
        },

        _getZPivot: function(cuboid) {
          return cuboid.zCenter - cuboid.zSize / 2;
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
      });

      return VolumeRemappingProcessor;
    },
);
