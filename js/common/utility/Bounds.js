define(['three'], function(THREE) {
    function Bounds(min, max) {
      this.min = min;
      this.max = max;
      this.size = max - min;
      return this;
    }
  
    Bounds.prototype = Object.create(null, {
        asVector: {
            value: function() {
                return new THREE.Vector2(this.min, this.max);
            },
        },

        normalize: {
            value: function(value) {
                return (value - this.min) / (this.max - this.min);
            }
        }
    });

    Bounds.fromArray = function(data) {
        const min = data.reduce((left, right) => left < right ? left : right, Number.MAX_VALUE);
        const max = data.reduce((left, right) => left > right ? left : right, Number.MIN_VALUE);    
        console.log('data to calculate bounds', data);
        console.log('calculated bounds', min, max);
        return new Bounds(min, max);
    };

    return Bounds;
});
  
