define(['camerahelper'],
	function (CameraHelper) {
		return class ZoomByMouseMoveState {
			static handle(camera, startLocation, stopLocation, screenWByHRatio, minZoom, maxZoom) {
				let zoomSpeed = 1.2;
				let scalingCoefficient = Math.pow(0.95, zoomSpeed);
				let wheelDelta = startLocation.y - stopLocation.y;
				CameraHelper.zoom(camera, wheelDelta, scalingCoefficient);
				camera.zoom = Math.max(minZoom, Math.min(maxZoom, camera.zoom));
			}

			static request(event) {
				return event.buttons === 4;
			}
		}
	});
