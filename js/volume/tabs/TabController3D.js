'use strict';

define(['tabcontrollerbase', 'volumeviewgroup3d', 'colormaps'],
    function (TabControllerBase, VolumeViewGroup3D, ColorMap) {
        function TabController3D(container, workspace, views) {
            var description = 'Settings of 3D view';
            var title = '3D';
            TabControllerBase.call(this, container, title, description, workspace);

            var layoutOptions = [
                ['Single view', VolumeViewGroup3D.Layout.SINGLE],
                ['Double view', VolumeViewGroup3D.Layout.DOUBLE],
                ['Triple view', VolumeViewGroup3D.Layout.TRIPLE],
                ['Quadriple view', VolumeViewGroup3D.Layout.QUADRIPLE]
            ];

            const generalGroup = this.addGroupBox('General');
            generalGroup.addChoice(views.g3d, 'layout', 'Layout', layoutOptions);
            generalGroup.addColor(workspace.scene3d, 'backgroundColor', 'Background');
            generalGroup.addChoice(views, 'exportPixelRatio3d', 'Export pixel ratio', [0.5, 1.0, 2.0]);

            const visualizationGroup = this.addGroupBox('Visualization');
            var colorMapOptions = Object.keys(ColorMap.Maps).reduce(function (prev, cur) {
                prev.push([ColorMap.Maps[cur].name, cur]);
                return prev;
            }, []);
            visualizationGroup.addChoice(workspace.scene3d, 'shapeColorMapId', 'Shape Color Map', colorMapOptions);
            visualizationGroup.addNumeric(workspace.scene3d, 'opacity', 'Opacity', 0, 1);
            visualizationGroup.addNumeric(workspace.scene3d, 'filling', 'Filling', 0, 1);
            visualizationGroup.addNumeric(workspace.scene3d, 'spacing', 'Spacing', 0, 5);
            visualizationGroup.addNumeric(workspace.scene3d, 'min_intensity_threshold', 'Min intensity threshold', 0, 1);
            visualizationGroup.addNumeric(workspace.scene3d, 'max_intensity_threshold', 'Max intensity threshold', 0, 1);
      
            const lightGroup = this.addGroupBox('Light');
            lightGroup.addFlag(workspace.scene3d, 'shadingEnabled', 'Shading', 0, 1);
            lightGroup.addNumeric(workspace.scene3d.light, 'ambient', 'Ambient', 0, 1);
            lightGroup.addNumeric(workspace.scene3d.light, 'diffuse', 'Diffuse', 0, 1);
            lightGroup.addNumeric(workspace.scene3d.light, 'specular', 'Specular', 0, 1);
            
            const slicingGroup = this.addGroupBox('Slicing');
            const slicingControls = [];
            slicingControls.push(slicingGroup.addNumeric(workspace.scene3d.slicing, 'minX', 'X min', 0, 1));
            slicingControls.push(slicingGroup.addNumeric(workspace.scene3d.slicing, 'maxX', 'X max', 0, 1));
            slicingControls.push(slicingGroup.addNumeric(workspace.scene3d.slicing, 'minY', 'Y min', 0, 1));
            slicingControls.push(slicingGroup.addNumeric(workspace.scene3d.slicing, 'maxY', 'Y max', 0, 1));
            slicingControls.push(slicingGroup.addNumeric(workspace.scene3d.slicing, 'minZ', 'Z min', 0, 1));
            slicingControls.push(slicingGroup.addNumeric(workspace.scene3d.slicing, 'maxZ', 'Z max', 0, 1));
            slicingGroup.addAction('Reset', () => {
                workspace.scene3d.resetSlicing();
                slicingControls.forEach((v) => v.refresh());
            });
            return this;
        }

        TabController3D.prototype = Object.create(TabControllerBase.prototype);

        return TabController3D;
    });
