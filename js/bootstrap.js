define(['initiallayout'], function(initialTemplate) {

    const moduleNameToMapPath = new Map([
        ['surface', 'js/surface/main'],
        ['volume', 'js/volume/main']
    ]);

    var bootstrapRoutines = Object.create(null, {

        bootstrapByRequirePath: {
            value: function(mainPath, callback) {
                if (this.initialContainer) {
                    this.parentContainer.removeChild(this.initialContainer);
                }        
                require(['js/common/ui/appenvironment'], function(AppEnvironment) {
                    const environment = new AppEnvironment(document.body);
                    environment.setAppStatus('Initializing workspace...');
                    require([mainPath], function (ili) { 
                        const app = new ili(environment, document.body);
                        if (callback) {
                            callback(app);
                        }
                        environment.setAppStatus(null);
                    });
                });
            }
        },

        bootstrapByModuleName: {
            value: function(moduleName, callback) {
                const modulePath = moduleNameToMapPath.get(moduleName);
                if (!modulePath) {
                    return null;
                }
                bootstrapRoutines.bootstrapByRequirePath(modulePath, callback);
            }
        },

        startup: {
            value: function() {
                this.parentContainer = document.body;
                if (!this._processAddressLine()) {
                    this.initialContainer = document.createElement('div');
                    this.initialContainer.className = 'main';
                    
                    this.initialContainer.innerHTML = initialTemplate;
                    this.parentContainer.appendChild(this.initialContainer);
                    return true;
                }
                else {
                    console.log('Using address line startup parameters.');
                }
                return false;
            }
        },

        _processAddressLine: {
            value: function() {
                if (window.location.search) {
                    const fallbackModule = 'surface';
                    const splitResult = window.location.search.substr(1).split(';');
                    const moduleName = splitResult[0];
                    if (!bootstrapRoutines.bootstrapByModuleName(moduleName, (app) => {             
                        console.log('Module name is not specified by the address line. Using [' + fallbackModule + '] module.');
                        app.submitInitialFiles(splitResult.slice(1));
                    })) {
                        bootstrapRoutines.bootstrapByModuleName(fallbackModule, (app) => {
                            app.submitInitialFiles(splitResult);
                        });
                    }
                    return true;
                }
                return false;
            }
        },

    });

    return bootstrapRoutines;
});