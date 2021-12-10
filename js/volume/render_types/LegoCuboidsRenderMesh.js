'use strict';

define([
    'three', 'threejsutils', 'volumerendermeshbase'
],
    function(THREE, ThreeUtils, VolumeRenderMeshBase) {

        class MeshCache {
            
            constructor(container, geometry, material) {
                this._container = container;
                this._geometry = geometry;
                this._material = material;
                this._meshes = [];
                this._cachedMeshCount = 0;
            }

            updateSpots(data) {
                if (!data) {
                    return;
                }
                const spots = data.spots;
                const spotCount = spots.length;

                // add new.
                for (let i = this._cachedMeshCount; i < spotCount; i++) {
                    const mesh = new THREE.Mesh(this._geometry, this._material);  
                    mesh.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
                        const spots = data.spots;
                        const spotIntensities = data.intensities.values;
                        const spot = spots[i];

                        const uniforms = material.uniforms;
                        uniforms.u_spot_intensity.value = spotIntensities[i];
                        uniforms.u_spot_size.value = new THREE.Vector3(spot.sizeX, spot.sizeY, spot.sizeZ);
                        uniforms.u_spot_offset.value = new THREE.Vector3(spot.centerX, spot.centerY, spot.centerZ);         

                        material.side = group.materialIndex == 0 ? THREE.BackSide : THREE.FrontSide;
                        material.uniformsNeedUpdate = true;
                    };   
                    mesh.frustumCulled = false;
                    mesh.matrixAutoUpdate = false;

                    this._meshes.push(mesh);
                    this._container.add(mesh);
                }
                // remove non-required.
                for (let i = spotCount; i < this._cachedMeshCount; i++) {
                    const mesh = this._meshes[i];
                    this._meshes.remove(mesh);
                    this._container.remove(mesh);
                }
                
                // position is required for transparent rendering.
                for (let i = 0; i < spotCount; i++) {
                    const mesh = this._meshes[i];
                    const spot = spots[i];
                    mesh.position.set(spot.centerX, spot.centerY, spot.centerZ);
                    mesh.updateMatrix();
                }

                this._cachedMeshCount = spotCount;
            }

        }

        const UNIFORMS = {
            u_spot_intensity: { value: 0.0 },
            u_spot_size: { value: new THREE.Vector3() },
            u_spot_offset: { value: new THREE.Vector3() }
        };

        class LegoCuboidsRenderMesh extends VolumeRenderMeshBase {
     
            constructor(controller) {
                super(controller, null, UNIFORMS, {
                    isIntensityCritical: true,
                    isIntensityTextureRequired: false
                });

                // need to define two groups for transparent rendering.
                this._boxGeometryTwoSide = new THREE.BoxBufferGeometry(1, 1, 1);
                const indexArray = this._boxGeometryTwoSide.index.array;
                this._boxGeometryTwoSide.clearGroups();
                this._boxGeometryTwoSide.addGroup(0, indexArray.length, 0);
                this._boxGeometryTwoSide.addGroup(0, indexArray.length, 1);

                this.loadMaterial('IntensitySurfaceVs', 'IntensitySurfaceFs').
                    then((material) => {
                        material.transparent = true;
                        material.side = THREE.FrontSide;
                        material.depthTest = false;

                        this._meshCache = new MeshCache(this.container, this._boxGeometryTwoSide, [material, material]);
                        this.invokeEventActions();
                    });       
            }

            onIntensityDataChanged(value) {
                if (!this._meshCache) {
                    return;
                }
                this._meshCache.updateSpots(value);
            }
        }

        return LegoCuboidsRenderMesh;
    });