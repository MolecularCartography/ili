/**
 * UI control (#map-selector) which let the user to select an active map
 * (measurement). Text input lets type filter for map name. Item list (.items)
 * shows only items that contain the filter's substring (and highlights it).
 *
 * @param {Workspace} workspace.
 * @param {HTMLDivElement} div Main HTML element (#map-selector).
 * @mapName {HTMLElement|SGVElement} mapName Element to show current map name.
 */
function MapSelector(workspace, div, mapName) {
    this._workspace = workspace;
    this._div = div;
    this._mapName = mapName;
    this._input = this._div.querySelector('input');
    this._itemsContainer = this._div.querySelector('.items');
    this._filter = '';
    this._effectTimeout = 0;
    this._measures = null;
    this._selectedIndex = -1;
    this._div.style.opacity = 0;
    this._active = false;
    this._workspace.addEventListener(
            'intensities-change', this._onWorkspaceIntencitiesChange.bind(this));
    this._input.addEventListener('input', this._onInput.bind(this));
    this._input.addEventListener('blur', this._onBlur.bind(this));

    this._input.addEventListener(g_keyPressEvent, this._onKeyPress.bind(this), false);
    this._itemsContainer.addEventListener('mousedown', this._onItemMouseDown.bind(this), false);
    this._itemsContainer.addEventListener('click', this._onItemClick.bind(this), false);
    this._onWorkspaceIntencitiesChange();
}

