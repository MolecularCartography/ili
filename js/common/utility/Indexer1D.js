define(
    ['lib'],
    function(lib) {
      function Indexer1D(xLength, yLength, zLength) {
        this.xLength = xLength;
        this.yLength = yLength;
        this.zLength = zLength;

        this.xTopBound = xLength - 1;
        this.yTopBound = yLength - 1;
        this.zTopBound = zLength - 1;

        this.stride = xLength;
        this.pitch = this.stride * yLength;
        this.depthPitch = this.pitch * zLength;
        return this;
      }

      Indexer1D.prototype = Object.create(null, {
        get: function(xIndex, yIndex, zIndex) {
            const index = zIndex * this.pitch + yIndex * this.stride + xIndex;
            return index;
        },

        getClipped: function(xIndex, yIndex, zIndex, bound) {
            return this.get(xIndex, yIndex, Math.min(bound, Math.max(0, zIndex)));
        },

        getXClipped: function(xIndex, yIndex, zIndex) {
            return this.getClipped(xIndex, yIndex, zIndex, this.xTopBound);
        },

        getYClipped: function(xIndex, yIndex, zIndex) {
            return this.getClipped(xIndex, yIndex, zIndex, this.yTopBound);
        },

        getZClipped: function(xIndex, yIndex, zIndex) {
            return this.getClipped(xIndex, yIndex, zIndex, this.zTopBound);
        }
      });

      return Indexer1D;
    }
);
