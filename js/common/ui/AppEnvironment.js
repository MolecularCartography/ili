/**
 * Main application page.
 */
'use strict';

define(['modulebootstrap', 'mainlayout'],
    function (moduleBootstrap, appLayout)
    {
        function AppEnvironment(appContainer) {
            this._appContainer = document.createElement('div');
            this._appContainer.id = 'ili-container';
            this._appContainer.innerHTML = appLayout;
            appContainer.appendChild(this._appContainer);
            return this;
        };

        AppEnvironment.prototype = Object.create(null, {

            /* Property used to show/hide the sidebar
             */
            controlsVisible: {
                get: function() {
                    return this._controlsVisible;
                },
                set: function (visible) {
                    visible = !!visible;
                    if (visible !== this._controlsVisible) {
                        var controlsSwitcher = this._appContainer.querySelector('#controls-switcher');
                        controlsSwitcher.click();
                        controlsSwitcher.style.visibility = visible ? 'visible' : 'hidden';
                        this._controlsVisible = visible;
                    }
                }
            },

            appContainer: {
                get: function() {
                    return this._appContainer;
                }
            },

            setAppStatus: {
                value: function(statusText) {
                    var statusContainer = this._appContainer.querySelector('#status');
                    if (statusText) {
                        var textField = statusContainer.querySelector('span');
                        textField.innerHTML = statusText;
                        statusContainer.style.visibility = 'visible';
                    } else {
                        statusContainer.style.visibility = 'hidden';
                    }
                }
            },

            setAppErrorsStatus: {
                value: function (errors) {
                    var errorBox = this._appContainer.querySelector('div#errors');
                    var list = errorBox.querySelector('ul');
                    list.textContent = '';
                    errors.forEach(function (error) {
                        var item = document.createElement('li');
                        item.textContent = error;
                        list.appendChild(item);
                    });
                    if (errors.length == 0) {
                        errorBox.setAttribute('hidden', 'true');
                    } else {
                        errorBox.removeAttribute('hidden');
                    }
                }
            },
        });

        return AppEnvironment;
});
