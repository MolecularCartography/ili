define('ili', [], function () {
    return function () {

        // Load css. 
        // TODO: replace lib csss to appropriate folder.
        loadCss('js/lib/css/bootstrap.min.css');
        loadCss('js/lib/css/bootstrap-colorpicker.min.css');
        loadCss('js/lib/css/bootstrap-select.min.css');
        loadCss('js/lib/css/bootstrap-slider.min.css');
        loadCss('js/lib/css/jquery-ui.min.css');
        loadCss('js/lib/css/jquery.bootstrap-touchspin.min.css');
        loadCss('main.css');
        loadCss('layout.css');

        require.config({
            paths: {
                  /* HTML templates */
                  'modulebootstrap': './js/bootstrap',
                  'mainlayout': './template.html',
                  'initiallayout': './initial-template.html'
            },
        });

        require(['./js/main', './js/require.config']);

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

