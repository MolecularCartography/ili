define([], function() {
    return '﻿<div id="documentation-container">' +

    '<h4 class="highlighted-text">Common operations</h4>' +
    '<table>' +
        '<thead>' +
            '<tr>' +
                '<th>Action</th>' +
                '<th>Shortcut</th>' +
                '<th>Alternative</th>' +
            '</tr>' +
        '</thead>' +
        '<tbody>' +
            '<tr>' +
                '<td>Open files</td>' +
                '<td><kbd>Ctrl</kbd>+<kbd>O</kbd></td>' +
                '<td>Drag and drop files to the browser window</td>' +
            '</tr>' +
            '<tr>' +
                '<td>Switch between molecular maps</td>' +
                '<td><kbd>Ctrl</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd></td>' +
                '<td>Click on a name of an active map above the colorbar</td>' +
            '</tr>' +
            '<tr>' +
                '<td>Find a molecular map by its name</td>' +
                '<td><kbd>Ctrl</kbd>+<kbd>F</kbd></td>' +
                '<td>Click on a name of an active map above the colorbar and start typing.</td>' +
            '</tr>' +
            '<tr>' +
                '<td>Save view as image</td>' +
                '<td><kbd>Ctrl</kbd>+<kbd>S</kbd></td>' +
                '<td>NA</td>' +
            '</tr>' +
            '<tr>' +
                '<td>Save cartographical snapshot</td>' +
                '<td><kbd>Ctrl</kbd>+<kbd>E</kbd></td>' +
                '<td>NA</td>' +
            '</tr>' +
        '</tbody>' +
    '</table>' +

    '<br>' +
    '<p><span class="highlighted-text">Note:</span> macOS users should use <kbd>⌘</kbd> key instead of <kbd>Ctrl</kbd>.</p>' +

    '<br>' +
    '<h4 class="highlighted-text">Image manipulations</h4>' +

    '<table>' +
        '<thead>' +
            '<tr>' +
                '<th>Action</th>' +
                '<th>How-to</th>' +
                '<th>Views where available</th>' +
            '</tr>' +
        '</thead>' +
        '<tbody>' +
            '<tr>' +
                '<td>Rotate model</td>' +
                '<td>Move mouse holding left button</td>' +
                '<td>3D</td>' +
            '</tr>' +
            '<tr>' +
                '<td>Move model</td>' +
                '<td>Move mouse holding right button</td>' +
                '<td>3D</td>' +
            '</tr>' +
            '<tr>' +
                '<td>Enable/disable model auto-rotation</td>' +
                '<td>Double-click</td>' +
                '<td>3D</td>' +
            '</tr>' +
            '<tr>' +
                '<td>Set default view</td>' +
                '<td>Double-click + <kbd>Alt</kbd></td>' +
                '<td>3D</td>' +
            '</tr>' +
        '</tbody>' +
    '</table>' +

    '<br>' +
    '<p>Looking for more information? Check out <a href="https://github.com/MetaboliteCartography/ili">`ili GitHub repository</a>.</p>' +

    '</div>';
});
