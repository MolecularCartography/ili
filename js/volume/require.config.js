const volumePathPrefix = 'js/volume/';
requirejs.config({
    paths: {
        // Utilities
        'rawvolumedata': 'js/volume/utility/RawVolumeData',
        'threejsutils': 'js/volume/utility/ThreeJsUtils',
        'volumenormalsprocessor': 'js/volume/utility/VolumeNormalsProcessor',
        'volumeremappingprocessor':  'js/volume/utility/VolumeRemappingProcessor',
        'colormaptexturerenderer': 'js/volume/utility/ColorMapTextureRenderer',
        'volumedatacache': 'js/volume/utility/VolumeDataCache',

        // Core
        'volumerendermesh': volumePathPrefix + 'core/VolumeRenderMesh',
        'volumesettingscontroller': volumePathPrefix + 'core/SettingsController',
        'volumeinputfilesprocessor': volumePathPrefix + 'core/InputFilesProcessor',
        'volumescene2d': volumePathPrefix + 'core/Scene2D',
        'volumescene3d': volumePathPrefix + 'core/Scene3D',
        'volumeview2d': volumePathPrefix + 'core/View2D',
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
