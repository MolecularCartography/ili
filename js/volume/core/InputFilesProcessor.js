'use strict';

define(['utils', 'inputfilesprocessorbase', 'filecombination'],
function (Utils, InputFilesProcessorBase, FileCombination) {
    function InputFilesProcessor(workspace) {
        InputFilesProcessorBase.call(this, workspace, [
            new FileCombination('csv', workspace.loadIntensities.bind(workspace)),
            new FileCombination('json', workspace.loadSettings.bind(workspace)),
            new FileCombination('nrrd', workspace.loadShape.bind(workspace)),
        ]);
    }

    InputFilesProcessor.prototype = Object.create(InputFilesProcessorBase.prototype);

    return InputFilesProcessor;
});
