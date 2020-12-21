'use strict';

define([
        'tabcontrollerbase',
        'volumeviewgroup3d'
    ],
    function (VolumeTabControllerBase, VolumeViewGroup3D) {
        function TabController3D(container, workspace, views) {
            var description = 'Settings of 3D view';
            var title = '3D';
            VolumeTabControllerBase.call(this, container, title, description, workspace);

            var layoutOptions = [
                ['Single view', VolumeViewGroup3D.Layout.SINGLE],
                ['Double view', VolumeViewGroup3D.Layout.DOUBLE],
                ['Triple view', VolumeViewGroup3D.Layout.TRIPLE],
                ['Quadriple view', VolumeViewGroup3D.Layout.QUADRIPLE]
            ];
            this.addChoice(views.g3d, 'layout', 'Layout', layoutOptions);
            this.addColor(workspace.volumeScene3D, 'color', 'Color');
            this.addColor(workspace.volumeScene3D, 'backgroundColor', 'Background');
            this.addFlag(workspace.volumeScene3D, 'axisHelper', 'Show the origin');
            this.addNumeric(workspace.volumeScene3D.frontLight, 'intensity', 'Light', 0, 3);
            this.addChoice(views, 'exportPixelRatio3d', 'Export pixel ratio', [0.5, 1.0, 2.0]);
            let adjustment = this.addGroupBox('Coordinates adjustment');
            adjustment.addNumeric(workspace.volumeScene3D.adjustment, 'alpha', '0X rotation', - 180.0, 180.0);
            adjustment.addNumeric(workspace.volumeScene3D.adjustment, 'beta', '0Y rotation', -180.0, 180.0);
            adjustment.addNumeric(workspace.volumeScene3D.adjustment, 'gamma', '0Z rotation', -180.0, 180.0);
            adjustment.addNumeric(workspace.volumeScene3D.adjustment, 'x', 'X offset').step(1);
            adjustment.addNumeric(workspace.volumeScene3D.adjustment, 'y', 'Y offset').step(1);
            adjustment.addNumeric(workspace.volumeScene3D.adjustment, 'z', 'Z offset').step(1);

            let visualization = this.addGroupBox('Visualization technique');
            visualization.addNumeric(workspace.volumeScene3D, 'opacity', 'Opacity', 0, 1);
            visualization.addNumeric(workspace.volumeScene3D, 'filling', 'Filling', 0, 1);
            visualization.addNumeric(workspace.volumeScene3D, 'spacing', 'Spacing', 0, 1);
            visualization.addNumeric(workspace.volumeScene3D, 'shadowing', 'Shadowing', 0, 1);
            return this;
        }

        TabController3D.prototype = Object.create(VolumeTabControllerBase.prototype);

        return TabController3D;
    });
