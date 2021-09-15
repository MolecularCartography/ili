'use strict';

define([
    'three', 'threejsutils', 'rendermeshbase'
],
    function(THREE, ThreeUtils, RenderMeshBase) {

        const EVENT_MAP = new Map([
            // geometry resets.
            [ 'shapeData', (mesh) => mesh._resetGeometry() ],
            [ 'sliceInfo', (mesh) => mesh._resetGeometry() ],
            [ 'coordinatesAdjustmentInfo', (mesh) => mesh._resetGeometry() ],

            // presentation resets.
            [ 'isBoundingBoxVisible', (mesh) => mesh._reset() ],  
            [ 'isSliceEnabled', (mesh) => mesh._reset() ],  
            [ 'boundingBoxThickness', (mesh) => mesh._reset() ],
            [ 'boundingBoxColor', (mesh) => mesh._reset() ],
            [ 'slicedBoundingBoxColor', (mesh) => mesh._reset() ]
        ]);

        class BorderCubeMesh extends RenderMeshBase {

            constructor(controller) {
                super(controller, EVENT_MAP);

                // create border cube.
                this._borderCubeMaterial = new THREE.LineBasicMaterial();
                this._borderCube = new THREE.LineSegments(this.dataContainer.boxLineGeometry, this._borderCubeMaterial);
                this._borderCube.matrixAutoUpdate = false;

                // create slice border cube.
                this._sliceBorderCubeMaterial = new THREE.LineBasicMaterial();
                this._sliceBorderCube = new THREE.LineSegments(this.dataContainer.boxLineGeometry, this._sliceBorderCubeMaterial);
                this._sliceBorderCube.matrixAutoUpdate = false;

                // submit common container.
                this.container.add(this._borderCube);
                this.container.add(this._sliceBorderCube);

                this._reset();
                this._resetGeometry();
            }

            _resetGeometry() {
                this.dataContainer.setupBoundingBoxTransform(this._borderCube);
                this.dataContainer.setupSlicedBoxTransform(this._sliceBorderCube);
                this._reset();
            }

            _reset() {
                const dataContainer = this.dataContainer;

                const width = dataContainer.boundingBoxThickness;
                this._borderCubeMaterial.linewidth = width;
                this._sliceBorderCubeMaterial.linewidth = width;

                this._borderCubeMaterial.color = dataContainer.boundingBoxColor;
                this._sliceBorderCubeMaterial.color = dataContainer.slicedBoundingBoxColor;

                const isVisible = dataContainer.isBoundingBoxVisible;
                this._borderCube.visible = isVisible;

                const sliceInfo = dataContainer.sliceInfo;
                const sliceInvisible = 
                    sliceInfo.minX == 0.0 && 
                    sliceInfo.minY == 0.0 && 
                    sliceInfo.minZ == 0.0 && 
                    sliceInfo.maxX == 1.0 && 
                    sliceInfo.maxY == 1.0 && 
                    sliceInfo.maxZ == 1.0;
                this._sliceBorderCube.visible = isVisible && !sliceInvisible && dataContainer.isSliceEnabled;
            }

        }

        return BorderCubeMesh;
    });