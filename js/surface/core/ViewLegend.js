'use strict';

define([
    'viewlegendbase'
],
function(ViewLegendBase) {
    function ViewLegend(workspace, svg) {
        ViewLegendBase.call(this, workspace._spotsController, svg);
        return this;
    }

    ViewLegend.prototype = Object.create(ViewLegendBase.prototype);

    return ViewLegend;
});
