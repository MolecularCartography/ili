'use strict';

define([
        'colormaps', 'eventsource','volumeinputfilesprocessor',
        'volumescene3d'
    ],
    function (ColorMap, EventSource, InputFilesProcessor,
               VolumeScene3D)
    {

        function VolumeWorkspace(volumeSpotsController) {
            EventSource.call(this, VolumeWorkspace.Events);

            this._mode = VolumeWorkspace.Mode.UNDEFINED;
            this._spotsController = volumeSpotsController;
            this._volumeScene3D = new VolumeScene3D(volumeSpotsController);
            this._loadedSettings = null;
            this._inputFilesProcessor = new InputFilesProcessor(this);

            this._status = '';
            this._tasks = {};
            this._settingsToLoad = null;
            this._currentSettings = null;
            this._settingsPatch = {};

        }

        VolumeWorkspace.Events = {
            STATUS_CHANGE: 'volume-status-change',
            MODE_CHANGE: 'volume-mode-change',
            SETTINGS_CHANGE: 'volume-settings-change',
            REQUEST_SETTINGS: 'volume-request-settings'
        };

        VolumeWorkspace.Mode = {
            UNDEFINED: 1,
            MODE_3D: 2,
        };

        VolumeWorkspace.SettingsPatch = {
            KEY: 'params',
            SEP: '=',
            extractPatch: function (patch) {
                const expectedPatchStart = VolumeWorkspace.SettingsPatch.KEY + VolumeWorkspace.SettingsPatch.SEP;
                const trimmedPatch = patch.trim();
                if (trimmedPatch.startsWith(expectedPatchStart) && trimmedPatch.length > expectedPatchStart.length) {
                    return unescape(trimmedPatch.substring(expectedPatchStart.length));
                } else {
                    return '';
                }
            }
        };

        /**
         * Asynchromous tasks. At most one task with the same key may run
         * (no 2 images could be loading simultaniously). Newer task cancels older one.
         * 'worker' is name of JS file in 'js/workers' or constructor of a Worker-like
         * class.
         */
        VolumeWorkspace.TaskType = {
           DOWNLOAD: {
                key: 'download',
                worker: 'Downloader.js'
            },

            LOAD_SETTINGS: {
                key: 'load-settings',
                worker: 'SettingsLoader.js'
            },
        };

        VolumeWorkspace.prototype = Object.create(EventSource.prototype, {



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
                value: function(fileNames) {
                    fileNames = this._savePatchedSettings(fileNames);

                    fileNames = fileNames.filter(function(name) {
                        return name !== '';
                    });
                    if (!fileNames.length) {
                        return;
                    }

                    const curPatch = this._settingsPatch;
                    this._doTask(VolumeWorkspace.TaskType.DOWNLOAD, fileNames).
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
                        this._notify(VolumeWorkspace.Events.REQUEST_SETTINGS);
                    }
                    return this._currentSettings;
                },
                set: function (settings) {
                    this._currentSettings = settings;
                }
            },

            _savePatchedSettings: {
                value: function (fileNames) {
                    const patches = [];
                    const nonPatches = [];
                    fileNames.forEach(function (fileName) {
                        const patchCandidate = VolumeWorkspace.SettingsPatch.extractPatch(fileName);
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


            _cancelTask: {
                value: function(taskType) {
                    if (taskType.key in this._tasks) {
                        this._tasks[taskType.key].worker.terminate();
                        delete this._tasks[taskType.key];
                    }
                    if (Object.keys(this._tasks).length === 0) {
                        this._loadPendingSettings();
                    }
                }
            },

            _loadPendingSettings: {
                value: function () {
                    if (Object.keys(this._tasks).length === 0) {
                        if (this._settingsToLoad !== null) {
                            this._doTask(VolumeWorkspace.TaskType.LOAD_SETTINGS, this._settingsToLoad).
                            then(function (result) {
                                this._loadedSettings = Object.assign(result.settings, this._settingsPatch);
                                this._settingsPatch = {};
                                this._notify(VolumeWorkspace.Events.SETTINGS_CHANGE);
                            }.bind(this));
                            this._settingsToLoad = null;
                        } else if (Object.keys(this._settingsPatch).length !== 0) {
                            this._loadedSettings = this.currentSettings;
                            Object.assign(this._loadedSettings, this._settingsPatch);
                            this.currentSettings = null;
                            this._settingsPatch = {};
                            this._notify(VolumeWorkspace.Events.SETTINGS_CHANGE);
                        }
                    }
                }
            },

            /**
             * Starts a new task (cancels an old one it it's running).
             *
             * @param {Workspace.TaskType} taskType Task to run.
             * @param {Object} args Arguments to post to the task's worker.
             * @return {Promise}
             **/
            _doTask: {
                value: function(taskType, args) {
                    if (taskType.key in this._tasks) this._cancelTask(taskType);

                    const task = {
                        worker: typeof taskType.worker == 'function' ?
                            new taskType.worker() :
                            new Worker(require.toUrl('js/workers/' + taskType.worker)),
                        status: '',
                        cancel: this._cancelTask.bind(this, taskType),
                        startTime: new Date().valueOf(),
                    };
                    this._tasks[taskType.key] = task;
                    const setStatus = this._setStatus.bind(this);

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
                                    break;
                                case 'working':
                                    setStatus(event.data.message);
                                    break;
                                case 'ready':
                                    this.postMessage(args);
                                    break;
                            };
                        };
                    }.bind(this));
                }
            },
            _setStatus: {
                value: function(status) {
                    this._status = status;
                    this._notify(VolumeWorkspace.Events.STATUS_CHANGE);
                }
            },

             mode: {
                 get: function() {
                     return this._mode;
                 },

                 set: function(value) {
                     if (this._mode === value) {
                         return;
                     }
                     this._mode = value;

                     this._notify(VolumeWorkspace.Events.MODE_CHANGE);
                 }
             },

            spotsController: {
                get: function () {
                    return this._spotsController;
                }
            },


            volumeScene3D: {
                get: function() {
                    return this._volumeScene3D;
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

        return VolumeWorkspace;
    });
