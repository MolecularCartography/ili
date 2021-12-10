'use strict';

define([
    'three', 'rendermeshbase'
],
    function(THREE, RenderMeshBase) {

        const EVENT_MAP = new Map([
            // geometry resets.
            [ 'shapeData', (mesh, getter) => mesh._resetGeometry() ],
            [ 'sliceInfo', (mesh, getter) => mesh._resetGeometry() ],
            [ 'coordinatesAdjustmentInfo', (mesh, getter) => mesh._resetGeometry() ],

            // presentation resets.
            [ 'isSectionLineVisible', (mesh, getter) => mesh._reset() ],
            [ 'sectionLineThickness', (mesh, getter) => mesh._reset() ],
            [ 'sectionLineColor', (mesh, getter) => mesh._reset() ]
        ]);

        class VolumeSectionBorderMesh extends RenderMeshBase {

            constructor(controller) {
                super(controller, EVENT_MAP);

                // create border line.
                this._borderLineMaterial = new THREE.LineBasicMaterial();
                this._borderLine = new THREE.LineSegments(this.dataContainer.lineSectionGeometry, this._borderCubeMaterial);
                this._borderLine.matrixAutoUpdate = false;

                // submit common container.
                this.container.add(this._borderLine);

                this._reset();
                this._resetGeometry();
            }

            _resetGeometry() {
                this.dataContainer.setupBoundingBoxTransform(this._borderLine);
            }

            _reset() {
                const dataContainer = this.dataContainer;
                this._borderLineMaterial.linewidth = dataContainer.sectionLineThickness;
                this._borderLineMaterial.color = dataContainer.sectionLineColor;
                this._borderLine.visible = dataContainer.isSectionLineVisible;
            }

        }

        return VolumeSectionBorderMesh;
    });