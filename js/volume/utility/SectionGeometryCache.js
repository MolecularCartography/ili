'use strict';

define([
    'three', 'volumesectionprocessor'
],
    function(THREE, VolumeSectionProcessor) {

        // TODO: think of optimizing GPU buffers reallocation.
        class SectionGeometryCache {

            constructor() {
                this.geometry = new THREE.BufferGeometry();
                this.lineGeometry = new THREE.BufferGeometry();
            }

            update(min, max, origin, direction) {
                const processor = new VolumeSectionProcessor(min, max);
                const positions = processor.extractPositions(origin, direction);
         
                const triangulationResult = processor.triangulateConvex(positions, direction);

                const indices = triangulationResult.extractIndices();
                const linePositions = triangulationResult.extractEdgeVertices();
                
                this.geometry.setFromPoints(positions);
                this.geometry.setIndex(new THREE.BufferAttribute(indices, 1));
                this.lineGeometry.setFromPoints(linePositions);
            }

        }

        return SectionGeometryCache;
    });