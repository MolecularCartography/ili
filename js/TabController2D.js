'use strict';

define([
    'jqueryui',
    'abcviewcontroller'
],
function($ui, EmperorViewControllerABC) {
    function TabController2D(container, workspace) {
        var description = 'Settings of 2D view';
        var title = '2D';
        EmperorViewControllerABC['EmperorViewControllerABC'].call(this, container, title, description);

        var layout = '<table style="width:inherit; border:none;">';
        layout += '<tr><td class="name-column">Spot border</td>';
        layout += '<td><div id="2D-spot-border-slider"></div></td></tr>';
        layout += '</table>';
        this.$body.append(layout);

        this._workspace = workspace;
        $('#2D-spot-border-slider').slider({
            max: 1,
            min: 0,
            step: 0.01,
            value: workspace.scene2d.spotBorder,
            slide: function(event, ui) {
                workspace.scene2d.spotBorder = ui.value;
            }
        });
    }

    TabController2D.prototype = Object.create(EmperorViewControllerABC['EmperorViewControllerABC'].prototype, {
        toJSON: {
            value: function() {
                return {'spot-border': this._workspace.scene2d.spotBorder};
            }
        },

        fromJSON: {
            value: function(json) {
                this._workspace.scene2d.spotBorder = json['spot-border'];
            }
        }
    });


    return TabController2D;
});
