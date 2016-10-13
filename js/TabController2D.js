'use strict';

define([
    'jqueryui',
    'abcviewcontroller'
],
function($ui, EmperorViewControllerABC) {
    function TabController2D(container, workspace, views) {
        var description = 'Settings of 2D view';
        var title = '2D';
        EmperorViewControllerABC['EmperorViewControllerABC'].call(this, container, title, description);

        var layout = '<table>';
        layout += '<tr><td class="control-name-column">Spot border</td>';
        layout += '<td class="control-set-column"><div id="2D-spot-border-slider"></div></td>';
        layout += '<td class="control-value-column"><input type="text" id="spot-border-value" class="control-value-display" readonly></td></tr>';
        layout += '</table>';
        this.$body.append(layout);

        var spotBorderValue = document.getElementById('spot-border-value');
        spotBorderValue.value = 0.05;
        this._workspace = workspace;
        $('#2D-spot-border-slider').slider({
            max: 1,
            min: 0,
            step: 0.01,
            value: workspace.scene2d.spotBorder,
            slide: function(event, ui) {
                workspace.scene2d.spotBorder = ui.value;
                spotBorderValue.value = ui.value;
            }
        });
        return this;
    }

    TabController2D.prototype = Object.create(EmperorViewControllerABC['EmperorViewControllerABC'].prototype, {
        resize: {
            value: function (width, height) {
                EmperorViewControllerABC['EmperorViewControllerABC'].prototype.resize.call(this, width, height);

                this.$body.height(this.$canvas.height() - this.$header.height());
                this.$body.width(this.$canvas.width());

                this.$body.find('.control-set-column').width(this.$body.find('table').width()
                    - this.$body.find('control-name-column').width() - this.$body.find('control-value-column').width());
            }
        },

        toJSON: {
            value: function() {
                return {'spot-border': this._workspace.scene2d.spotBorder};
            }
        },

        fromJSON: {
            value: function(json) {
                $('#2D-spot-border-slider').slider('value', json['spot-border']);
            }
        }
    });


    return TabController2D;
});
