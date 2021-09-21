define(['three'], function(THREE) {

    return class AnimationLoopManager {

        constructor(renderer) {
            this._renderer = renderer;
            this._animationLoops = new Map();
            this._animationLoopsActionsForDelection = [];
            this._isInAnimationLoop = false;
        }

        setAnimationLoop(action) {
            // dismiss if registered.
            if (this._animationLoops.get(action)) {
                return;
            }

            // that's return callback object.
            const result = {
                stop: () => {
                    if (!this._isInAnimationLoop) {
                        this._deleteAction(action);
                    } else {
                        this._animationLoopsActionsForDelection.push(action);
                    }              
                }
            };
            this._animationLoops.set(action, result);
            if (this._animationLoops.size == 1) {
                this._renderer.setAnimationLoop(() => {
                    this._isInAnimationLoop = true;
                    try {
                        for (let pair of this._animationLoops) {
                            pair["0"]();
                        }
                    }
                    finally {
                        for (let action in this._animationLoopsActionsForDelection) {
                            this._deleteAction(action);
                        }
                        this._animationLoopsActionsForDelection = [];
                        this._isInAnimationLoop = false;
                    }
                });
            }
            return result;
        }

        _deleteAction(action) {
            this._animationLoops.delete(action);
            if (this._animationLoops.size == 0) {
                this._renderer.setAnimationLoop(null);
            }
        }

    }

});
  
