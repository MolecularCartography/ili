'use strict';

function ViewContainer(model, div) {
    this._model = model;
    this._div = div;

    this.v2d = this._createView(View2D, 'svg.view-2d');
    this.g3d = this._createView(ViewGroup3D, 'div.view-group-3d');
    this.legend = this._createView(ViewLegend, 'svg.view-legend');

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

    _onModelModeChange: {
        value: function() {
            this._div.setAttribute('layout', this.layoutName);
            this.updateLayout();
        }
    }
});