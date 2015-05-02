'use strict';

function ViewContainer(model, div) {
    this._model = model;
    this._div = div;

    this.v2d = this._createView(View2D, 'svg.View2D');
    this.g3d = this._createView(ViewGroup3D, 'div.ViewGroup3D');
    this.legend = this._createView(ViewLegend, 'svg.ViewLegend');

    this._model.addEventListener(
            'mode-change', this._onModelModeChange.bind(this));
    window.addEventListener('resize', this.updateLayout.bind(this));

    this._onModelModeChange();
    this.updateLayout();
}

ViewContainer.prototype = Object.create(null, {
    all: {
        value: []
    },

    updateLayout: {
        value: function() {
            for (var i = 0; i != this.all.length; i++) {
                this.all[i].prepareUpdateLayout();
            }

            for (var i = 0; i != this.all.length; i++) {
                this.all[i].finishUpdateLayout();
            }
        }
    },

    _createView: {
        value: function(constructor, selector) {
            var view = new constructor(
                    this._model, this._div.querySelector(selector));
            this.all.push(view);
            return view;
        }
    },

    layoutName: {
        get: function() {
            switch (this._model.mode) {
                case Model.Mode.UNDEFINED:
                    return 'welcome';

                case Model.Mode.MODE_2D:
                    return 'mode-2d';

                case Model.Mode.MODE_3D:
                    return 'mode-3d';
            }
        }
    },

    export: {
        value: function() {
            return new Promise(function(accept, reject) {
                var canvas = document.createElement('canvas');
                if (this._model.mode == Model.Mode.MODE_3D) {
                    this.g3d.export(canvas);
                    makeBlob();
                } else if (this._model.mode == Model.Mode.MODE_2D) {
                    this.v2d.export(canvas).then(makeBlob);
                } else {
                    reject();
                    return;
                }

                function makeBlob() {
                    var data = canvas.toDataURL();
                    var byteString = atob(data.split(',')[1]);
                    var mimeString = data.split(',')[0].split(':')[1].split(';')[0]
                    var ab = new ArrayBuffer(byteString.length);
                    var ia = new Uint8Array(ab);
                    for (var i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i);
                    }
                    accept(new Blob([ab], {type: mimeString}));
                }
            }.bind(this));
        }
    },

    _onModelModeChange: {
        value: function() {
            this._div.setAttribute('layout', this.layoutName);
            this.updateLayout();
        }
    }
});