const volumePathPrefix = 'js/volume/';
requirejs.config({
    paths: {
        // Utilities
        'sectiongeometrycache': volumePathPrefix + 'utility/SectionGeometryCache',
        'rawvolumedata': volumePathPrefix + 'utility/RawVolumeData',
        'threejsutils': volumePathPrefix + 'utility/ThreeJsUtils',
        'volumenormalsprocessor': volumePathPrefix + 'utility/VolumeNormalsProcessor',
        'volumesectionprocessor': volumePathPrefix + 'utility/VolumeSectionProcessor',
        'volumeremappingprocessor':  volumePathPrefix + 'utility/VolumeRemappingProcessor',
        'lazytexturerenderer': volumePathPrefix + '/utility/LazyTextureRenderer',
        'transferfunctiontexturerenderer': volumePathPrefix + '/utility/TransferFunctionTextureRenderer',
        'colormaptexturerenderer': volumePathPrefix + '/utility/ColorMapTextureRenderer',
        'volumedatacache': volumePathPrefix + '/utility/VolumeDataCache',

        // Render types.
        'volumerendermesh': volumePathPrefix + 'render_types/VolumeRenderMesh',
        'volumesectionrendermesh': volumePathPrefix + 'render_types/VolumeSectionRenderMesh',
        'legocuboidsrendermesh': volumePathPrefix + 'render_types/LegoCuboidsRenderMesh',
        'volumerendermeshbase': volumePathPrefix + 'render_types/VolumeRenderMeshBase',
        'rendermeshbase': volumePathPrefix + 'render_types/RenderMeshBase',
        'bordercubemesh': volumePathPrefix + 'render_types/BorderCubeMesh',
        'volumesectionbordermesh': volumePathPrefix + 'render_types/VolumeSectionBorderMesh',

        // Core    
        'volumedatacontainer': volumePathPrefix + 'core/DataContainer',
        'volumesettingscontroller': volumePathPrefix + 'core/SettingsController',
        'volumeinputfilesprocessor': volumePathPrefix + 'core/InputFilesProcessor',
        'volumescene3d': volumePathPrefix + 'core/Scene3D',
        'volumeview3d': volumePathPrefix + 'core/View3D',
        'volumeviewcontainer': volumePathPrefix + 'core/ViewContainer',
        'volumeviewgroup3d': volumePathPrefix + 'core/ViewGroup3D',
        'volumeworkspace': volumePathPrefix + 'core/Workspace',
        'volumemapselector': volumePathPrefix + 'core/MapSelector',
        'volumespotscontroller': volumePathPrefix + 'core/SpotsController',
        'volumeviewlegend': volumePathPrefix + 'core/ViewLegend',

        // Workers
        'volumecuboidmapper': volumePathPrefix + 'workers/cuboidmapper',
        'volumemeasuresloader': volumePathPrefix + 'workers/measurerloader',
        'volumeloader': volumePathPrefix + 'workers/volumeloader',

        // Tabs
        'volumetabcontroller3d': volumePathPrefix + 'tabs/TabController3D',
        'volumetabcontrollerdocumentation': volumePathPrefix + 'tabs/TabControllerDocumentation',
        'volumetabcontrollerexamples': volumePathPrefix + 'tabs/TabControllerExamples',
        'volumetabcontrollermapping': volumePathPrefix + 'tabs/TabControllerMapping',
        'volumetabcontrollerspots': volumePathPrefix + 'tabs/TabControllerSpots',

        // Templates
        'volumedocumentationlayout': volumePathPrefix + 'documentation.html'
    }
});
