'use strict';

define(['utils'],
    function (Utils) {
        function VolumeInputFilesProcessor(workspace) {
            this._supportedInput = [
                new FileCombination('json', workspace.loadSettings.bind(workspace)),

            ];
        }

        VolumeInputFilesProcessor.prototype = Object.create(null, {
            /* @inputFiles is a list of File objects */
            process: {
                value: function (inputFiles) {
                    const inputFileUrls = inputFiles.map(function (item) {
                        return item.name.toLowerCase();
                    });

                    const recognizedInput = this._supportedInput.map(function (fileCombination) {
                        return fileCombination.getMatchingFiles(inputFileUrls);
                    }).sort(function (match1, match2) {
                        return match1.files.length < match2.files.length;
                    });

                    // leave unambiguous set of file handlers, i.e. 1 file -> 1 handler
                    const allRecognizedFiles = {};
                    for (var i = 0; i < recognizedInput.length; ++i) {
                        const curFiles = recognizedInput[i].files;
                        let currentCombinationNotValid = false;
                        for (let fileIdx = 0; fileIdx < curFiles.length; ++fileIdx) {
                            if (!(curFiles[fileIdx] in allRecognizedFiles)) {
                                allRecognizedFiles[curFiles[fileIdx]] = null;
                            } else {
                                for (let addedFileIdx = 0; addedFileIdx < fileIdx; ++addedFileIdx) {
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

                    const unprocessedFiles = [];
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
                    let result = null;
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
            AND: 'and',
            OR: 'or',
            OPTIONAL: 'optional'
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
                    const prevChild = new FileCombination(this.children === null ? this.extension : this.children, this.relation);
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
                        const defaultValue = {files: [], handler: null};
                        const result = {files: [], handler: null};

                        for (let i = 0; i < this.children.length; ++i) {
                            const childMatch = this.children[i].getMatchingFiles(urls);
                            const matchValid = childMatch.files.length > 0;
                            let accepted = false;
                            switch (this.relation) {
                                case FileCombination.RELATION.AND:
                                    /* All combinations should match */
                                    if (!matchValid) {
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
                                        return defaultValue;
                                    } else {
                                        accepted = true;
                                    }
                                    break;
                                default:
                                    throw 'Unexpected relation between input file types';
                            }
                            if (accepted) {
                                Array.prototype.push.apply(result.files, childMatch.files);
                                result.handler = this._handler || null;
                            }
                        }
                        return result;
                    } else if (this.extension) {
                        const match = urls.find(function (url) {
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

        return VolumeInputFilesProcessor;
    });
