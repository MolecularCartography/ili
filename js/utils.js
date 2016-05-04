'use strict';

define([],
function() {
    var Utils = {
        isWebkit: navigator.userAgent.toLowerCase().indexOf('webkit') > -1,
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
        }
    };

    return Utils;
});
