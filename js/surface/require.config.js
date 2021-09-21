const surfacePathPrefix = 'js/surface/';
requirejs.config({
    paths: {
        // Utilities
        'surfacesettingscontroller': surfacePathPrefix + 'core/SettingsController',
        'surfacescene2d': surfacePathPrefix + 'core/Scene2D',
        'surfacescene3d': surfacePathPrefix + 'core/Scene3D',
        'surfaceview2d': surfacePathPrefix + 'core/View2D',
        'surfaceview3d': surfacePathPrefix + 'core/View3D',
        'surfaceviewcontainer': surfacePathPrefix + 'core/ViewContainer',
        'surfaceviewgroup3d': surfacePathPrefix + 'core/ViewGroup3D',
        'surfaceworkspace': surfacePathPrefix + 'core/Workspace',
        'surfacemapselector': surfacePathPrefix + 'core/MapSelector',
        'surfacespotscontroller': surfacePathPrefix + 'core/SpotsController',
        'surfaceviewlegend': surfacePathPrefix + 'core/ViewLegend',

        // Tabs
        'surfacetabcontroller3d': surfacePathPrefix + 'tabs/TabController3D',
        'surfacetabcontrollerdocumentation': surfacePathPrefix + 'tabs/TabControllerDocumentation',
        'surfacetabcontrollerexamples': surfacePathPrefix + 'tabs/TabControllerExamples',
        'surfacetabcontrollermapping': surfacePathPrefix + 'tabs/TabControllerMapping',
        'surfacetabcontrollerspots': surfacePathPrefix + 'tabs/TabControllerSpots',

        // Workers
        'imageloader': surfacePathPrefix + 'workers/ImageLoader',
        'mapper': surfacePathPrefix + 'workers/Mapper',
        'materialloader': surfacePathPrefix + 'workers/MaterialLoader',
        'surfacemeasuresloader': surfacePathPrefix + 'workers/MeasurerLoader',
        'meshloader': surfacePathPrefix + 'workers/MeshLoader',
        'raycaster': surfacePathPrefix + 'workers/Raycaster',

        // Templates
        'surfacedocumentationlayout': surfacePathPrefix + 'documentation.html'
    }
});