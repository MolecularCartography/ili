define(['three'], function(three) {
    function Bounds(min, max) {
      this.min = min;
      this.max = max;
      return this;
    }
  
    Bounds.prototype = Object.create(null, {
        asVector: function() {
            return new three.Vector2(this.min, this.max);
        },

        normalize: function(value) {
            return (value - this.min) / (this.max - this.min);
        }
    });

    Bounds.fromArray = function(data) {
        const min = data.reduce(Math.min, Number.MAX_VALUE);
        const max = data.reduce(Math.max, Number.MIN_VALUE);    
        return new Bounds(min, max);
    };

    return Bounds;
});
  