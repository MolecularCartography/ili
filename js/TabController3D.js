'use strict';

define([
    'tabcontrollerbase',
    'viewgroup3d'
],
function (TabControllerBase, ViewGroup3D) {
    function TabController3D(container, workspace, views) {
        var description = 'Settings of 3D view';
        var title = '3D';
        TabControllerBase.call(this, container, title, description, workspace);

        var layoutOptions = [
            ['Single view', ViewGroup3D.Layout.SINGLE],
            ['Double view', ViewGroup3D.Layout.DOUBLE],
            ['Triple view', ViewGroup3D.Layout.TRIPLE],
            ['Quadriple view', ViewGroup3D.Layout.QUADRIPLE]
        ];
        this.addChoice(views.g3d, 'layout', 'Layout', layoutOptions);
        this.addColor(workspace.scene3d, 'color', 'Color');
        this.addColor(workspace.scene3d, 'backgroundColor', 'Background');
        this.addNumeric(workspace.scene3d.frontLight, 'intensity', 'Light', 0, 3);
        this.addNumeric(workspace.scene3d, 'spotBorder', 'Spot border', 0, 1);
        this.addChoice(views, 'exportPixelRatio3d', 'Export pixel ratio', [0.5, 1.0, 2.0, 4.0]);
        this.addFlag(workspace.scene3d, 'axisHelper', 'Show the origin');
        var adjustment = this.addGroupBox('Coordinates adjustment');
        adjustment.addNumeric(workspace.scene3d.adjustment, 'alpha', '0X rotation', - 180.0, 180.0);
        adjustment.addNumeric(workspace.scene3d.adjustment, 'beta', '0Y rotation', -180.0, 180.0);
        adjustment.addNumeric(workspace.scene3d.adjustment, 'gamma', '0Z rotation', -180.0, 180.0);
        adjustment.addNumeric(workspace.scene3d.adjustment, 'x', 'X offset').step(1);
        adjustment.addNumeric(workspace.scene3d.adjustment, 'y', 'Y offset').step(1);
        adjustment.addNumeric(workspace.scene3d.adjustment, 'z', 'Z offset').step(1);
        return this;
    }

    TabController3D.prototype = Object.create(TabControllerBase.prototype);

    return TabController3D;
});
