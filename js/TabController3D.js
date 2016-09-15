'use strict';

define([
    'jqueryui',
    'abcviewcontroller'
],
function($ui, EmperorViewControllerABC) {
    function TabController3D(container, workspace) {
        var description = 'Settings of 3D view';
        var title = '3D';
        EmperorViewControllerABC['EmperorViewControllerABC'].call(this, container, title, description);

    }

    TabController3D.prototype = Object.create(EmperorViewControllerABC['EmperorViewControllerABC'].prototype, {
        toJSON: {
            value: function() {
                return {};
            }
        },

        fromJSON: {
            value: function(json) {

            }
        }
    });


    return TabController3D;
});
