'use strict';

define([
    'bootstrap_colorpicker',
    'bootstrap_select',
    'bootstrap_slider',
    'bootstrap_spinbox'
],
function(bs_colorpicker, bs_select, bs_slider, bs_spinbox) {
    function ControlGrid($container) {
        this._$container = $container;
        this._params = {};
        return this;
    }

    ControlGrid.prototype = Object.create(null, {
        addNumeric: {
            value: function (object, key, name, min, max) {
                var result = (min === undefined || max === undefined)
                    ? this._addUnlimitedNumeric(object, key, name)
                    : this._addRestrictedNumeric(object, key, name, min, max);
                this._params[this._toKey(name)] = result;
                return result;
            }
        },

        _addRestrictedNumeric: {
            value: function (object, key, name, min, max) {
                var controlIds = this._generateControlId();
                var controlId = controlIds['control-id'];
                var valueId = controlIds['value-id'];

                var layout = '<div class="row">';
                layout += '<div class="col-xs-12">';
                layout += '<div class="col-xs-3 control-name-column">' + name + '</div>';
                layout += '<div class="col-xs-7"><input id="' + controlId
                    + '" type="text" data-provide="slider" data-slider-tooltip="hide"></div>';
                layout += '<div class="col-xs-2 control-value-column" id="' + valueId + '"></div></div></div>';

                this._$container.append(layout);
                var paramValue = document.getElementById(valueId);
                paramValue.innerText = object[key];
                var slider = $('#' + controlId).bootstrapSlider({
                    max: max,
                    min: min,
                    step: 0.01,
                    value: object[key]
                });
                slider.on('slide', function (event) {
                    object[key] = event.value;
                    paramValue.innerText = event.value;
                });

                return {
                    get: function() {
                        return slider.bootstrapSlider('getValue');
                    },
                    set: function(val) {
                        slider.bootstrapSlider('setValue', val, true);
                        paramValue.innerText = val;
                    },
                    enable: function() {
                        slider.bootstrapSlider('enable');
                    },
                    disable: function() {
                        slider.bootstrapSlider('disable');
                    },
                    refresh: function() {
                        this.set(object[key]);
                    }
                };
            }
        },


        _addUnlimitedNumeric: {
            value: function (object, key, name) {
                var controlIds = this._generateControlId();
                var controlId = controlIds['control-id'];
                var valueId = controlIds['value-id'];

                var layout = '<div class="row">';
                layout += '<div class="col-xs-12">';
                layout += '<div class="col-xs-3 control-name-column">' + name + '</div>';
                layout += '<div class="col-xs-7"><input id="' + controlId + '" type="text"></div></div></div>';

                this._$container.append(layout);
                var spinbox = $('#' + controlId).TouchSpin({
                    min: -Number.MAX_SAFE_INTEGER,
                    max: Number.MAX_SAFE_INTEGER,
                    initval: object[key],
                    decimals: 2
                });
                spinbox.on('change', function (event) {
                    if (!spinbox.prop('settings_update_ongoing')) {
                        object[key] = spinbox.val();
                    }
                });

                var spinboxPropWrapper = function (prop, initVal) {
                    spinbox.prop(prop, initVal);
                    return function (val) {
                        if (val === undefined) {
                            return spinbox.prop(prop);
                        } else {
                            spinbox.prop('settings_update_ongoing', true); // for some reason, "touchspin.updatesettings" event triggers unnecessary "change" event
                            var settings = {};
                            settings[prop] = val;
                            spinbox.trigger("touchspin.updatesettings", settings);
                            // have to duplicate the value as an HTML attribute to be able to read it later
                            // TouchSpin doesn't currently support options retrieval
                            spinbox.prop(prop, val);
                            spinbox.prop('settings_update_ongoing', false);
                            return this;
                        }
                    };
                };

                var result = {
                    get: function() {
                        return spinbox.val();
                    },
                    set: function(val) {
                        spinbox.val(val);
                        spinbox.trigger('change');
                    },
                    enable: function() {
                        spinbox.prop('disabled', false);
                    },
                    disable: function() {
                        spinbox.prop('disabled', true);
                    },
                    refresh: function() {
                        this.set(object[key]);
                    }
                };
                result.step = spinboxPropWrapper('step', 1);
                result.min = spinboxPropWrapper('min', -Number.MAX_SAFE_INTEGER);
                result.max = spinboxPropWrapper('max', Number.MAX_SAFE_INTEGER);
                return result;
            }
        },

        addChoice: {
            value: function (object, key, name, options) {
                var controlIds = this._generateControlId();
                var controlId = controlIds['control-id'];

                var layout = '<div class="row">';
                layout += '<div class="col-xs-12">';
                layout += '<div class="col-xs-3 control-name-column">' + name + '</div>';
                layout += '<div class="col-xs-7">';
                layout += '<select class="selectpicker" id="' + controlId + '">';

                options.map(function (val) {
                    var isComplexVal = Array.isArray(val);
                    var displayVal = isComplexVal ? val[0] : val;
                    var dataVal = isComplexVal ? val[1] : val;
                    layout += '<option value="' + dataVal + '">' + displayVal + '</option>';
                });
                layout += '</select></div></div></div>';

                this._$container.append(layout);
                var selector = $('#' + controlId).selectpicker();
                var countOfOptions = options.length;
                selector.on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
                    for (var i = 0; i < countOfOptions; ++i) {
                        if (e.currentTarget[i].selected) {
                            object[key] = e.currentTarget[i].value;
                            break;
                        }
                    }
                });

                var result = {
                    get: function() {
                        return selector.val();
                    },
                    set: function(val) {
                        selector.selectpicker('val', val);
                        selector.selectpicker('refresh');
                        selector.trigger('changed.bs.select');
                    },
                    enable: function() {
                        selector.prop('disabled', false);
                        selector.selectpicker('refresh');
                    },
                    disable: function() {
                        selector.prop('disabled', true);
                        selector.selectpicker('refresh');
                    },
                    refresh: function() {
                        this.set(object[key]);
                    }
                };
                this._params[this._toKey(name)] = result;
                return result;
            }
        },

        addColor: {
            value: function (object, key, name) {
                var controlIds = this._generateControlId();
                var controlId = controlIds['control-id'];

                var layout = '<div class="row">';
                layout += '<div class="col-xs-12">';
                layout += '<div class="col-xs-3 control-name-column">' + name + '</div>';
                layout += '<div class="col-xs-7">';
                layout += '<input id="' + controlId + '" type="text" class="form-control" value="' + object[key] + '"></div></div></div>';

                this._$container.append(layout);
                var colorPicker = $('#' + controlId).colorpicker().on('changeColor', function (e) {
                    object[key] = e.color.toHex();
                    colorPicker.css('background-color', object[key]);
                    colorPicker.css('color', this._getContrastColor(object[key]));
                }.bind(this));
                colorPicker.css('background-color', object[key]);
                colorPicker.css('color', this._getContrastColor(object[key]));
                var result = {
                    get: function() {
                        return colorPicker.colorpicker('getValue');
                    },
                    set: function(val) {
                        colorPicker.colorpicker('setValue', val);
                    },
                    enable: function() {
                        colorPicker.colorpicker('enable');
                    },
                    disable: function() {
                        colorPicker.colorpicker('disable');
                    },
                    refresh: function() {
                        this.set(object[key]);
                    }
                };
                this._params[this._toKey(name)] = result;
                return result;
            }
        },

        addFlag: {
            value: function (object, key, name) {
                var controlIds = this._generateControlId();
                var controlId = controlIds['control-id'];

                var layout = '<div class="row">';
                layout += '<div class="col-xs-12">';
                layout += '<div class="col-xs-3 control-name-column">' + name + '</div>';
                layout += '<div class="col-xs-7 checkbox">';
                layout += '<input id="' + controlId + '" type="checkbox"></div></div></div>';

                this._$container.append(layout);
                var checkbox = $('#' + controlId);
                checkbox.prop('checked', object[key]);
                checkbox.change(function () {
                    object[key] = $(this).prop('checked');
                });
                var result = {
                    get: function() {
                        return checkbox.prop('checked');
                    },
                    set: function(val) {
                        checkbox.prop('checked', val);
                        checkbox.trigger('change'); // 'change' event isn't fired when the value is set programmatically
                    },
                    enable: function() {
                        checkbox.prop('disabled', false);
                    },
                    disable: function() {
                        checkbox.prop('disabled', true);
                    },
                    refresh: function () {
                        checkbox.prop('checked', object[key]);
                    },
                    restoreFirst: false
                };
                this._params[this._toKey(name)] = result;
                return result;
            }
        },

        addAction: {
            value: function (name, handler) {
                var controlIds = this._generateControlId();
                var controlId = controlIds['control-id'];

                var layout = '<div class="row">';
                layout += '<div class="col-xs-12">';
                layout += '<button id="' + controlId + '" class="btn btn-default btn-block btn-text">' + name + '</button></div></div>';

                this._$container.append(layout);
                var button = $('#' + controlId);
                button.on('click', handler);
            }
        },

        addHintBlock: {
            value: function (text) {
                var layout = '<div class="row">';
                layout += '<div class="col-xs-12">';
                layout += '<div class="alert alert-success" role="alert"><p class="text-center">' + text + '</p></div></div></div>';
                this._$container.append(layout);
            }
        },

        addHtmlBlock: {
            value: function (html) {
                var layout = '<div class="row">';
                layout += '<div class="col-xs-12">';
                layout += html + '</div></div>';
                this._$container.append(layout);
            }
        },

        addGroupBox: {
            value: function (name) {
                var controlIds = this._generateControlId();
                var controlId = controlIds['control-id'];

                var subContainerId = 'sub-' + controlId;
                var layout = '<div class="row"><div class="col-xs-12"><div class="panel-group">';
                layout += '<div class="panel panel-default" data-toggle="collapse" data-target="#'
                    + subContainerId + '"><div id="' + controlId + '" class="panel-heading">';
                layout += '<div class="panel-title btn-text">' + '<span id="arrow-' + controlId
                    + '" class="indicator glyphicon glyphicon-chevron-down pull-left"></span>&nbsp;'
                    + name + '</div></div></div></div>';
                layout += '<div id="' + subContainerId + '" class="panel-collapse collapse"></div>';

                this._$container.append(layout);
                var fieldSet = this._$container.find('#' + subContainerId);
                var result = new ControlGrid(fieldSet);
                this._params[this._toKey(name)] = result;

                var collapseIndicator = this._$container.find('#arrow-' + controlId);
                this._$container.find('div.panel.panel-default').on('click', function () {
                    collapseIndicator.toggleClass('glyphicon-chevron-down');
                    collapseIndicator.toggleClass('glyphicon-chevron-up');
                });

                return result;
            }
        },

        refresh: {
            value: function () {
                Object.keys(this._params).forEach(function (paramName) {
                    this._params[paramName].refresh();
                }, this);
            }
        },

        toJSON: {
            value: function () {
                var result = {};
                Object.keys(this._params).map(function (key, index) {
                    result[key] = typeof this._params[key].get === 'function' ? this._params[key].get() : this._params[key].toJSON();
                }.bind(this));
                return result;
            }
        },

        fromJSON: {
            value: function (json) {
                var firstToBeRestored = {};
                var rest = {};
                for (var key in this._params) {
                    if ('restoreFirst' in this._params[key] && this._params[key].restoreFirst) {
                        firstToBeRestored[key] = this._params[key];
                    } else {
                        rest[key] = this._params[key];
                    }
                }

                for (var key in firstToBeRestored) {
                    if (key in json) {
                        this._paramFromJSON(key, json[key]);
                    }
                }

                for (var key in rest) {
                    if (key in json) {
                        this._paramFromJSON(key, json[key]);
                    }
                }
            }
        },

        _paramFromJSON: {
            value: function (key, newValue) {
                if (key in this._params) {
                    if (typeof this._params[key].set === 'function') {
                        this._params[key].set(newValue);
                    } else {
                        this._params[key].fromJSON(newValue);
                    }
                }
            }
        },

        _toKey: {
            value: function (name) {
                return name.toLowerCase().replace(/\s/g, "-");
            }
        },

        _getContrastColor: {
            value: function (hexcolor) {
                return (parseInt(hexcolor.slice(1), 16) > 0xffffff/2) ? 'black' : 'white';
            }
        },

        _generateControlId: {
            value: function () {
                var gridRowId = Math.round(1000000 * Math.random());
                var controlId = 'control-' + gridRowId;
                var valueId = 'value-' + gridRowId;
                return { 'control-id': controlId, 'value-id': valueId };
            }
        }
    });

    return ControlGrid;
});
