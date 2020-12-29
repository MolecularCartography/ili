requirejs.config({
    paths: {
        // Utilities
        'rawvolumedata': 'js/volume/utility/RawVolumeData',
        'threejsutils': 'js/volume/utility/ThreeJsUtils',
        'volumenormalsprocessor': 'js/volume/utility/VolumeNormalsProcessor',
        'volumeremappingprocessor':  'js/volume/utility/VolumeRemappingProcessor',
        'colormaptexturerenderer': 'js/volume/utility/ColorMapTextureRenderer',
        'volumedatacache': 'js/volume/utility/volumedatacache',

        // Core
        'volumerendermesh': 'js/volume/core/VolumeRenderMesh',
        'volumesettingscontroller': 'js/volume/core/SettingsController',
        'volumeinputfilesprocessor': 'js/volume/core/InputFilesProcessor',
        'volumescene2d': 'js/volume/core/Scene2D',
        'volumescene3d': 'js/volume/core/Scene3D',
        'volumeview2d': 'js/volume/core/View2D',
        'volumeview3d': 'js/volume/core/View3D',
        'volumeviewcontainer': 'js/volume/core/ViewContainer',
        'volumeviewgroup3d': 'js/volume/core/ViewGroup3D',
        'volumeworkspace': 'js/volume/core/Workspace',
        'volumemapselector': 'js/volume/core/MapSelector',
        'volumespotscontroller': 'js/volume/core/SpotsController',
        'volumeviewlegend': 'js/volume/core/ViewLegend',

        // Workers
        'volumecuboidmapper': 'js/volume/workers/cuboidmapper',
        'volumemeasuresloader': 'js/volume/workers/measurerloader',
        'volumeloader': 'js/volume/workers/volumeloader',

        // Tabs
        'volumetabcontroller3d': 'js/volume/tabs/TabController3D',
        'volumetabcontrollerdocumentation': 'js/volume/tabs/TabControllerDocumentation',
        'volumetabcontrollerexamples': 'js/volume/tabs/TabControllerExamples',
        'volumetabcontrollermapping': 'js/volume/tabs/TabControllerMapping',
        'volumetabcontrollerspots': 'js/volume/tabs/TabControllerSpots',

        // Shaders
        'volumeshaders':  'js/volume/shaders/volumeshaders',
    }
});