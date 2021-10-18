'use strict';

define([
    'three', 'volumerendermeshbase'
],
    function(THREE, VolumeRenderMeshBase) {

        const Uniforms = {
            output_multiplier: { value: 1.0 } 
        };

        const EVENT_MAP = new Map([
            [ 'sectionMultiplier', (mesh, getter) => mesh._resetSectionMultiplier(getter) ],
        ]);

        class VolumeSectionRenderMesh extends VolumeRenderMeshBase {

            constructor(controller) {
                super(controller, EVENT_MAP, Uniforms, {
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

            _resetSectionMultiplier(getter) {
                this._setUniform('output_multiplier', getter());
            }
        }

        return VolumeSectionRenderMesh;
    });