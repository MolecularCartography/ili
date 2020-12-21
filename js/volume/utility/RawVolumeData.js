define([],
    function() {
      function RawVolumeData(data, lengthX, lengthY, lengthZ) {
        this.data = data;
        this.lengthX = lengthX;
        this.lengthY = lengthY;
        this.lengthZ = lengthZ;

        return this;
      }

      function SizedRawVolumeData(
          data,
          lengthX,
          lengthY,
          lengthZ,
          xSize,
          ySize,
          zSize) {
        Volume.call(this, data, lengthX, lengthY, lengthZ);
        this.xSize = xSize;
        this.ySize = ySize;
        this.zSize = zSize;

        return this;
      }

      SizedRawVolumeData.prototype = Object.create(RawVolumeData.prototype);

      return { RawVolumeData, SizedRawVolumeData };
    }
);
