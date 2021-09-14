define(['camerahelper', 'three'],
	function ( CameraHelper, THREE) {
		return class RotateState {
			static handle(camera, startLocation, stopLocation) {
				const axis = new THREE.Vector3(),
					eyeDirection = new THREE.Vector3(),
					objectUpDirection = new THREE.Vector3(),
					objectSidewaysDirection = new THREE.Vector3(),
					_eye = new THREE.Vector3(),
					moveDirection = new THREE.Vector3();

				moveDirection.set(stopLocation.x - startLocation.x, stopLocation.y - startLocation.y, 0);
				let angle = moveDirection.length();
				_eye.copy(camera.position).sub(camera.LookAt);
				eyeDirection.copy(_eye).normalize();
				objectUpDirection.copy(camera.up).normalize();
				objectSidewaysDirection.crossVectors(objectUpDirection, eyeDirection).normalize();
				objectUpDirection.setLength(stopLocation.y - startLocation.y);
				objectSidewaysDirection.setLength(stopLocation.x - startLocation.x);
				moveDirection.copy(objectUpDirection.add(objectSidewaysDirection));
				axis.crossVectors(moveDirection, _eye).normalize();
				CameraHelper.rotate(camera, angle, axis, _eye);
			}

			static request(event) {
				return event.buttons === 1;
			}
		}
	});
