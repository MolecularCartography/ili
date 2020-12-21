requirejs.config({
    paths: {
        // Utilities
        'surfacesettingscontroller': 'js/surface/core/SettingsController',
        'surfaceinputfilesprocessor': 'js/surface/core/InputFilesProcessor',
        'surfacescene2d': 'js/surface/core/Scene2D',
        'surfacescene3d': 'js/surface/core/Scene3D',
        'surfaceview2d': 'js/surface/core/View2D',
        'surfaceview3d': 'js/surface/core/View3D',
        'surfaceviewcontainer': 'js/surface/core/ViewContainer',
        'surfaceviewgroup3d': 'js/surface/core/ViewGroup3D',
        'surfaceworkspace': 'js/surface/core/Workspace',
        'surfacemapselector': 'js/surface/core/MapSelector',
        'surfacespotscontroller': 'js/surface/core/SpotsController',
        'surfaceviewlegend': 'js/surface/core/ViewLegend',

        // Tabs
        'surfacetabcontroller3d': 'js/surface/tabs/TabController3D',
        'surfacetabcontrollerdocumentation': 'js/surface/tabs/TabControllerDocumentation',
        'surfacetabcontrollerexamples': 'js/surface/tabs/TabControllerExamples',
        'surfacetabcontrollermapping': 'js/surface/tabs/TabControllerMapping',
        'surfacetabcontrollerspots': 'js/surface/tabs/TabControllerSpots',

        // Workers
        'imageloader': 'js/surface/workers/ImageLoader',
        'mapper': 'js/surface/workers/Mapper',
        'materialloader': 'js/surface/workers/MaterialLoader',
        'surfacemeasuresloader': 'js/surface/workers/MeasurerLoader',
        'meshloader': 'js/surface/workers/MeshLoader',
        'raycaster': 'js/surface/workers/Raycaster'
    }
});