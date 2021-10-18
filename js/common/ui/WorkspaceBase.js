'use strict';

define([
    'eventsource', 'utils', 'taskcontroller', 'inputfilesprocessor', 'filecombination'
],
function (EventSource, Utils, TaskController, InputFilesProcessor, FileCombination)
{
    /**
     * Main application WorkspaceBase. It works in 3 modes:
     * 1. NULL. In may have measures but with no visual representation.
     * 2. MODE_2D. It has image. Spots are mapped on this image using X and Y
     *    coordinates (Z ignored).
     * 3. MODE_3D. It has a THREE.js scene with a mesh, light souces ets.
     *
     * WorkspaceBase tracks changes in measures, images and meshes and fires appropriates
     * events to allow updates. WorkspaceBase may have multiple views (2D and 3D view
     * shouldn't be mixed). Different 3D view for instance may show the same scene
     * from different perspectives.
     *
     * 'status'/'status-change' intended to inform
     * the user on progress in long-running tasks.
     *
     */
    function WorkspaceBase(spotsController, fileFormats, events) {
        EventSource.call(this, events ? Object.create(WorkspaceBase.Events, events) : events);

        this._mode = null;
        this._errors = [];
        this._spotsController = spotsController;
        this._loadedSettings = null;

        this._status = '';
        this._settingsToLoad = null;
        this._currentSettings = null;
        this._settingsPatch = {};

        // Initialize input files processor.
        this._inputFilesProcessor = fileFormats ? new InputFilesProcessor(this, 
            [...fileFormats, ...WorkspaceBase.FileFormats]) : 
            null;

        // Initialize task controller.
        this.taskController = new TaskController({
            setStatus: (status) => this.setStatus(status),
            setError: (error) => this.setError(error),
            onCancel: (taskCount) => {
                if (taskCount == 0) {
                    this._loadPendingSettings();
                }
            }
        });
    }

    WorkspaceBase.Events = {
        STATUS_CHANGE: 'status-change',
        MODE_CHANGE: 'mode-change',
        ERRORS_CHANGE: 'errors-change',
        SETTINGS_CHANGE: 'settings-change',
        REQUEST_SETTINGS: 'request-settings',
        BOUNDS_CHANGE: 'bounds-change'
    };

    WorkspaceBase.SettingsPatch = {
        KEY: 'params',
        SEP: '=',
        extractPatch: function (patch) {
            var expectedPatchStart = WorkspaceBase.SettingsPatch.KEY + WorkspaceBase.SettingsPatch.SEP;
            var trimmedPatch = patch.trim();
            if (trimmedPatch.startsWith(expectedPatchStart) && trimmedPatch.length > expectedPatchStart.length) {
                return unescape(trimmedPatch.substring(expectedPatchStart.length));
            } else {
                return '';
            }
        }
    };

    
    WorkspaceBase.FileFormats = [
        new FileCombination('json', (owner, blob) => owner._onLoadSettings(blob))
    ];

    WorkspaceBase.TaskType = {
        DOWNLOAD: {
            key: 'download',
            worker: 'js/common/workers/Downloader.js'
        },
        LOAD_SETTINGS: {
            key: 'load-settings',
            worker: 'js/common/workers/SettingsLoader.js'
        },
    };

    WorkspaceBase.prototype = Object.create(EventSource.prototype, {

        getDataBoundingBox: {
            value: function() {
                return null;
            }
        },

        loadFiles: {
            value: function(files) {
                this._inputFilesProcessor.process(files);
            }
        },

        download: {
            value: function(fileNames, prefix) {
                fileNames = this._savePatchedSettings(fileNames);

                fileNames = fileNames.filter(function(name) {
                    return name != '';
                });
                if (!fileNames.length) {
                    return;
                }

                var curPatch = this._settingsPatch;
                this.taskController.runTask(WorkspaceBase.TaskType.DOWNLOAD, {
                    fileNames: fileNames,
                    prefix: prefix ? prefix : Utils.FILE_SERVICE_PREFIX
                }).
                    then(function (result) {
                        this.loadFiles(result.items);
                    }.bind(this)).
                    then(function (result) {
                        this._settingsPatch = curPatch;
                    }.bind(this));
            }
        },

        currentSettings: {
            get: function () {
                if (this._currentSettings === null) {
                    this._notify(WorkspaceBase.Events.REQUEST_SETTINGS);
                }
                return this._currentSettings;
            },
            set: function (settings) {
                this._currentSettings = settings;
            }
        },

        setStatus: {
            value: function(status) {
                this._status = status;
                this._notify(WorkspaceBase.Events.STATUS_CHANGE);
            }
        },

        setError: {
            value: function(message) {
                this._errors.push(message);
                this._notify(WorkspaceBase.Events.ERRORS_CHANGE);
            }
        },

        errors: {
            get: function() {
                return this._errors;
            }
        },

        clearErrors: {
            value: function() {
                this._errors = [];
                this._notify(WorkspaceBase.Events.ERRORS_CHANGE);
            }
        },

        _savePatchedSettings: {
            value: function (fileNames) {
                var patches = [];
                var nonPatches = [];
                fileNames.forEach(function (fileName) {
                    var patchCandidate = WorkspaceBase.SettingsPatch.extractPatch(fileName);
                    if (patchCandidate) {
                        patches.push(patchCandidate);
                    } else {
                        nonPatches.push(fileName);
                    }
                });

                this._settingsPatch = {};
                patches.forEach(function (patch) {
                    Object.assign(this._settingsPatch, JSON.parse(patch));
                }.bind(this));

                return nonPatches;
            }
        },

        
        _onLoadSettings: {
            value: function (blob) {
                this._settingsToLoad = blob[0];
                this._loadPendingSettings();
            }
        },

        _onModeChange: {
            value: function() {

            }
        },

        _loadPendingSettings: {
            value: function () {
                if (this.taskController.taskCount == 0) {
                    if (this._settingsToLoad !== null) {
                        this.taskController.runTask(WorkspaceBase.TaskType.LOAD_SETTINGS, this._settingsToLoad).
                        then(function (result) {
                            this._loadedSettings = Object.assign(result.settings, this._settingsPatch);
                            this._settingsPatch = {};
                            this._notify(WorkspaceBase.Events.SETTINGS_CHANGE);
                        }.bind(this));
                        this._settingsToLoad = null;
                    } else if (Object.keys(this._settingsPatch).length != 0) {
                        this._loadedSettings = this.currentSettings;
                        Object.assign(this._loadedSettings, this._settingsPatch);
                        this.currentSettings = null;
                        this._settingsPatch = {};
                        this._notify(WorkspaceBase.Events.SETTINGS_CHANGE);
                    }
                }
            }
        },

        mode: {
            get: function() {
                return this._mode;
            },

            set: function(value) {
                if (this._mode == value) {
                    return;
                }
                this._mode = value;
                this._onModeChange(value);
                this._notify(WorkspaceBase.Events.MODE_CHANGE, this._mode);
            }
        },

        spotsController: {
            get: function () {
                return this._spotsController;
            }
        },

        status: {
            get: function() {
                return this._status;
            }
        },

        loadedSettings: {
            get: function () {
                return this._loadedSettings;
            }
        }
    });

    return WorkspaceBase;
});
