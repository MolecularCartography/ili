'use strict';

define([
        'volumeviewgroup3d', 'viewlegend', 'volumeworkspace'
    ],
    function(VolumeViewGroup3D, ViewLegend, VolumeWorkspace) {
        function VolumeViewContainer(volumeWorkspace, div) {
            this._volumeWorkspace = volumeWorkspace;
            this._div = div;

            this.g3d = this._createView(VolumeViewGroup3D, 'div.ViewGroup3D');
            this.legend = this._createView(ViewLegend, 'svg.ViewLegend');
            this._exportPixelRatio3d = 1.0;


            this._volumeWorkspace.addEventListener(VolumeWorkspace.Events.MODE_CHANGE, this._onVolumeWorkspaceModeChange.bind(this));
            this._onVolumeWorkspaceModeChange();
        }

        VolumeViewContainer.prototype = Object.create(null, {
            all: {
                value: []
            },

            updateLayout: {
                value: function() {
                    for (let i = 0; i !== this.all.length; i++) {
                        this.all[i].prepareUpdateLayout();
                    }

                    for (let i = 0; i !== this.all.length; i++) {
                        this.all[i].finishUpdateLayout();
                    }
                }
            },


            _createView: {
                value: function(constructor, selector) {
                    const view = new constructor(this._volumeWorkspace, this._div.querySelector(selector));
                    this.all.push(view);
                    return view;
                }
            },

           layoutName: {
               get: function() {
                   switch (this._volumeWorkspace.mode) {
                       case VolumeWorkspace.Mode.UNDEFINED:
                           return 'welcome';

                       case VolumeWorkspace.Mode.MODE_3D:
                           return 'mode-3d';
                   }
               }
           },

            exportPixelRatio3d: {
                get: function() {
                    return this._exportPixelRatio3d;
                },

                set: function(value) {
                    console.log('export pixel ratio: ', value);
                    this._exportPixelRatio3d = value;
                }
            },

            _onVolumeWorkspaceModeChange: {
                value: function() {
                    this._div.setAttribute('layout', this.layoutName);
                    this.updateLayout();
                }
            },

            toJSON: {
                value: function () {
                    const result = [];
                    for (let i = 0; i < this.all.length; i++) {
                        result.push(this.all[i].toJSON());
                    }
                    return result;
                }
            },

            fromJSON: {
                value: function (json) {
                    for (let i = 0; i < json.length; i++) {
                        this.all[i].fromJSON(json[i]);
                    }
                }
            }
        });

        return VolumeViewContainer;
    });
