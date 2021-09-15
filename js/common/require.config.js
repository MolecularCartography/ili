const pathPrefix = 'js/common/';

require.config({
    paths: {
        // Ui.
        'appbase': 'js/common/ui/AppBase',
        'appenvironment': 'js/common/ui/AppEnvironment',
        'dragndrop': 'js/common/ui/DragAndDrop',
        'scene3dbase': 'js/common/ui/Scene3DBase',
        'view3dbase': 'js/common/ui/View3DBase',
        'viewgroup3dbase': 'js/common/ui/ViewGroup3DBase',
        'tabcontrollerbase': 'js/common/ui/TabControllerBase',
        'mapselectorbase': 'js/common/ui/MapSelectorBase',
        'controlsgrid': 'js/common/ui/ControlsGrid',
        'spotlabelbase': 'js/common/ui/SpotLabelBase',
        'spotlabel2d': 'js/common/ui/SpotLabel2D',
        'spotlabel3d': 'js/common/ui/SpotLabel3D',
        'spotscontrollerbase': 'js/common/ui/SpotsControllerBase',
        'viewcontainerbase': 'js/common/ui/ViewContainerBase',
        'viewgroupbase': 'js/common/ui/ViewGroupBase',
        'viewlegend': 'js/common/ui/ViewLegend',
        'workspacebase': 'js/common/ui/WorkspaceBase',
        'viewlegendbase': 'js/common/ui/ViewLegendBase',
        'settingscontrollerbase': 'js/common/ui/SettingsControllerBase',

        // Utilities.
        'colormaps': 'js/common/utility/ColorMaps',
        'transferfunction': 'js/common/utility/TransferFunction',
        'eventsource': 'js/common/utility/EventSource',
        'inputfilesprocessor': 'js/common/utility/InputFilesProcessor',
        'utils': 'js/common/utility/utils',
        'filecombination': 'js/common/utility/FileCombination',
        'bounds': 'js/common/utility/Bounds',
        'indexer1d': 'js/common/utility/Indexer1D',
        'shaderloader': 'js/common/utility/ShaderLoader',
        'shaderschunk': 'js/common/utility/ShadersChunk',
        'taskcontroller': 'js/common/utility/TaskController',
        'workercontroller': 'js/common/utility/WorkerController',
        'propertychangedmanager': 'js/common/utility/PropertyChangedManager',

        // Workers.
        'downloader': 'js/common/workers/Downloader',
        'settingsloader': 'js/common/workers/SettingsLoader'
    }
});
