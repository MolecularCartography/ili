'use strict';

define([],
function () {

    class TaskController {
        
        constructor(callback) {
            this._tasks = {};
            this._callback = callback;
        }

        get TaskCount() { return Object.keys(this._tasks).length; }

        runTask(taskType, args, transfer) {
            if (taskType.key in this._tasks) 
                this.cancelTask(taskType);

            var task = {
                worker: typeof taskType.worker == 'function' ?
                    new taskType.worker() :
                    new Worker(require.toUrl(taskType.worker)),
                status: '',
                cancel: this.cancelTask.bind(this, taskType),
                startTime: new Date().valueOf(),
            };
            this._tasks[taskType.key] = task;

            this._callback.setStatus(`Initializing runtime for task [${taskType.key}]...`);

            if (typeof taskType.worker == 'function') {
                task.worker.postMessage(args, transfer);
            }

            const setStatus = (status) => this._callback.setStatus(status);
            const setError = (error) => this._callback.setError(error);
           
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
                            setError(`Operation failed: ${event.data.message}`);
                            break;
                        case 'working':
                            setStatus(event.data.message);
                            break;
                        case 'ready':
                            setStatus(`[${taskType.key}] task is ready to work`);
                            this.postMessage(args);
                            break;
                    };
                };
                task.worker.onerror = function(event) {
                    setStatus('');
                    setError('Operation failed. See log for details.');
                }.bind(this);
            }.bind(this));
        }

        cancelTask(taskType) {
            if (taskType.key in this._tasks) {
                this._tasks[taskType.key].worker.onerror = null;
                this._tasks[taskType.key].worker.terminate();
                delete this._tasks[taskType.key];
            }
            this._callback.onCancel(Object.keys(this._tasks).length);
        }   

    };

    return TaskController;
});
