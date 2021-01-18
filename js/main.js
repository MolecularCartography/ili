require(['initiallayout'], function(initialTemplate) {
    const parentContainer = document.body;

    const initialContainer = document.createElement('div');
    initialContainer.className = 'main';
    initialContainer.innerHTML = initialTemplate;
    parentContainer.appendChild(initialContainer);

    document.getElementById('surfaceBtn').addEventListener('click', function() {
        bootstrap('js/surface/main');
    });
    document.getElementById('volumeBtn').addEventListener('click', function() {
        bootstrap('js/volume/main');
    });

    function bootstrap(mainPath) {
        parentContainer.removeChild(initialContainer);
        require(['appenvironment'], function(AppEnvironment) {
            const environment = new AppEnvironment(document.body);
            environment.setAppStatus('Initializing workspace...');
            require([mainPath], function (ili) { 
                new ili(environment, document.body);
                environment.setAppStatus(null);
            });
        });
    }
});
