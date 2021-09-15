
'use strict';

define([
    'three', 'threejsutils', 'colormaptexturerenderer', 'rawvolumedata', 'volumerendermeshbase'
],
    function(THREE, ThreeUtils, ColorMapTextureRenderer, RawVolumeData, VolumeRenderMeshBase) {

        const RenderStyle = {
            raycast: 0,
            steps_debug: 1
        };

        const Uniforms = {
            u_renderstype: { value: RenderStyle.steps_debug } 
        };

        class VolumeRenderMesh extends VolumeRenderMeshBase {

            constructor(controller) {
                super(controller, null, Uniforms, {
                    isIntensityCritical: false,
                    isIntensityTextureRequired: true
                });

                // load material.
                this.loadMaterial('VolumeRaycastingVs', 'VolumeRaycastingFs').
                    then((material) => {
                        material.side = THREE.BackSide;
                        material.transparent = true;

                        this._mesh = new THREE.Mesh(this.dataContainer.boxGeometry, material);
                        this._mesh.matrixAutoUpdate = false;
                        this._mesh.frustumCulled = false;

                        this.container.add(this._mesh);
                        this.invokeEventActions();
                    });       
            }
        };

        return VolumeRenderMesh;
    });
