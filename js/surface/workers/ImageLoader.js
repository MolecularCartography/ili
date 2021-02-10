'use strict';

define([],
function () {
    /**
    * Worker-like object what loads an image and calculate it sizes
    * (can't be a worker because uses Image).
    */
    function ImageLoader() {
        this.onmessage = null;
        this._reader = new FileReader();
        this._reader.onload = this._onFileLoad.bind(this);
        this._reader.onerror = this._onError.bind(this);
        this._image = new Image();
        this._image.onload = this._onImageLoad.bind(this);
        this._image.onerror = this._onError.bind(this);
        this._terminated = false;
        this._url = null;
        this._fileType = null;
        this._fileName = null;
    };

    ImageLoader.prototype = Object.create(null, {
        terminate: {
            value: function () {
                this._terminated = true;
                if (this._reader.readyState == 1) {
                    this._reader.abort();
                }
                if (this._url) {
                    URL.revokeObjectURL(this._url);
                    this._url = null;
                }
            }
        },

        postMessage: {
            value: function (blob) {
                this._fileType = blob.type;
                this._fileName = 'name' in blob ? blob.name : null;
                this._reader.readAsArrayBuffer(blob.data);
            }
        },

        _send: {
            value: function (message) {
                if (!this._terminated && this.onmessage) {
                    this.onmessage({ data: message });
                }
            }
        },

        _onFileLoad: {
            value: function (event) {
                var blob = new Blob([event.target.result], { type: this._fileType });
                this._url = URL.createObjectURL(blob);
                this._image.src = this._url;
            }
        },

        _onImageLoad: {
            value: function (event) {
                var url = this._url;
                this._url = null; // Ownership transfered.
                this._send({
                    status: 'completed',
                    url: url,
                    name: this._fileName,
                    width: this._image.width,
                    height: this._image.height
                });
            }
        },

        _onError: {
            value: function (event) {
                console.info('Failure loading image', event);
                this._send({
                    status: 'failed',
                    message: 'Can not read image. See log for details.',
                });
            }
        }
    });

    return ImageLoader;
});
