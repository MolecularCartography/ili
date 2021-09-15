'use strict';

define([
    'abcviewcontroller',
    'controlsgrid',
    'utils'
],
function (EmperorViewControllerABC, ControlGrid, Utils) {
    function TabControllerBase(container, title, description, workspace) {
        EmperorViewControllerABC['EmperorViewControllerABC'].call(this, container, title, description);

        this._workspace = workspace;
        this._controlGrid = new ControlGrid(this.$body);
        return this;
    }

    TabControllerBase.prototype = Object.create(EmperorViewControllerABC['EmperorViewControllerABC'].prototype, {
        addNumeric: {
            value: function (object, key, name, min, max, delay) {
                return this._controlGrid.addNumeric(object, key, name, min, max, delay);
            }
        },

        addChoice: {
            value: function (object, key, name, options) {
                return this._controlGrid.addChoice(object, key, name, options);
            }
        },

        addColor: {
            value: function (object, key, name) {
                return this._controlGrid.addColor(object, key, name);
            }
        },

        addGroupBox: {
            value: function (name) {
                return this._controlGrid.addGroupBox(name);
            }
        },

        addFlag: {
            value: function (object, key, name) {
                return this._controlGrid.addFlag(object, key, name);
            }
        },

        addTransferFunctionControl: {
            value: function (object, key, name) {
                return this._controlGrid.addTransferFunctionControl(object, key, name);
            }
        },

        addAction: {
            value: function (name, handler) {
                return this._controlGrid.addAction(name, handler);
            }
        },

        addHintBlock: {
            value: function (text) {
                return this._controlGrid.addHintBlock(text);
            }
        },

        addHtmlBlock: {
            value: function (html) {
                return this._controlGrid.addHtmlBlock(html);
            }
        },

        refresh: {
            value: function () {
                this._controlGrid.refresh();
            }
        },

        activate: {
            value: function () {
                $('a[href=#' + this.identifier + ']').tab('show');
            }
        },

        toJSON: {
            value: function () {
                return this._controlGrid.toJSON();
            }
        },

        fromJSON: {
            value: function (json) {
                return this._controlGrid.fromJSON(json);
            }
        },

        _makeProxyProperty: {
            value: function(owner, key, converter) {
                const proxyResult = {};
                const result = {};

                const value = owner[key];
                const properties = Object.keys(value);
                for (let i = 0; i < properties.length; i++) {
                    const property = properties[i];
                    proxyResult[property] = owner[key][property];
                    Object.defineProperty(result, properties[i], {
                        get: function(prop) {
                            return proxyResult[prop];
                        }.bind(owner, properties[i]),
        
                        set: function(prop, value) {
                            if (converter) {
                                value = converter(value, prop);
                            }
                            proxyResult[prop] = value;
                            owner[key] = Object.assign({}, proxyResult);
                        }.bind(this, properties[i])
                    });  
                }
                result.refresh = () => {
                    for (let property in properties) {
                        proxyResult[property] = owner[key][property];
                    }
                };
                return result;
            }
        }
    });


    return TabControllerBase;
});
