define([], function() {
    return '<div class="row">' +
        '<div id="rendering-area" class="col-xs-8">' +
            '<div id="view-container">' +
                '<button id="controls-switcher" class="btn btn-default" data-toggle="collapse" data-target="#controls-area"><span class="glyphicon glyphicon-chevron-right"></span></button>' +
                '<div class="ViewWelcome">' +
                    '<div class="message"><div><span id="open-button">Open</span> files or drag-and-drop them into the window</div></div>' +
                '</div>' +
                '<div class="View2D">' +
                    '<img>' +
                    '<canvas />' +
                '</div>' +
                '<div class="ViewGroup3D" layout="single">' +
                    '<canvas></canvas>' +
                    '<div class="View3D" id="view-3d-1">' +
                        '<orientation-widget id="orientation-widget-1"></orientation-widget>' +
                    '</div>' +
                    '<div class="View3D" id="view-3d-2">' +
                        '<orientation-widget id="orientation-widget-2"></orientation-widget>' +
                    '</div>' +
                    '<div class="View3D" id="view-3d-3">' +
                        '<orientation-widget id="orientation-widget-3"></orientation-widget>' +
                    '</div>' +
                    '<div class="View3D" id="view-3d-4">' +
                        '<orientation-widget id="orientation-widget-4"></orientation-widget>' +
                    '</div>' +
                    '<div class="HoverSpot"></div>' +
                '</div>' +
                '<svg class="ViewLegend" xmlns="http://www.w3.org/2000/svg">' +
                    '<defs>' +
                        '<linearGradient id="colorMapGradient" x1="0" y1="0" x2="100%" y2="0">' +
                            '<stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1"></stop>' +
                            '<stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1"></stop>' +
                        '</linearGradient>' +
                    '</defs>' +
                    '<rect x="0" y="0" width="100%" height="100%" fill="gray" fill-opacity="0.5" />' +
                    '<text id="current-map-label" x="100" y="20" fill="black" text-anchor="middle" cursor="pointer" font-size="14" />' +
                    '<rect x="10" y="30" width="180" height="20" style="fill:url(#colorMapGradient)" />' +
                    '<text id="minLabel" x="10" y="70" fill="black" text-anchor="start" font-size="14" />' +
                    '<text id="scaleLabel" x="100" y="70" fill="black" text-anchor="middle" font-size="14" />' +
                    '<text id="maxLabel" x="190" y="70" fill="black" text-anchor="end" font-size="14" />' +
                '</svg>' +
            '</div>' +
            '<div id="status">' +
                '<div class="load-indicator"></div>' +
                '<span></span>' +
            '</div>' +
            '<div id="map-selector" hidden><input type="text" autocomplete="off"><div class="items"></div></div>' +
            '<div id="drop-target-informer"><div class="message">Drop files here</div></div>' +
            '<div id="errors" hidden>' +
                'Errors:' +
                '<ul></ul>' +
                '<button id="close">Close</button>' +
            '</div>' +
        '</div>' +
        '<div id="controls-area" class="col-xs-4 in" aria-expanded="true">' +
            '<div id="tabs-container">' +
                '<ul id="tabs-list" class="nav nav-tabs sidebar-tabs" role="tablist"></ul>' +
            '</div>' +
        '</div>' +
    '</div>';
});
