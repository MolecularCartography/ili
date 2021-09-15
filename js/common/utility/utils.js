'use strict';

define([],
function() {
    var FILE_EXT_SEPARATOR = '.';

    const fileServiceUrl = 'https://ili-file-service.herokuapp.com/';
    var Utils = {
        
        FILE_SERVICE: fileServiceUrl,
        FILE_SERVICE_PREFIX: fileServiceUrl + '?',

        isWebkit: navigator.userAgent.toLowerCase().indexOf('webkit') > -1,

        isMobile: (function(a){return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4));})(navigator.userAgent||navigator.vendor||window.opera),

        FileSizeStrings: ['b', 'Kb', 'Mb'],

        keyPressEvent: function() {
            return 'keydown';
        },

        // Copied from https://github.com/miguelmota/webgl-detect
        webglEnabled: function() {
            var canvas = document.createElement('canvas');
            var contextNames = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'];
            var context;

            if (navigator.userAgent.indexOf('MSIE') > -1) {
                try {
                    context = WebGLHelper.CreateGLContext(canvas, 'canvas');
                } catch (e) { }
            } else {
                for (var i = 0; i < contextNames.length; i++) {
                    try {
                        context = canvas.getContext(contextNames[i]);
                        if (context) {
                            break;
                        }
                    } catch (e) { }
                }
            }
            return !!context;
        },

        webgl2Enabled: function() {
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('webgl2');
            return !!context;
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

        formatFileSize: function (size) {
            let index = 0;
            const sizeStrings = this.FileSizeStrings;
            while (size > 1024 && index < sizeStrings.length) {
                size /= 1024;
                index++;
            }
            const sizeString = size.toString();
            const maxSize = sizeString.indexOf('.') == -1 ? 3 : 4;
            return `${sizeString.substr(0, Math.min(sizeString.length, maxSize))} ${sizeStrings[index]}`;
        },

        getFileExtension: function (url) {
            var extensionStartPos = url.lastIndexOf(FILE_EXT_SEPARATOR);
            return (-1 == extensionStartPos || extensionStartPos == url.length - 1) ? '' : url.substring(extensionStartPos + 1);
        },

        boundNumber: function (min, value, max) {
            return (value < min) ? min : (value > max) ? max : value;
        }
    };

    Utils.setupProxyObject = function(owner, properties, callback) {
        for (var i = 0; i < properties.length; i++) {
            Object.defineProperty(owner, properties[i], {
                get: function(prop) {
                    return owner[prop];
                }.bind(owner, properties[i]),

                set: function(prop, value) {
                    owner[prop] = value;
                    callback.call(owner);
                }.bind(this, properties[i])
            });  
        }
        return owner;
    };

    Utils.makeProxyProperty = function(field, properties, callback) {
        var proxyName = 'proxy' + field;
        this[proxyName] = null;
        return {
            get: function() {
                if (this[proxyName]) return this[proxyName];
                this[proxyName] = {};
                Utils.setupProxyObject(this[proxyName], properties, callback);
                return this[proxyName];
            },

            set: function(value) {
                for (var i = 0; i < properties.length; i++) {
                    var prop = properties[i];
                    this[field][prop] = value[prop];
                }
                callback.call(this);
            }
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