MapSelector.prototype = Object.create(null, {
    _onWorkspaceIntencitiesChange: {
        value: function() {
            if (!this._workspace.measures) {
                this._measures = [];
                return;
            }
            var escape = this._escapeHTML.bind(this);

            this._measures = this._workspace.measures.map(function(x) {
                var e = escape(x.name);
                return {
                    name: x.name,
                    text: e,
                    lower: e.toLowerCase(),
                    index: x.index
                };
            });

            this._selectIndex(this._measures.length ? 0 : -1);

            this._applyFilter();
        }
    },

    filter: {
        get: function() {
            return this._filter;
        },

        set: function(value) {
            this._filter = value;
            this._input.value = value;
            this._applyFilter();
        }
    },

    activate: {
        value: function() {
            this._active = true;
            var div = this._div;
            div.hidden = false;
            this._input.focus();
            this._input.select();
            this._effect(0).then(function() {
                div.style.opacity = 1;
            });
        }
    },

    deactivate: {
        value: function() {
            this._active = false;
            var div = this._div;
            div.style.opacity = 0;
            this._effect(200).then(function() {
                div.hidden = true;
            });
        }
    },

    blink: {
        value: function() {
            if (this._active) return;
            var div = this._div;
            div.hidden = false;
            this._effect(0).then(function() {
                div.style.opacity = 0.2;
            })
            .then(this._effect.bind(this, 400))
            .then(function() {
                div.style.opacity = 0;
            })
            .then(this._effect.bind(this, 200))
            .then(function() {
                div.hidden = true;
            });
        }
    },

    _effect: {
        value: function(timeout) {
            if (this._effectTimeout) clearTimeout(this._effectTimeout);
            return new Promise(function(resolve) {
                this._effectTimeout = setTimeout(function() {
                    this._effectTimeout = 0;
                    resolve();
                }.bind(this), timeout);
            }.bind(this));
        }
    },

    _applyFilter: {
        value: function() {
            var selectedIndex = this._selectedIndex;

            if (!this._filter) {
                this._itemsContainer.innerHTML = this._measures.map(function(x) {
                    return '<div index="' + x.index + '"' + (x.index == selectedIndex ? ' selected' : '') + '>' + x.text + '</div>';
                }).join('')
                return;
            }
            var f = this._escapeHTML(this._filter.toLowerCase());
            var result = [];
            for (var i = 0; i < this._measures.length; i++) {
                var x = this._measures[i];
                var index = x.lower.indexOf(f);
                if (index < 0) continue;
                var highlighted = '<div index="' + x.index + '"' + (x.index == selectedIndex ? ' selected' : '') + '>' +
                        x.text.substr(0, index) + '<b>' + x.text.substr(index, f.length) + '</b>' + x.text.substr(index + f.length) + '</div>';
                result.push(highlighted);
            }
            this._itemsContainer.innerHTML = result.join('');
        }
    },

    selectedItem: {
        get: function() {
            return this._itemsContainer.querySelector('[selected]');
        },
        set: function(value) {
            function isElementHidden(el) {
                var rect = el.getBoundingClientRect();
                var parentRect = el.parentElement.getBoundingClientRect();
                if (rect.top < parentRect.top) {
                    return 1;
                } else if (rect.bottom > parentRect.bottom) {
                    return -1;
                } else {
                    return 0;
                }
            }

            if (value && value.parentElement != this._itemsContainer) throw 'Invalid parameter';
            var prev = this.selectedItem;
            if (prev) prev.removeAttribute('selected');
            if (value) {
                value.setAttribute('selected', '');

                var scrollDirection = isElementHidden(value);
                scrollDirection = scrollDirection > 0 ? true : scrollDirection < 0 ? false : null;
                if (null !== scrollDirection && 'scrollIntoView' in value) {
                    value.scrollIntoView(scrollDirection);
                }

                this._selectIndex(Number(value.getAttribute('index')));
            }
        }
    },

    _selectIndex: {
        value: function(value) {
            this._selectedIndex = value;
            if (value >= 0) {
                this._mapName.textContent = this._measures[value].name;
                this._workspace.selectMap(value);
            } else {
                this._mapName.textContent = '';
            }
        }
    },

    _onInput: {
        value: function(event) {
            this._filter = this._input.value;
            this._applyFilter();
        }
    },

    _onBlur: {
        value: function(event) {
            this.deactivate();
        }
    },

    _onDocumentKeyDown: {
        value: function() {
            if (event.altKey || !event.ctrlKey) return;

            if (this._handleNavigationalKeyDown(event)) {
                event.preventDefault();
                event.stopPropagation();
                this.blink();
            }
        }
    },

    _onKeyPress: {
        value: function(event) {
            if (event.ctrlKey || event.ctrlKey || event.metaKey) return;

            var key = (event.which ? event.which : event.keyCode).toString();
            switch (key) {
                case '38': // ArrowUp
                    this.navigate(MapSelector.Direction.UP);
                    break;

                case '40': // ArrowDown
                    this.navigate(MapSelector.Direction.DOWN);
                    break;

                case '33': // PageUp
                    this.navigate(MapSelector.Direction.PAGE_UP);
                    break;

                case '34': // PageDown
                    this.navigate(MapSelector.Direction.PAGE_DOWN);
                    break;

                case '13': // Enter
                case '27': // Escape
                    this.deactivate();
                    break;

                default:
                    return;
            }
            event.preventDefault();
            event.stopPropagation();
        }
    },

    navigate: {
        value: function(direction) {
            switch (direction) {
                case MapSelector.Direction.UP:
                    var prev = this.selectedItem;
                    var next = prev ? prev.previousElementSibling : this._itemsContainer.firstElementChild;
                    if (next) this.selectedItem = next;
                    break;

                case MapSelector.Direction.DOWN:
                    var prev = this.selectedItem;
                    var next = prev ? prev.nextElementSibling : this._itemsContainer.firstElementChild;
                    if (next) this.selectedItem = next;
                    break;

                case MapSelector.Direction.PAGE_UP:
                    var len = Math.max(10, this._itemsContainer.childElementCount / 10);
                    if (!len) return;
                    var item = this.selectedItem;
                    if (!item) item = this._itemsContainer.lastElementChild;
                    for (var i = 0; i < len; i++) {
                        if (!item.previousElementSibling) break;
                        item = item.previousElementSibling;
                    }
                    this.selectedItem = item;
                    break;

                case MapSelector.Direction.PAGE_DOWN:
                    var len = Math.max(10, this._itemsContainer.childElementCount / 10);
                    if (!len) return;
                    var item = this.selectedItem;
                    if (!item) item = this._itemsContainer.firstElementChild;
                    for (var i = 0; i < len; i++) {
                        if (!item.nextElementSibling) break;
                        item = item.nextElementSibling;
                    }
                    this.selectedItem = item;
                    break;
            }
        }
    },

    _onItemMouseDown: {
        value: function(event) {
            event.stopPropagation();
            event.preventDefault();
        }
    },

    _onItemClick: {
        value: function(event) {
            if (event.target == this._itemsContainer) return;
            var item = event.target;
            while (item.parentElement != this._itemsContainer) {
                item = item.parentElement;
            }
            this.selectedItem = item;
            this.activate();
            event.stopPropagation();
            event.preventDefault();
        }
    },

    _escapeHTML: {
        value: function(x) {
            var entityMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;'
            };

            return String(x).replace(/[&<>"]/g, function(s) {
              return entityMap[s];
            });
        }
    }
});

MapSelector.Direction = {
    UP: 1,
    DOWN: 2,
    PAGE_UP: 3,
    PAGE_DOWN: 4
};