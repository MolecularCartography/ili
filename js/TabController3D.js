'use strict';

define([
    'jqueryui',
    'abcviewcontroller',
    'viewgroup3d'
],
function($ui, EmperorViewControllerABC, ViewGroup3D) {
    function TabController3D(container, workspace, views) {
        var description = 'Settings of 3D view';
        var title = '3D';
        EmperorViewControllerABC['EmperorViewControllerABC'].call(this, container, title, description);

        var layout = '<table>';
        layout += '<tr><td class="control-name-column">Layout</td>';
        layout += '<td class="control-set-column"><select id="3D-layout-select"></select></td></tr>';
        layout += '</table>';
        this.$body.append(layout);

        this._workspace = workspace;
        this._views = views;
        var layoutOptions = [
            ['Single view', ViewGroup3D.Layout.SINGLE],
            ['Double view', ViewGroup3D.Layout.DOUBLE],
            ['Triple view', ViewGroup3D.Layout.TRIPLE],
            ['Quadriple view', ViewGroup3D.Layout.QUADRIPLE]
        ];
        var layoutSelectorOptions = layoutOptions.map(function(pair) {
            return '<option value="' + pair[1] + '">' + pair[0] + '</option>';
        });
        $('#3D-layout-select').append(layoutSelectorOptions.join('')).selectmenu({
            change: function(event, ui) {
                views.g3d.layout = ui.item.value;
            }
        });

        return this;
    }

    TabController3D.prototype = Object.create(EmperorViewControllerABC['EmperorViewControllerABC'].prototype, {
        resize: {
            value: function(width, height) {
                EmperorViewControllerABC['EmperorViewControllerABC'].prototype.resize.call(this, width, height);

                this.$body.height(this.$canvas.height() - this.$header.height());
                this.$body.width(this.$canvas.width());

                this.$body.find('.control-set-column').width(this.$body.find('table').width()
                    - this.$body.find('control-name-column').width() - this.$body.find('control-value-column').width());
            }
        },

        toJSON: {
            value: function() {
                return {'layout': this._views.g3d.layout};
            }
        },

        fromJSON: {
            value: function(json) {
                $('#3D-layout-select').selectmenu(json['layout']);
            }
        }
    });


    return TabController3D;
});
