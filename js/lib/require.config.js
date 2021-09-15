require.config({
    'paths': {
        'filesaver': 'js/lib/FileSaver.min',
        'jquery': 'js/lib/jquery-2.1.4.min',
        'jqueryui': 'js/lib/jquery-ui.min',
        'bootstrap': 'js/lib/bootstrap.min',

        /* ZLib */
        'gunzip': 'js/lib/gunzip.min',

        /* jQuery plugins */
        'jquery_drag': 'js/lib/jquery.event.drag-2.2.min',
        'chosen': 'js/lib/chosen.jquery.min',

        /* Bootstrap plugins */
        'bootstrap_colorpicker': 'js/lib/bootstrap-colorpicker.min',
        'bootstrap_select': 'js/lib/bootstrap-select.min',
        'bootstrap_slider': 'js/lib/bootstrap-slider.min',
        'bootstrap_spinbox': 'js/lib/jquery.bootstrap-touchspin.min',

        /* THREE.js */
        'three': 'js/lib/three.min',
        'orbitcontrols': 'js/lib/OrbitControls',
        'volume': 'js/lib/Volume',
        'mtlloader': 'js/lib/MTLLoader',
        'objloader': 'js/lib/OBJLoader',
        'nrrdloader': 'js/lib/NRRDLoader',
        'underscore': 'js/lib/underscore.min',

        /* SlickGrid */
        'slickcore': 'js/lib/slick.core.min',
        'slickgrid': 'js/lib/slick.grid.min',
        'slickformatters': 'js/lib/slick.editors.min',
        'slickeditors': 'js/lib/slick.formatters.min',

        'tween': 'js/lib/tween.min',
        'transferfunctioncontrol': 'transferFunctionControl/TransferFunctionControl',
        'drawing': 'transferFunctionControl/Drawing',
        'coordstransformer': 'transferFunctionControl/CoordsTransformer',
        'objectcache': 'transferFunctioncontrol/ObjectCache',
        'actioncontroller' : 'js/common/interactivitySystem/ActionController',
        'rotatestate' : 'js/common/interactivitySystem/RotateState',
        'zoombymousemovestate' : 'js/common/interactivitySystem/ZoomByMouseMoveState',
        'zoombymousewheelstate' : 'js/common/interactivitySystem/ZoomByMouseWheelState',
        'panstate' : 'js/common/interactivitySystem/PanState',
        'camerahelper': 'js/common/interactivitySystem/CameraHelper',
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
