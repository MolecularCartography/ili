/**
 * Base class that provides event popagation functionality.
 * @param events Events enum type.
 */
function EventSource(events) {
    this._listeners = {};
    for (var i in events) {
        this._listeners[events[i]] = [];
    }
}

EventSource.prototype = {
    addEventListener: function(eventName, listener) {
        this._listeners[eventName].push(listener);
    },
    
    _notify: function(eventName) {
        var listeners = this._listeners[eventName];
        for (var i = 0; i < listeners.length; i++) {
            listeners[i]();
        }
    },
};