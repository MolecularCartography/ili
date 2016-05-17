'use strict';

define([],
function() {
    function DragAndDrop(workspace, container, fileHandler) {
        this._counter = 0;
        this._workspace = workspace;
        this._appContainer = container;
        this._fileHandler = fileHandler;

        Object.getOwnPropertyNames(DragAndDrop.prototype).forEach(function(e) {
            var fn = this[e];
            if (typeof fn == 'function') {
                container.addEventListener(e, this[e].bind(this), true);
            }
        }.bind(this));
    }

    DragAndDrop.prototype = Object.create(null, {
        dragenter: {
            value: function(e) {
                e.preventDefault();
                if (++this._counter == 1) {
                    this._appContainer.setAttribute('drop-target', '');
                }
            }
        },

        dragleave: {
            value: function(e) {
                e.preventDefault();
                if (--this._counter === 0) {
                    this._appContainer.removeAttribute('drop-target');
                }
            }
        },

        dragover: {
            value: function(e) {
                e.preventDefault();
            }
        },

        drop: {
            value: function(e) {
                this._counter = 0;
                this._appContainer.removeAttribute('drop-target');

                e.preventDefault();
                e.stopPropagation();

                this._fileHandler(e.dataTransfer.files);
            }
        }
    });

    return DragAndDrop;
});


