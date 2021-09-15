define(['three', 'camerahelper'],
	function (THREE, CameraHelper) {
		return class PanState {

			static handle(camera, startLocation, stopLocation, screenRatioWtoH) {
				const screenDelta = new THREE.Vector2().subVectors(stopLocation, startLocation);
				CameraHelper.pan(camera, screenDelta, screenRatioWtoH)
			}

			static request(event) {
				return event.buttons === 2;
			}
		}
	});
