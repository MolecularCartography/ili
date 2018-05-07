'use strict';

define(['imageloader', 'mtlloader', 'three', 'utils'],
function (ImageLoader, MTLLoader, THREE, Utils) {
    /**
    * Worker-like object what loads THREE.js material representation
    * (can't be a worker because uses the document object).
    */
    function MaterialLoader() {
        this.onmessage = null;
        this._terminated = false;
        this._materialFile = null;
        this._fileReader = new FileReader();
        this._fileReader.onload = this._onFileLoad.bind(this);
        this._fileReader.onerror = this._onError.bind(this);
        this._imageLoader = new ImageLoader();
        this._imageLoader.onmessage = this._onImageLoad.bind(this);
        this._pendingImages = 0;
        this._imageData = {};
        this._materialLoader = new MTLLoader();
    };

    MaterialLoader.prototype = Object.create(null, {
        terminate: {
            value: function () {
                this._imageLoader.terminate();
                if (this._fileReader.readyState == 1) {
                    this._fileReader.abort();
                }
                this._terminated = true;
            }
        },

        postMessage: {
            value: function (files) {
                this._materialFile = findFilesByExtensions(files, ['mtl'])[0];
                var imageFiles = findFilesByExtensions(files, Utils.SupportedImageFormats);
                this._pendingImages = imageFiles.length;
                imageFiles.forEach(function (file) {
                    this._imageLoader.postMessage(file);
                }.bind(this));
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
                var materialCreator = this._materialLoader.parse(event.target.result);
                for (var materialName in materialCreator.materialsInfo) {
                    var mat = materialCreator.materialsInfo[materialName];
                    for (var imageFileName in this._imageData) {
                        var imageData = this._imageData[imageFileName];
                        for (var prop in mat) {
                            if (typeof mat[prop] === 'string'
                                && (mat[prop] === imageFileName || mat[prop].endsWith('/' + imageFileName)))
                            {
                                mat[prop] = imageData.url;
                            }
                        }
                    }
                }
                materialCreator.preload();
                this._send({
                    status: 'completed',
                    materials: materialCreator.getAsArray()
                });
            }
        },

        _onImageLoad: {
            value: function (message) {
                // Take only filename from a potential URL
                var filenameStart = message.data.name.lastIndexOf('/');
                var filename = filenameStart == -1 ? message.data.name
                                                   : message.data.name.substring(filenameStart + 1);

                if (filename in this._imageData) {
                    console.warn('Two or more image texture files with same names are found: ' + filename
                                + '\nUsing the latter one.');
                }

                this._imageData[filename] = {
                    url: message.data.url,
                    width: message.data.width,
                    height: message.data.height
                };
                if (this._pendingImages <= 0) {
                    throw 'Unexpected image loaded';
                } else {
                    this._pendingImages -= 1;
                }
                if (this._pendingImages === 0) {
                    var mtlContent = this._fileReader.readAsText(this._materialFile.data);
                }
            }
        },

        _onError: {
            value: function (event) {
                console.info('Failure loading mesh material', event);
                this._send({
                    status: 'failed',
                    message: 'Can not read material files. See log for details.'
                });
            }
        }
    });

    function findFilesByExtensions(files, extensions) {
        if (!Array.isArray(extensions)) {
            throw 'Array of strings is expected. Actual type is "' + typeof extensions + '"';
        }
        return files.filter(function (file) {
            var url = file.name.toLowerCase();
            return extensions.indexOf(Utils.getFileExtension(url)) > -1;
        })
    }

    return MaterialLoader;
});
