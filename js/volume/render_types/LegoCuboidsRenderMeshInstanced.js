'use strict';

define([
    'three', 'threejsutils', 'volumerendermeshbase'
],
    function(THREE, ThreeUtils, VolumeRenderMeshBase) {

        class GeometryCache {
            
            constructor() {
                this._positionsAttribute = null;
                this._sizesAttribute = null;
                this._intensityAttribute = null;
                this._cachedSpotCount = 0;
                this.geometry = new THREE.InstancedBufferGeometry().copy(
                    new THREE.BoxBufferGeometry(1, 1, 1));
            }

            updateSpots(data) {
                if (!data) {
                    this.geometry.instanceCount = 0;
                    return;
                }

                const spots = data.spots;
                const spotIntensities = data.intensities.values;

                const spotCount = spots.length;
                const itemCount = spotCount * 3;

                // allocate new attributes if needed.
                if (this._cachedSpotCount < spotCount) {
                    this._positionsAttribute = new THREE.InstancedBufferAttribute(new Float32Array(itemCount), 3);
                    this._sizesAttribute = new THREE.InstancedBufferAttribute(new Float32Array(itemCount), 3);
                    this._intensityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(spotCount), 1);

                    this.geometry.setAttribute('a_instance_position', this._positionsAttribute);
                    this.geometry.setAttribute('a_instance_size', this._sizesAttribute);
                    this.geometry.setAttribute('a_instance_intensity', this._intensityAttribute);

                    this.geometry.instanceCount = spotCount;

                    this._cachedSpotCount = spotCount;
                } 

                const positions = this._positionsAttribute.array;
                const sizes = this._sizesAttribute.array;
                const intensities = this._intensityAttribute.array;

                for (let i = 0; i < spotCount; i++) {
                    const offset = i * 3;
                    const spot = spots[i];

                    positions[offset] = spot.centerX;
                    positions[offset + 1] = spot.centerY;
                    positions[offset + 2] = spot.centerZ;

                    sizes[offset] = spot.sizeX;
                    sizes[offset + 1] = spot.sizeY;
                    sizes[offset + 2] = spot.sizeZ;

                    intensities[i] = spotIntensities[i];
                }

                this._positionsAttribute.needsUpdate = true;
                this._sizesAttribute.needsUpdate = true;
                this._intensityAttribute.needsUpdate = true;
            }
        }

        class LegoCuboidsRenderMesh extends VolumeRenderMeshBase {
     
            constructor(controller) {
                super(controller, null, null, {
                    isIntensityCritical: true,
                    isIntensityTextureRequired: false
                });

                this.loadMaterial('IntensitySurfaceInstancedVs', 'IntensitySurfaceFs').
                    then((material) => {
                        material.transparent = true;
                        material.side = THREE.DoubleSide;
                        this._mesh = new THREE.Mesh(this._geometryCache.geometry, material);
                        this.container.add(this._mesh); 
                        this.invokeEventActions();
                    });

                this._geometryCache = new GeometryCache();
            }

            onIntensityDataChanged(value) {
                this._geometryCache.updateSpots(value);
            }
        }

        return LegoCuboidsRenderMesh;
    });