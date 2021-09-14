'use strict'
define([
		'three', 'zoombymousemovestate', 'zoombymousewheelstate', 'rotatestate', 'panstate', 'camerahelper'
	],
	function (THREE, ZoomByMouseMoveState, ZoomByMouseWheelState, RotateState, PanState, CameraHelper) {
		return class ActionController extends THREE.EventDispatcher {
			constructor(camera, domElement, group, defaultViewRequest) {
				super();
				this.camera = camera;
				this.domElement = (domElement !== undefined) ? domElement : document.body;
				this.group = group;
				this.defaultViewRequest = defaultViewRequest;
				this.startEvent = {type: 'start'};
				this.changeEvent = {type: 'change'};
				this.defaultCameraProperties = {};

				this.domElement.addEventListener('dblclick', event => this._onDblClick(event));
				this.domElement.addEventListener('mousedown', event => this._onMouseDown(event));
				this.domElement.addEventListener('mouseup', event => this._onMouseUp(event));
				this.domElement.addEventListener('mousemove', event => this._onMouseMove(event));
				this.domElement.addEventListener('contextmenu', event => this._onContextMenu(event));
				this.domElement.addEventListener('wheel', event => this._onMouseWheel(event));
				this.domElement.addEventListener('pointerdown', event => this._onPointerDown(event));
				this.domElement.addEventListener('pointerup', event => this._onPointerUp(event))


				this.startVector = new THREE.Vector2();
				this.endVector = new THREE.Vector2();
				this.autoRotateSpeed = 6.0;
				this.minZoom = 0;
				this.maxZoom = Infinity;

				this.eventHadlers = [
					ZoomByMouseMoveState,
					PanState,
					RotateState,
				];
			}

			update() {
				this.camera.lookAt(this.camera.LookAt);
				if (this.autoRotate && this.currentHandler === undefined)
					CameraHelper.rotateLeft(this.camera, this.autoRotateSpeed)
				this.dispatchEvent(this.changeEvent);
			}

			_onMouseDown(event) {
				event.preventDefault();
				event.stopPropagation();
				this.autoRotate = false;
				this.startVector = this._absoluteCoordsToRelative(event.pageX, event.pageY);
				for (const item of this.eventHadlers) {
					if (item.request(event)) {
						this.currentHandler = item;
						break;
					}
				}
			}

			_onMouseUp() {
				this.currentHandler = undefined;
			}

			_onMouseMove(event) {
				if (this.currentHandler === undefined)
					return;
				this.endVector = this._absoluteCoordsToRelative(event.pageX, event.pageY);
				this.currentHandler.handle(this.camera, this.startVector, this.endVector,
					this.domElement.clientWidth / this.domElement.clientHeight, this.minZoom, this.maxZoom);
				this.startVector.copy(this.endVector);
				this.dispatchEvent(this.changeEvent);
			}

			_onMouseWheel(event) {
				this.autoRotate = false;
				event.preventDefault();
				event.stopPropagation();
				ZoomByMouseWheelState.handle(this.camera, event.deltaY / this.domElement.clientHeight, this.minZoom, this.maxZoom)
				this.dispatchEvent(this.changeEvent);
			}

			_onDblClick(event) {
				if (event.altKey) {
					this.defaultViewRequest(this.domElement.clientWidth / this.domElement.clientHeight, this.defaultCameraProperties);
				} else {
					this.autoRotate = this.autoRotate !== true;
					this.autoRotateSpeed = Math.abs(this.autoRotateSpeed) * (event.ctrlKey ? -1 : 1)
					this.group.requestAnimationFrame();
				}
				this.dispatchEvent(this.changeEvent);
			}

			_onContextMenu(event) {
				event.preventDefault();
				event.stopPropagation()
			}

			_absoluteCoordsToRelative(x, y) {
				return new THREE.Vector2((x) * 2 / this.domElement.clientWidth - 1,
					(1 - 2 * (y) / this.domElement.clientHeight));
			}

			_onPointerDown(event) {
				if (event.target === this.domElement)
					this.domElement.setPointerCapture(event.pointerId)
			}

			_onPointerUp(event) {
				this.domElement.releasePointerCapture(event.pointerId)
			}
		}
	})
;
