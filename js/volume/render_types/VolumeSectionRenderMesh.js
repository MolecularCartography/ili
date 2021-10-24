'use strict';

define([
    'three', 'volumerendermeshbase'
],
    function(THREE, VolumeRenderMeshBase) {

        class VolumeSectionRenderMesh extends VolumeRenderMeshBase {

            constructor(controller) {
                super(controller, null, null, {
                    isIntensityCritical: false,
                    isIntensityTextureRequired: true
                });
                this.loadMaterial('VolumeSectionVs', 'VolumeSectionFs').then((material) => {    
                    material.transparent = true;
                    material.side = THREE.DoubleSide;

                    this._volumeSection = new THREE.Mesh(this.dataContainer.sectionGeometry, material);
                    this._volumeSection.frustumCulled = false;
                    this._volumeSection.matrixAutoUpdate = false;

                    this.container.add(this._volumeSection);
                    
                    this.invokeEventActions();
                });
            }
        }

        return VolumeSectionRenderMesh;
    });