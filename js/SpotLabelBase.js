'use strict';

function SpotLabelBase() {
    this._div = null;
}

SpotLabelBase.prototype = Object.create(null, asProps({
    createDiv: function(className) {
        this._div = document.createElement('div');
        this._div.className = className;
    },

    removeDiv: function() {
        this._div.parentNode.removeChild(this._div);
        this._div = null;
    }
}, {
    div: {
        get: function() {
            return this._div;
        }
    },

    textContent: {
        set: function(value) {
            if (/^http(s)?\:\/\//i.test(value)) {
                this._div.textContent = '';
                var anchor = document.createElement('a');
                anchor.setAttribute('href', value);
                anchor.setAttribute('target', '_blank');
                anchor.textContent = value;
                anchor.onmousedown = function(e) {
                    e.stopPropagation();
                };
                this._div.appendChild(anchor);
            } else {
                this._div.textContent = value;
            }
        }
    },
}));