'use strict';

define([
    'eventsource'
],
function (EventSource)
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
    function WorkspaceBase(spotsController, inputFilesProcessor) {
        EventSource.call(this, WorkspaceBase.Events);

        this._mode = null;
        this._errors = [];
        this._spotsController = spotsController;
        this._loadedSettings = null;
        this._inputFilesProcessor = inputFilesProcessor;

        this._status = '';
        this._tasks = {};
        this._settingsToLoad = null;
        this._currentSettings = null;
        this._settingsPatch = {};
    }

    WorkspaceBase.Events = {
        STATUS_CHANGE: 'status-change',
        MODE_CHANGE: 'mode-change',
        ERRORS_CHANGE: 'errors-change',
        SETTINGS_CHANGE: 'settings-change',
        REQUEST_SETTINGS: 'request-settings'
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
        /**
         * Starts loading intensities file.
         */
        loadIntensities: {
            value: function(blob) {
                this._doTask(WorkspaceBase.TaskType.LOAD_MEASURES, blob[0]).
                    then(function (result) {
                        this._spotsController.spots = result.spots;
                        this._spotsController.measures = result.measures;

                        if (this._mode == WorkspaceBase.Mode.MODE_3D) {
                            this._mapMesh(Scene3D.RecoloringMode.USE_COLORMAP);
                        }
                    }.bind(this));
            }
        },

        loadSettings: {
            value: function (blob) {
                this._settingsToLoad = blob[0];
                this._loadPendingSettings();
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
                this._doTask(WorkspaceBase.TaskType.DOWNLOAD, {
                    fileNames: fileNames,
                    prefix: prefix
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

        _addError: {
            value: function(message) {
                this._errors.push(message);
                this._notify(WorkspaceBase.Events.ERRORS_CHANGE);
            }
        },

        _cancelTask: {
            value: function(taskType) {
                if (taskType.key in this._tasks) {
                    this._tasks[taskType.key].worker.onerror = null;
                    this._tasks[taskType.key].worker.terminate();
                    delete this._tasks[taskType.key];
                }
                if (Object.keys(this._tasks).length == 0) {
                    this._loadPendingSettings();
                }
            }
        },

        _loadPendingSettings: {
            value: function () {
                if (Object.keys(this._tasks).length == 0) {
                    if (this._settingsToLoad !== null) {
                        this._doTask(WorkspaceBase.TaskType.LOAD_SETTINGS, this._settingsToLoad).
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

        /**
         * Starts a new task (cancels an old one it it's running).
         *
         * @param {WorkspaceBase.TaskType} taskType Task to run.
         * @param {Object} args Arguments to post to the task's worker.
         * @return {Promise}
         **/
        _doTask: {
            value: function(taskType, args) {
                if (taskType.key in this._tasks) this._cancelTask(taskType);

                var task = {
                    worker: typeof taskType.worker == 'function' ?
                        new taskType.worker() :
                        new Worker(require.toUrl(taskType.worker)),
                    status: '',
                    cancel: this._cancelTask.bind(this, taskType),
                    startTime: new Date().valueOf(),
                };
                this._tasks[taskType.key] = task;
                var setStatus = this._setStatus.bind(this);
                var addError = this._addError.bind(this);

                if (typeof taskType.worker == 'function') {
                    task.worker.postMessage(args);
                }
                return new Promise(function(resolve, reject) {
                    task.worker.onmessage = function(event) {
                        switch (event.data.status) {
                            case 'completed':
                                setStatus('');
                                resolve(event.data);
                                task.cancel();
                                console.info('Task ' + taskType.key + ' completed in ' +
                                    (new Date().valueOf() - task.startTime) /
                                    1000 + ' sec');
                                break;
                            case 'failed':
                                reject(event.data);
                                task.cancel();
                                setStatus('');
                                addError('Operation failed: ' + event.data.message);
                                break;
                            case 'working':
                                setStatus(event.data.message);
                                break;
                            case 'ready':
                                this.postMessage(args);
                                break;
                        };
                    };
                    task.worker.onerror = function(event) {
                        setStatus('');
                        addError('Operation failed. See log for details.');
                    }.bind(this);
                }.bind(this));
            }
        },

        _setStatus: {
            value: function(status) {
                this._status = status;
                this._notify(WorkspaceBase.Events.STATUS_CHANGE);
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

                /*
                if (this._mode == WorkspaceBase.Mode.MODE_3D) {
                    this._scene2d.resetImage();
                    this._cancelTask(WorkspaceBase.TaskType.LOAD_IMAGE);
                }
                if (this._mode == WorkspaceBase.Mode.MODE_2D) {
                    this._scene3d.geometry = null;
                    this._cancelTask(WorkspaceBase.TaskType.LOAD_MESH);
                }*/

                this._notify(WorkspaceBase.Events.MODE_CHANGE);
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
