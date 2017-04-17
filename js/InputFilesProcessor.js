'use strict';

define(['utils'],
function (Utils) {
    function InputFilesProcessor(workspace) {
        this._supportedInput = [
            new FileCombination('csv', workspace.loadIntensities.bind(workspace)),
            new FileCombination('json', workspace.loadSettings.bind(workspace)),
            new FileCombination(Utils.SupportedImageFormats, workspace.loadImage.bind(workspace), FileCombination.RELATION.OR),
            new FileCombination('stl', workspace.loadMesh.bind(workspace)),
            new FileCombination('obj', workspace.loadMesh.bind(workspace)),
            new FileCombination(['mtl', new FileCombination(Utils.SupportedImageFormats,
                null, FileCombination.RELATION.OR)], workspace.loadMaterial.bind(workspace), FileCombination.RELATION.AND)
        ];
    }

    InputFilesProcessor.prototype = Object.create(null, {
        /* @inputFiles is a list of File objects */
        process: {
            value: function (inputFiles) {
                var inputFileUrls = inputFiles.map(function (item) {
                    return item.name.toLowerCase();
                });

                var fileRecognitionSorter = function (match1, match2) {
                    return match1.files.length < match2.files.length;
                };

                var recognizedInput = this._supportedInput.map(function (fileCombination) {
                    return fileCombination.getMatchingFiles(inputFileUrls);
                }).sort(fileRecognitionSorter);

                // leave unambiguous set of file handlers, i.e. 1 file -> 1 handler
                var allRecognizedFiles = {};
                for (var i = 0; i < recognizedInput.length; ++i) {
                    var curFiles = recognizedInput[i].files;
                    var currentCombinationNotValid = false;
                    for (var fileIdx = 0; fileIdx < curFiles.length; ++fileIdx) {
                        if (!(curFiles[fileIdx] in allRecognizedFiles)) {
                            allRecognizedFiles[curFiles[fileIdx]] = null;
                        } else {
                            for (var addedFileIdx = 0; addedFileIdx < fileIdx; ++addedFileIdx) {
                                delete allRecognizedFiles[addedFileIdx];
                            }
                            currentCombinationNotValid = true;
                            break;
                        }
                    }
                    if (currentCombinationNotValid || !recognizedInput[i].files.length) {
                        recognizedInput.splice(i, 1);
                        --i;
                    }
                }

                for (var i = 0; i < recognizedInput.length; ++i) {
                    recognizedInput[i].handler(inputFiles.filter(function (file) {
                        return this.files.indexOf(file.name.toLowerCase()) > -1;
                    }.bind(recognizedInput[i])));
                }

                var unprocessedFiles = [];
                inputFileUrls.forEach(function (url) {
                    if (!(url in allRecognizedFiles)) {
                        unprocessedFiles.push(url);
                    }
                });
                if (unprocessedFiles.length) {
                    console.log('Some files were not recognized: "' + unprocessedFiles.join('", "') + '"');
                }
            }
        }
    });

    function FileCombination(extensions, handler, relation) {
        this._handler = handler || null;
        this._relation = relation || null;
        if (Array.isArray(extensions) && extensions.length > 1) {
            if (!relation) {
                throw 'Relation between input file types is not specified';
            }
            this._children = extensions.map(function (ext) {
                var result = null;
                if (typeof ext === 'string') {
                    result = new FileCombination(ext);
                } else if (ext instanceof FileCombination) {
                    result = ext;
                } else {
                    throw 'Unexpected object type found';
                }
                return result;
            });
            this._extension = null;
        } else if (typeof extensions === 'string') {
            if (!extensions) {
                throw 'Empty file extension is not supported';
            }
            this._children = null;
            this._extension = extensions;
        } else {
            throw 'Unexpected object type found';
        }
    }

    FileCombination.RELATION = {
        AND: 1,
        OR: 2,
        OPTIONAL: 3
    };

    FileCombination.prototype = Object.create(null, {
        extension: {
            get: function () {
                return this._extension;
            }
        },

        children: {
            get: function () {
                return this._children;
            }
        },

        relation: {
            get: function () {
                return this._relation;
            }
        },

        addRelation: {
            value: function (combination, handler, relation) {
                if (!relation) {
                    throw 'Relation between input file types is not specified';
                }
                if (!(combination instanceof FileCombination)) {
                    throw 'Unexpected object type found';
                }
                var prevChild = new FileCombination(this.children === null ? this.extension : this.children, this.relation);
                this._relation = relation;
                this._children = [prevChild, combination];
                this._handler = handler || null;
                this._extension = null;
            }
        },

        /* @inputFileUrls is a list of lowercased file URLs */
        /* returns an object {files: [...], handler: function} for matched files */
        getMatchingFiles: {
            value: function (urls) {
                if (this.children) {
                    var skipToEnd = false;
                    var defaultValue = { files: [], handler: null };
                    return this.children.reduce(function (accumulator, childCombination, childIndex) {
                        if (skipToEnd) {
                            return accumulator;
                        }
                        var childMatch = childCombination.getMatchingFiles(urls);
                        var matchValid = childMatch.files.length > 0;
                        var accepted = false;
                        switch (this.relation) {
                            case FileCombination.RELATION.AND:
                                /* All combinations should match */
                                if (!matchValid) {
                                    skipToEnd = true;
                                    return defaultValue;
                                } else {
                                    accepted = true;
                                }
                                break;
                            case FileCombination.RELATION.OR:
                                accepted = matchValid;
                                break;
                            case FileCombination.RELATION.OPTIONAL:
                                /* The first file should match, the rest are optional */
                                if (childIndex == 0 && !matchValid) {
                                    skipToEnd = true;
                                    return defaultValue;
                                } else {
                                    accepted = true;
                                }
                                break;
                            default:
                                throw 'Relation between input file types is not specified';
                        }
                        if (accepted) {
                            Array.prototype.push.apply(accumulator.files, childMatch.files);
                            accumulator.handler = this._handler || null;
                        }
                        return accumulator;
                    }.bind(this), defaultValue);
                } else if (this.extension) {
                    var match = urls.find(function (url) {
                        return Utils.getFileExtension(url) === this.extension;
                    }.bind(this));
                    return match ? {
                        files: [match],
                        handler: this._handler || null
                    } : {
                        files: [],
                        handler: null
                    };
                } else {
                    throw 'Invalid file combination object';
                }
            }
        }
    });

    return InputFilesProcessor;
});
