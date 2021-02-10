'use strict';

define(['utils'],
function (Utils) {
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
        return this;
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
                    var defaultValue = { files: [], handler: null };
                    var result = { files: [], handler: null };

                    for (var i = 0; i < this.children.length; ++i) {
                        var childMatch = this.children[i].getMatchingFiles(urls);
                        var matchValid = childMatch.files.length > 0;
                        var accepted = false;
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

    return FileCombination;
});
