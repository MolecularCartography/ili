'use strict';

function SpotLabel2D(view) {
    this._view = view;
    this._div = null;
    this._spot = null;
}

SpotLabel2D.prototype = {
    showFor: function(spot) {
        if (this._div) this.hide();

        this._div = document.createElement('div');
        this._div.className = 'SpotLabel2D';
        this._div.textContent = spot.name;
        this._spot = spot;
        this.update();
        this._view.div.appendChild(this._div);
    },

    hide: function() {
        if (!this._div) return;
        this._view.div.removeChild(this._div);
        this._div = null;
    },

    update: function() {
        if(!this._div || !this._spot) return;

        var coords = this._view.imageToClient(this._spot);
        console.log(coords);
        this._div.style.left = coords.x + 'px';
        this._div.style.top = coords.y + 'px';
    },
};