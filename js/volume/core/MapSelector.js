/**
 * UI control (#map-selector) which let the user to select an active map
 * (measurement). Text input lets type filter for map name. Item list (.items)
 * shows only items that contain the filter's substring (and highlights it).
 *
 * @param {Workspace} workspace.
 * @param {HTMLDivElement} div Main HTML element (#map-selector).
 * @mapName {HTMLElement|SGVElement} mapName Element to show current map name.
 */

'use strict';

define([
    'mapselectorbase'
],
function(MapSelectorBase) {
    function MapSelector(workspace, div, mapName) {
        MapSelectorBase.call(this, workspace, div, mapName);
        return this;
    }

    MapSelector.prototype = Object.create(MapSelectorBase.prototype);

    return MapSelector;
});
