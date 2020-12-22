define([],
    function() {
      function RawVolumeData(data, lengthX, lengthY, lengthZ, bounds) {
        this.data = data;
        this.lengthX = lengthX;
        this.lengthY = lengthY;
        this.lengthZ = lengthZ;
        this.bounds = bounds;
        return this;
      }

      function SizedRawVolumeData(
          data,
          lengthX,
          lengthY,
          lengthZ,
          sizeX,
          sizeY,
          sizeZ,
          bounds) {
        RawVolumeData.call(this, data, lengthX, lengthY, lengthZ, bounds);
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.sizeZ = sizeZ;
        return this;
      }

      SizedRawVolumeData.prototype = Object.create(RawVolumeData.prototype);

      return { RawVolumeData, SizedRawVolumeData };
    }
);
