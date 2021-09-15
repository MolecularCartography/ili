'use strict';

define([],
function () {

    function WorkerController() {
        return this;
    }

    WorkerController.prototype = Object.create(null, {
        processMessage: {
            value: function(e) {
                switch (e.id) {
                    case 'cancel':
                        this.state = 'canceled';
                        this.onCancel();
                        break;
                    case 'setup':
                        this.state = 'running';
                        this.setupData = data;
                        this.onSetup(data);
                        break;
                    case 'shutdown':
                        this.state = 'shutdown';
                        this.onShutdown();
                        break;
                }
            }
        },

        checkIfCancelled: {
            value: function() {
                return this.state == 'canceled';
            }
        },

        onCancel: {
            value: function() {

            }
        },

        onSetup: {
            value: function(data) {
                             
            }
        },

        onShutdown: {
            value: function(data) {
                             
            }
        }

    });

    return WorkerController;
});
