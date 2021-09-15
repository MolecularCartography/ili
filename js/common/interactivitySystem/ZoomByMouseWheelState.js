define(['camerahelper'],
	function (CameraHelper) {
		return class ZoomByMouseMoveState {
			static handle(camera, wheelDelta, minZoom, maxZoom) {
				const usualWheelDeltaValue = 0.15;
				const defaultScalingCoefficient = 0.8;
				let scalingCoefficient = defaultScalingCoefficient /
					Math.pow(Math.abs(wheelDelta) / usualWheelDeltaValue, 0.3);
				CameraHelper.zoom(camera, wheelDelta, scalingCoefficient);
				camera.zoom = Math.max(minZoom, Math.min(maxZoom, camera.zoom));
			}
		}
	});
