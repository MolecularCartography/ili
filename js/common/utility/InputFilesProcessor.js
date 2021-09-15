'use strict';

define(['utils'],
function (Utils) {
    function InputFilesProcessor(owner, supportedInput) {
        this._owner = owner;
        this._supportedInput = supportedInput;
    }

    InputFilesProcessor.prototype = Object.create(null, {
        /* @inputFiles is a list of File objects */
        process: {
            value: function (inputFiles) {
                var inputFileUrls = inputFiles.map(function (item) {
                    return item.name.toLowerCase();
                });

                var recognizedInput = this._supportedInput.map(function (fileCombination) {
                    return fileCombination.getMatchingFiles(inputFileUrls);
                }).sort(function (match1, match2) {
                    return match1.files.length < match2.files.length;
                });

                // leave unambiguous set of file handlers, i.e. 1 file -> 1 handler
                var allRecognizedFiles = {};
                for (var i = 0; i < recognizedInput.length; ++i) {
                    var curFiles = recognizedInput[i].files;
                    var currentCombinationNotValid = false;
                    for (var fileIdx = 0; fileIdx < curFiles.length; ++fileIdx) {
                        if (!(curFiles[fileIdx] in allRecognizedFiles)) {
                            allRecognizedFiles[curFiles[fileIdx]] = null;
                        } else {
                            for (var addedFileIdx = 0; addedFileIdx < fileIdx; ++addedFileIdx) {
                                delete allRecognizedFiles[addedFileIdx];
                            }
                            currentCombinationNotValid = true;
                            break;
                        }
                    }
                    if (currentCombinationNotValid || !recognizedInput[i].files.length) {
                        recognizedInput.splice(i, 1);
                        --i;
                    }
                }

                for (var i = 0; i < recognizedInput.length; ++i) { 
                    recognizedInput[i].handler(this._owner, inputFiles.filter(function (file) {
                        return this.files.indexOf(file.name.toLowerCase()) > -1;
                    }.bind(recognizedInput[i])));
                }

                var unprocessedFiles = [];
                inputFileUrls.forEach(function (url) {
                    if (!(url in allRecognizedFiles)) {
                        unprocessedFiles.push(url);
                    }
                });
                if (unprocessedFiles.length) {
                    console.log('Some files were not recognized: "' + unprocessedFiles.join('", "') + '"');
                }
            }
        }
    });

    return InputFilesProcessor;
});
