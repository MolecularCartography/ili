define('ili', [], function () {
return function (container, baseUrl) {

    baseUrl = baseUrl || '/';

    loadCss(baseUrl + 'js/lib/css/bootstrap.min.css');
    loadCss(baseUrl + 'js/lib/css/bootstrap-colorpicker.min.css');
    loadCss(baseUrl + 'js/lib/css/bootstrap-select.min.css');
    loadCss(baseUrl + 'js/lib/css/bootstrap-slider.min.css');
    loadCss(baseUrl + 'js/lib/css/jquery-ui.min.css');
    loadCss(baseUrl + 'js/lib/css/jquery.bootstrap-touchspin.min.css');
    loadCss(baseUrl + 'main.css');
    loadCss(baseUrl + 'layout.css');

    require.config({
        'baseUrl': baseUrl,
        // the left side is the module name, and the right side is the path
        // do NOT include the .js extension
        'paths': {
            'filesaver': './js/lib/FileSaver.min',
            'jquery': './js/lib/jquery-2.1.4.min',
            'jqueryui': './js/lib/jquery-ui.min',
            'bootstrap': './js/lib/bootstrap.min',

            /* jQuery plugins */
            'jquery_drag': './js/lib/jquery.event.drag-2.2.min',
            'chosen': './js/lib/chosen.jquery.min',

            /* Bootstrap plugins */
            'bootstrap_colorpicker': './js/lib/bootstrap-colorpicker.min',
            'bootstrap_select': './js/lib/bootstrap-select.min',
            'bootstrap_slider': './js/lib/bootstrap-slider.min',
            'bootstrap_spinbox': './js/lib/jquery.bootstrap-touchspin.min',

            /* THREE.js */
            'three': './js/lib/three.min',
            'orbitcontrols': './js/lib/OrbitControls',
            'mtlloader': './js/lib/MTLLoader',

            /* `ili's objects */
            'appsettingscontroller': './js/AppSettingsController',
            'colormaps': './js/ColorMaps',
            'controlsgrid': './js/ControlsGrid',
            'dragndrop': './js/DragAndDrop',
            'eventsource': './js/EventSource',
            'imageloader': './js/workers/ImageLoader',
            'inputfilesprocessor': './js/InputFilesProcessor',
            'main': './js/main',
            'mapselector': './js/MapSelector',
            'materialloader': './js/workers/MaterialLoader',
            'scene2d': './js/Scene2D',
            'scene3d': './js/Scene3D',
            'spotlabel2d': './js/SpotLabel2D',
            'spotlabel3d': './js/SpotLabel3D',
            'spotlabelbase': './js/SpotLabelBase',
            'spotscontroller': './js/SpotsController',
            'tabcontroller3d': './js/TabController3D',
            'tabcontrollerbase': './js/TabControllerBase',
            'tabcontrollerdocumentation': './js/TabControllerDocumentation',
            'tabcontrollerexamples': './js/TabControllerExamples',
            'tabcontrollermapping': './js/TabControllerMapping',
            'tabcontrollerspots': './js/TabControllerSpots',
            'view2d': './js/View2D',
            'view3d': './js/View3D',
            'viewcontainer': './js/ViewContainer',
            'viewgroup3d': './js/ViewGroup3D',
            'viewlegend': './js/ViewLegend',
            'workspace': './js/Workspace',
            'utils': './js/utils',

            /* HTML templates */
            'mainlayout': './template.html',
            'documentationlayout': './documentation.html',

            /* emperor */
            'abcviewcontroller': 'js/emperor/abc-view-controller',

            'underscore': 'js/lib/underscore.min',

            /* SlickGrid */
            'slickcore': 'js/lib/slick.core.min',
            'slickgrid': 'js/lib/slick.grid.min',
            'slickformatters': 'js/lib/slick.editors.min',
            'slickeditors': 'js/lib/slick.formatters.min'
        },
        /*
            Libraries that are not AMD compatible need shim to declare their
            dependencies.
            */
        'shim': {
            'jquery_drag': ['jquery', 'jqueryui'],
            'chosen': {
                deps: ['jquery'],
                exports: 'jQuery.fn.chosen'
            },
            'slickcore': ['jqueryui'],
            'slickgrid': ['slickcore', 'jquery_drag', 'slickformatters', 'slickeditors'],
            'bootstrap': ['jquery'],
            'bootstrap_colorpicker': ['bootstrap'],
            'bootstrap_select': ['bootstrap'],
            'bootstrap_slider': {
                deps: ['bootstrap'],
                exports: 'Slider'
            },
            'bootstrap_spinbox': ['bootstrap', 'jqueryui']
        }
    });

    require(['main'], function (ili) {
        var app = new ili(container);
    });

    // using this makes `ili load its styles independently of external code
    // copied from http://requirejs.org/docs/faq-advanced.html#css
    function loadCss(url) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = url;
        document.getElementsByTagName("head")[0].appendChild(link);
    }
}
});

