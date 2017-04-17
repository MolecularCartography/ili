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
        }
    };

    return Utils;
});
