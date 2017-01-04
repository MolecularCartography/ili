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
                    get() {
                        return slider.bootstrapSlider('getValue');
                    },
                    set(val) {
                        slider.bootstrapSlider('setValue', val);
                        paramValue.innerText = val;
                    },
                    enable() {
                        slider.bootstrapSlider('enable');
                    },
                    disable() {
                        slider.bootstrapSlider('disable');
                    },
                    refresh() {
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
                    initval: object[key]
                });
                spinbox.on('change', function (event) {
                    object[key] = spinbox.val();
                });

                return {
                    get() {
                        return spinbox.val();
                    },
                    set(val) {
                        spinbox.val(val);
                    },
                    enable() {
                        spinbox.prop('disabled', false);
                    },
                    disable() {
                        spinbox.prop('disabled', true);
                    },
                    refresh() {
                        this.set(object[key]);
                    }
                };
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

                var values = [];
                options.map(function (val) {
                    var complexVal = Array.isArray(val);
                    var displayVal = complexVal ? val[0] : val;
                    var dataVal = values.length;
                    values.push(complexVal ? val[1] : val);
                    layout += '<option value="' + dataVal + '">' + displayVal + '</option>';
                });
                layout += '</select></div></div></div>';

                this._$container.append(layout);
                var selector = $('#' + controlId).selectpicker();
                selector.on('changed.bs.select', function(e, clickedIndex, newValue, oldValue) {
                    object[key] = values[e.target.value];
                });

                var result = {
                    get() {
                        return selector.val();
                    },
                    set(val) {
                        selector.selectpicker('val', val);
                        selector.selectpicker('refresh');
                    },
                    enable() {
                        selector.prop('disabled', false);
                        selector.selectpicker('refresh');
                    },
                    disable() {
                        selector.prop('disabled', true);
                        selector.selectpicker('refresh');
                    },
                    refresh() {
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
                    get() {
                        return colorPicker.colorpicker('getValue');
                    },
                    set(val) {
                        colorPicker.colorpicker('setValue', val);
                    },
                    enable() {
                        colorPicker.colorpicker('enable');
                    },
                    disable() {
                        colorPicker.colorpicker('disable');
                    },
                    refresh() {
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
                    get() {
                        return checkbox.prop('checked');
                    },
                    set(val) {
                        colorPicker.prop('checked', val);
                        object[key] = val; // 'change' event isn't fired when the value is set programmatically
                    },
                    enable() {
                        checkbox.prop('disabled', false);
                    },
                    disable() {
                        checkbox.prop('disabled', true);
                    },
                    refresh() {
                        checkbox.prop('checked', object[key]);
                    }
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

        addTextBlock: {
            value: function (text) {
                var layout = '<div class="row">';
                layout += '<div class="col-xs-12">';
                layout += '<div class="alert alert-success" role="alert">' + text + '</div></div>';
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
                Object.keys(json).map(function (key, index) {
                    if (typeof this._params[key].set === 'function') {
                        this._params[key].set(json[key]);
                    } else {
                        this._params[key].fromJSON(json[key]);
                    }
                });
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
