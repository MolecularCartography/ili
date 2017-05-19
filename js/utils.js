'use strict';

define([],
function() {
    var FILE_EXT_SEPARATOR = '.';

    var Utils = {
        isWebkit: navigator.userAgent.toLowerCase().indexOf('webkit') > -1,

        SupportedImageFormats: ['png', 'jpg', 'jpeg'],

        keyPressEvent: function() {
            return this.isWebkit ? 'keydown' : 'keypress';
        },

        asProps: function(object, props) {
            props = props || {};
            for (var i in object) {
                props[i] = {
                    value: object[i],
                    enumerable: true
                };
            }
            return props;
        },

        getFileExtension: function (url) {
            var extensionStartPos = url.lastIndexOf(FILE_EXT_SEPARATOR);
            return (-1 == extensionStartPos || extensionStartPos == url.length - 1) ? '' : url.substring(extensionStartPos + 1);
        },

        boundNumber: function (min, value, max) {
            return (value < min) ? min : (value > max) ? max : value;
        }
    };

    /* File is not supported natively in all browsers, so we have to use this */
    Utils.File = function (data, name) {
        this.data = (typeof File !== 'undefined' && data instanceof File) ? data : new Blob(data);
        this.name = name;
    };
    Utils.File.prototype = Object.create(Blob.prototype, {
        size: {
            get: function () {
                return this.data.size;
            }
        },
        type: {
            get: function () {
                return this.data.type;
            }
        },
        slice: {
            value: function () {
                return this.data.slice(arguments);
            }
        }
    });

    return Utils;
});
