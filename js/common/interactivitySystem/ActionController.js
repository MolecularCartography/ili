'use strict'
define([
		'three', 'commoneventlisteners'
	],
	function (THREE, CommonEventListeners) {
		
		return class ActionController extends THREE.EventDispatcher {

			constructor(camera, domElement, controller) {
				super();
				this.camera = camera;
				this.controler = controller;
				this.domElement = domElement;
				this.startEvent = {type: 'start'};
				this.endEvent = {type: 'end'};
				this.changeEvent = {type: 'change'};

				// the event we need to track.
				this.domElement.addEventListener('dblclick', event => this._onEvent(event));
				this.domElement.addEventListener('mousedown', event => this._onEvent(event));
				this.domElement.addEventListener('mouseup', event => this._onEvent(event));
				this.domElement.addEventListener('mousemove', event => this._onEvent(event));
				this.domElement.addEventListener('wheel', event => this._onEvent(event));
				this.domElement.addEventListener('contextmenu', event => this._onEvent(event));
				this.domElement.addEventListener('pointerdown', event => this._onPointerDown(event));
				this.domElement.addEventListener('pointerup', event => this._onPointerUp(event));

				// event listener args.
				this._args = {
					camera: this.camera,
					domElement: this.domElement,
					setDefaultView: () => controller.setDefaultView(),
					setAnimationLoop: (action) => controller.setAnimationLoop(action),
					requestRedraw: () => controller.requestRedraw()
				};

				// set of event listeners.
				this._autoRotateListener = new CommonEventListeners.AutoRotateEventListener(this._args);
				this._spotListener = controller.spotLabel ? 
					new CommonEventListeners.SpotEventListener(this._args, controller.spotLabel) : 
					null;
				this._eventListeners = [
					new CommonEventListeners.PanEventListener(this._args),
					new CommonEventListeners.RotateEventListener(this._args),
					new CommonEventListeners.ZoomByMouseWheelEventListener(this._args),
					new CommonEventListeners.ZoomByMouseMoveEventListener(this._args),
					new CommonEventListeners.DefaultViewEventListener(this._args),
					this._autoRotateListener
				];
				if (this._spotListener) {
					this._eventListeners.push(this._spotListener);
				}
			}

			stopAnimation() {
				this._autoRotateListener.tryStop();
			}

			_onPointerDown(event) {
				this.domElement.setPointerCapture(event.pointerId);
			}

			_onPointerUp(event) {
				this.domElement.releasePointerCapture(event.pointerId);
			}

			_onEvent(event) {
				event.preventDefault();
				event.stopPropagation();

				if (this._captureContext) {
					if (!this._captureContext.handle(event)) {
						this._captureContext.release();
						this._captureContext = null;
						this.dispatchEvent(this.endEvent);
					}
				}

				if (this._captureContext) {
					return;
				}

				const handlers = [];
				const handlerQueue = {
					submit: (handlerInfo) => handlers.push(handlerInfo)
				};
				for (let eventListener of this._eventListeners){
					eventListener.handle(event, handlerQueue);	
				}

				handlers.sort((a, b) => a.priority - b.priority);
				for (let i = 0; i < handlers.length; i++) {
					const handler = handlers[i];
					const result = handler.handle(event);
					if (result) {
						if (result.context) {
							this._captureContext = result.context;
							this.dispatchEvent(this.startEvent);
							break;
						} else if(result.isHandled) {
							break;
						}
					}
				}
			}
		}

	})
;
