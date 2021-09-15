'use strict';

define(['tabcontrollerbase', 'volumeviewgroup3d', 'colormaps', 'utils'],
    function (TabControllerBase, VolumeViewGroup3D, ColorMap, Utils) {

        const layoutOptions = [
            ['Single view', VolumeViewGroup3D.Layout.SINGLE],
            ['Double view', VolumeViewGroup3D.Layout.DOUBLE],
            ['Triple view', VolumeViewGroup3D.Layout.TRIPLE],
            ['Quadriple view', VolumeViewGroup3D.Layout.QUADRIPLE]
        ];
        const renderModes = [
            ['Volume', 'volume'],
            ['Lego', 'lego'],
            ['Section', 'section']
        ];
        const opacityModes = [
            ['Normalized', 1],
            ['Transfer Shape', 2],
            ['Mixed', 3]
        ];
        const layoutCorners = ['Top-left', 'Top-right', 'Bottom-left', 'Bottom-right'];

        function TabController3D(container, workspace, views) {
            var description = 'Settings of 3D view';
            var title = '3D';
            TabControllerBase.call(this, container, title, description, workspace);

            const dataContainer = workspace.dataContainer;

            // general.
            {
                const generalGroup = this.addGroupBox('General');
                generalGroup.addChoice(views.g3d, 'layout', 'Layout', layoutOptions);
                generalGroup.addChoice(views, 'legendLayout', 'Legend layout', layoutCorners);
                generalGroup.addChoice(views, 'widgetLayout', 'Widget layout', layoutCorners);
                generalGroup.addColor(workspace.scene3d, 'backgroundColor', 'Background');          
                generalGroup.addChoice(views, 'exportPixelRatio3d', 'Export pixel ratio', [0.5, 1.0, 2.0]);
            }
    
            // common.
            {
                const colorMapOptions = Object.keys(ColorMap.Maps).reduce(function (prev, cur) {
                    prev.push([ColorMap.Maps[cur].name, cur]);
                    return prev;
                }, []);
                const commonGroup = this.addGroupBox('Common');
                commonGroup.addChoice(dataContainer, 'renderMode', 'Render Mode', renderModes);
                commonGroup.addFlag(dataContainer, 'isShapeTransferFunctionEnabled', 'Transfer Enabled', 0, 1);
                commonGroup.addChoice(dataContainer, 'shapeTransferFunctionSource', 'Opacity Mode', opacityModes);
                commonGroup.addChoice(dataContainer, 'shapeColorMapId', 'Color Map', colorMapOptions);
                commonGroup.addFlag(dataContainer, 'isBoundingBoxVisible', 'Border Visible', 0, 1);
                commonGroup.addNumeric(dataContainer, 'shapeOpacity', 'Opacity', 0, 1);
                commonGroup.addTransferFunctionControl(workspace.scene3d, 'transfer_function1', 'Shape based transfer function');
                commonGroup.addTransferFunctionControl(workspace.scene3d, 'transfer_function1', 'Intensity based transfer function');
            }

            // light.
            {
                const lightProxyProperty = this._makeProxyProperty(dataContainer, 'lightInfo');
                const lightGroup = this.addGroupBox('Light');
                lightGroup.addFlag(dataContainer, 'isShadingEnabled', 'Shading', 0, 1);
                lightGroup.addNumeric(lightProxyProperty, 'ambient', 'Ambient', 0, 1);
                lightGroup.addNumeric(lightProxyProperty, 'diffuse', 'Diffuse', 0, 1);
                lightGroup.addNumeric(lightProxyProperty, 'specular', 'Specular', 0, 1);
            }
      
            // ray casting.
            {
                const raycastingGroup = this.addGroupBox('RayCasting');
                raycastingGroup.addNumeric(dataContainer, 'filling', 'Filling', 0, 1);
                raycastingGroup.addNumeric(dataContainer, 'spacing', 'Spacing', 0, 5);
            }

            // section.
            {
                const sectionProxyProperty = this._makeProxyProperty(dataContainer, 'sectionInfo');
                const sectionGroup = this.addGroupBox('Section');
                const sectionControls = [];
                sectionControls.push(sectionGroup.addNumeric(sectionProxyProperty, 'pX', 'pX', 0, 1));
                sectionControls.push(sectionGroup.addNumeric(sectionProxyProperty, 'pY', 'pY', 0, 1));
                sectionControls.push(sectionGroup.addNumeric(sectionProxyProperty, 'pZ', 'pZ', 0, 1));
                sectionControls.push(sectionGroup.addNumeric(sectionProxyProperty, 'dX', 'dX', 0, 1));
                sectionControls.push(sectionGroup.addNumeric(sectionProxyProperty, 'dY', 'dY', 0, 1));
                sectionControls.push(sectionGroup.addNumeric(sectionProxyProperty, 'dZ', 'dZ', 0, 1));
            }
            
            // slicing.
            {
                const slicingProxyProperty = this._makeProxyProperty(dataContainer, 'sliceInfo');
                const slicingGroup = this.addGroupBox('Slicing');
                const slicingControls = [];
                slicingControls.push(slicingGroup.addFlag(dataContainer, 'isSliceEnabled', 'Enabled', 0, 1));
                slicingControls.push(slicingGroup.addNumeric(slicingProxyProperty, 'minX', 'X min', 0, 1));
                slicingControls.push(slicingGroup.addNumeric(slicingProxyProperty, 'maxX', 'X max', 0, 1));
                slicingControls.push(slicingGroup.addNumeric(slicingProxyProperty, 'minY', 'Y min', 0, 1));
                slicingControls.push(slicingGroup.addNumeric(slicingProxyProperty, 'maxY', 'Y max', 0, 1));
                slicingControls.push(slicingGroup.addNumeric(slicingProxyProperty, 'minZ', 'Z min', 0, 1));
                slicingControls.push(slicingGroup.addNumeric(slicingProxyProperty, 'maxZ', 'Z max', 0, 1));
            }

            // coordinate adjustment.
            {
                const adjustmentProxyProperty = this._makeProxyProperty(dataContainer, 'coordinatesAdjustmentInfo', (value) => parseFloat(value));
                const coordsAdjGroup = this.addGroupBox('Coordinates Adjustment');
                const coordsAdjControls = [];
                coordsAdjControls.push(coordsAdjGroup.addNumeric(adjustmentProxyProperty, 'x', 'X offset').step(1));
                coordsAdjControls.push(coordsAdjGroup.addNumeric(adjustmentProxyProperty, 'y', 'Y offset').step(1));
                coordsAdjControls.push(coordsAdjGroup.addNumeric(adjustmentProxyProperty, 'z', 'Z offset').step(1));
            }
            
            return this;
        }

        TabController3D.prototype = Object.create(TabControllerBase.prototype);

        return TabController3D;
    });
