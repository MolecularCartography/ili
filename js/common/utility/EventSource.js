'use strict';

define([],
function() {
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
            const listenerBucket = this._listeners[eventName];
            listenerBucket.push(listener);
            return {
                unsubscribe: () => {
                    const index = listenerBucket.indexOf(listener);
                    listenerBucket.splice(index, 1);
                }
            };
        },

        _notify: function(eventName, args) {
            var listeners = this._listeners[eventName];
            for (var i = 0; i < listeners.length; i++) {
                listeners[i](args);
            }
        },
    };

    return EventSource;
});
