'use strict';

define(['utils', 'inputfilesprocessorbase', 'filecombination'],
function (Utils, InputFilesProcessorBase, FileCombination) {

    const SupportedImageFormats = ['png', 'jpg', 'jpeg'];

    function InputFilesProcessor(workspace) {
        InputFilesProcessorBase.call(this, workspace, [
            new FileCombination('csv', workspace.loadIntensities.bind(workspace)),
            new FileCombination('json', workspace.loadSettings.bind(workspace)),
            new FileCombination(SupportedImageFormats, workspace.loadImage.bind(workspace), FileCombination.RELATION.OR),
            new FileCombination('stl', workspace.loadMesh.bind(workspace)),
            new FileCombination('obj', workspace.loadMesh.bind(workspace)),
            new FileCombination(['mtl', new FileCombination(SupportedImageFormats,
                null, FileCombination.RELATION.OR)], workspace.loadMaterial.bind(workspace), FileCombination.RELATION.AND)
        ]);
    }

    InputFilesProcessor.prototype = Object.create(InputFilesProcessorBase.prototype);

    return InputFilesProcessor;
});
