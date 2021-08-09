'use strict';

define([],
function() {
    function ViewContainerBase(workspace, div) {
        this._workspace = workspace;
        this._div = div;
        this._exportPixelRatio3d = 1.0;
        this._legendLayout = 'Bottom-right';
        this._widgetLayout = 'Top-left';
        this._defaultMargin = 20;
        this._extraMargin = 100;
        return this;
    }

    ViewContainerBase.prototype = Object.create(null, {
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
                var view = new constructor(this._workspace, this._div.querySelector(selector));
                this.all.push(view);
                return view;
            }
        },

        layoutName: {
            get: function() {
                return 'Unknown';
            }
        },


        export: {
            value: function() {
                console.warn('The view container export is not overriden.');
                return null;
            }
        },

        makeCanvasBlob: {
            value: function(canvas, accept) {
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
        },

        exportPixelRatio3d: {
            get: function() {
                return this._exportPixelRatio3d;
            },

            set: function(value) {
                if (value <= 0.0 || value > 4.0) {
                    throw 'Invalud value range';
                }
                this._exportPixelRatio3d = value;
            }
        },

        legendLayout:{
            get: function (){
                return this._legendLayout;
            },

            set: function (value){
                this._changeLayout('.ViewLegend', value);
                this._legendLayout = value;
                this._layoutNearby();
            }
        },

        widgetLayout: {
            get: function (){
                return this._widgetLayout;
            },

            set: function (value){
                this._changeLayout('orientation-widget', value);
                this._widgetLayout = value;
                this._layoutNearby();
            }
        },

        _onWorkspaceModeChange: {
            value: function() {
                this._div.setAttribute('layout', this.layoutName);
                this.updateLayout();
            }
        },

        toJSON: {
            value: function () {
                var result = [];
                for (var i = 0; i < this.all.length; i++) {
                    result.push(this.all[i].toJSON());
                }
                return result;
            }
        },

        fromJSON: {
            value: function (json) {
                for (var i = 0; i < json.length; i++) {
                    this.all[i].fromJSON(json[i]);
                }
            }
        },

        _layoutNearby: {
            value: function () {
                if (this._widgetLayout === this._legendLayout)
                    $('.ViewLegend').css('margin', `${this._defaultMargin} ${this._defaultMargin + this._extraMargin}`);
                else
                    $('.ViewLegend').css('margin', `${this._defaultMargin} ${this._defaultMargin}`);
            }
        },

        _changeLayout: {
            value: function (elem, value) {
                let legendLayout = value.toLowerCase();
                let properties = legendLayout.split('-');
                ['top', 'bottom', 'right', 'left'].forEach(element => {
                    if (properties.includes(element))
                        $(elem).css(element, "0");
                    else
                        $(elem).css(element, "revert");
                });
            }
        }
    });

    return ViewContainerBase;
});
