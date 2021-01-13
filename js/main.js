require(['modulebootstrap'], function(moduleBootstrap) {

    const attributeName = 'moduleName';
    const buttonIds = ['surfaceBtn', 'volumeBtn'];
    if (moduleBootstrap.startup()) {
        buttonIds.forEach(e => {
            const button = document.getElementById(e);
            const moduleName = button.getAttribute(attributeName);
            button.addEventListener('click', function() {
                moduleBootstrap.bootstrapByModuleName(moduleName);
            });
        });
    }

});