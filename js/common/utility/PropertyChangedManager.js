define([],
    function() {
        class PropertyChangedManager {
            constructor(source, eventMap, owner, callback) {
                this._source = source;
                this._eventMap = eventMap;
                this._owner = owner;
                this._callback = callback;

                this._eventListener = (event) => {
                    const handler = this._eventMap.get(event.name);
                    if (handler) {             
                        handler(this._owner, event.getter);
                    }
                    if (this._callback) {
                        this._callback();
                    }           
                };
                this._source.addEventListener('propertyChanged', this._eventListener);
            }

            invokeAllActions() {
                for (let pair of this._eventMap) {
                    const name = pair["0"];
                    const handler = this._eventMap.get(name);
                    handler(this._owner, () => this._source[name]);
                }
                if (this._callback) {
                    this._callback();
                }
            }

            dispose() {
                this._source.removeEventListener('propertyChanged', this._eventListener);
            }
        }

        return PropertyChangedManager;
    }
);
