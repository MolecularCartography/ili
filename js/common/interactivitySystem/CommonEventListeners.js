define(['three', 'camerahelper'],
	function (THREE, CameraHelper) {

		class EventListenerBase {
			constructor(args) {
				this.args = args;
				this.priority = 0;
                this.camera = args.camera;
				this.domElement = args.domElement;
			}

			getClientCoordinates(event) {
				const x = event.clientX - rect.left;
				const y = event.clientY - rect.top;
				return new THREE.Vector2(x, y);
			}

            getRelativeCoordinates(event) {
				const rect = this.domElement.getBoundingClientRect();
				const x = event.clientX - rect.left;
				const y = event.clientY - rect.top;
				return new THREE.Vector2(
					x / rect.width, 1.0 - y / rect.height);
			}

			handle(event, handlerQueue) {
				const handler = {
					handle: (event) => this.handleExclusive(event),
					priority: this.priority
				};
				handlerQueue.submit(handler);
			}

			handleExclusive(event) {

			}

			setAnimationLoop(action) {
				return this.args.setAnimationLoop(action);
			}

			requestRedraw() {
				this.args.requestRedraw();
			}

		}

		class SpotEventListener extends EventListenerBase {

			constructor(args, spotLabel) {
				super(args);
				this._spotLabel = spotLabel;
			}

			handleExclusive(event) {
				if (event.type != 'mousedown' || event.buttons != 2) {
					return null;
				}
				const clientCoordinates = this.getClientCoordinates(event);
				this._spotLabel.showFor(clientCoordinates.x, clientCoordinates.y);
			}

		}
	
		class DisplacementEventListenerBase extends EventListenerBase {

			constructor(args, buttons) {
				super(args);
				this._buttons = buttons;
			}

			handleExclusive(event) {
				if (event.type != 'mousedown' || event.buttons != this._buttons) {
					return null;
				}
				
				let startLocation = this.getRelativeCoordinates(event);
				const cacheVector = new THREE.Vector2();
				return {
					context: {
						handle: (event) => {
							switch (event.type) {
								case 'mousemove':
									const currentLocation = this.getRelativeCoordinates(event);
									const screenDelta = cacheVector.subVectors(currentLocation, startLocation);
									this.process(startLocation, currentLocation, screenDelta);
									startLocation.copy(currentLocation);
									this.requestRedraw();
									return true;
								case 'mouseup':
									return false;
							}
							return true;
						},
						release: () => {
	
						}
					},
					isHandled: true
				};	
			}

			process(startLocation, currentLocation, delta) {

			}
		}

		class PanEventListener extends DisplacementEventListenerBase {

			constructor(args) {
				super(args, 2);
			}

			process(startLocation, currentLocation, screenDelta) {
				CameraHelper.pan(this.camera, screenDelta);
			}

		}

		class RotateEventListener extends DisplacementEventListenerBase {

			constructor(args) {
				super(args, 1);
			}

			process(startLocation, stopLocation, screenDelta) {
				const camera = this.camera;
				CameraHelper.rotate(camera, startLocation, stopLocation);
			}

		}

		class ZoomByMouseWheelEventListener extends EventListenerBase {

			handleExclusive(event) {
				if (event.type != 'wheel') {
					return null;
				}

				const camera = this.camera;
				const wheelDelta = event.deltaY / this.domElement.clientHeight;
				const usualWheelDeltaValue = 0.2;
				const defaultScalingCoefficient = 0.8;
				const scalingCoefficient = defaultScalingCoefficient /
					Math.pow(Math.abs(wheelDelta) / usualWheelDeltaValue, 0.3);
				CameraHelper.zoom(camera, wheelDelta, scalingCoefficient);
				this.requestRedraw();
				return {
					context: null,
					isHandled: true
				};
			}

		}

		class ZoomByMouseMoveEventListener extends DisplacementEventListenerBase {

			constructor(args) {
				super(args, 4);
			}

			process(startLocation, stopLocation, delta) {
				const camera = this.camera;
				const zoomSpeed = 1.2;
				let scalingCoefficient = Math.pow(0.95, zoomSpeed);
				const wheelDelta = startLocation.y - stopLocation.y;
				CameraHelper.zoom(camera, wheelDelta, scalingCoefficient);
			}

		}

		class DefaultViewEventListener extends EventListenerBase {

			constructor(args) {
				super(args);
			}

			handleExclusive(event) { 
				if (event.type != 'dblclick' || !event.altKey) {
					return null;
				}
				this.args.setDefaultView();
				return {
					context: null,
					isHandled: true
				};
			}

		}

		const AutoRotateAbortEvents = new Set(['wheel', 'mousedown']);

		class AutoRotateEventListener extends EventListenerBase {

			constructor(args) {
				super(args);
				this._currentSpeed = null;
				this._animationLoop = null;
				this._autoRotateSpeed = 5.0;
				this._autoRotateVector = new THREE.Vector3().set(0, 1, 0);
			}

			tryStop() {
				if (!this._animationLoop) {
					return;
				}
				this._animationLoop.stop();
				this._animationLoop = null;
				this._isRotating = false;
				this._currentSpeed = null;
			}

			handle(event, handlerQueue) {
				super.handle(event, handlerQueue);
				if (AutoRotateAbortEvents.has(event.type)) {
					this.tryStop();
				}
			}

			handleExclusive(event) { 
				if (event.type != 'dblclick') {
					return null;
				}			
				this._currentSpeed = this._autoRotateSpeed * (event.ctrlKey ? -1 : 1);
				this._animationLoop = this.setAnimationLoop(() => {
					CameraHelper.rotateLeft(this.camera, this._autoRotateVector, this._currentSpeed);
					this.requestRedraw();
				});
				return {
					context: null,
					isHandled: true
				};
			}

		}

		return {
			EventListenerBase, DisplacementEventListenerBase,
			PanEventListener, RotateEventListener, ZoomByMouseWheelEventListener, 
			ZoomByMouseMoveEventListener, AutoRotateEventListener, 
			DefaultViewEventListener, SpotEventListener
		}

	});
