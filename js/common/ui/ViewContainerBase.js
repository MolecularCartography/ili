'use strict';

define([],
function() {
    function ViewContainerBase(workspace, div) {
        this._workspace = workspace;
        this._div = div;
        this._exportPixelRatio3d = 1.0;
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
            value: function(canvas) {
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
        }
    });

    return ViewContainerBase;
});
