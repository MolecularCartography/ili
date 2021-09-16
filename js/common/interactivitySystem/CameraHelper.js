define([
		'three', 'tween'
	],
	function (THREE, TWEEN) {
		return class CameraHelper {

			static LookTo(camera) {
				return camera.LookAt.clone().sub(camera.position).clone();
			}

			static getLookUp(camera) {
				const cameraDirection = camera.getWorldDirection(new THREE.Vector3());
				const cameraRight = (camera.up.clone().cross(cameraDirection)).normalize();
				return cameraDirection.cross(cameraRight)
			}

			static getLookRight(camera) {
				let lookRight = new THREE.Vector3();
				lookRight.crossVectors(this.LookTo(camera), this.getLookUp(camera));
				return lookRight.normalize().clone();
			}


			static zoom(camera, wheelDelta, scalingCoefficient) {
				if (wheelDelta < 0)
					scalingCoefficient = 1 / scalingCoefficient;
				camera.zoom *= scalingCoefficient;
				camera.updateProjectionMatrix();
			}

			static rotate(camera, angle, rotationAxis, _eye) {
				const quaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis, angle);
				_eye.applyQuaternion(quaternion);
				camera.up.applyQuaternion(quaternion);
				camera.position.addVectors(camera.LookAt, _eye);
				camera.lookAt(camera.LookAt);
				camera.updateProjectionMatrix();
			}

			static getTan(camera) {
				if (camera instanceof THREE.PerspectiveCamera)
					return Math.tan(camera.fov / 2);
				const dist = (camera.position.clone().sub(camera.LookAt)).length();
				if (dist === 0)
					return 0.5;
				return camera.top / dist;
			}

			static pan(camera, screenDelta, screenRatioWtoH) {
				let tan = this.getTan(camera);
				const halfVerticalViewSize = (camera.position.clone().sub(camera.LookAt)).length() * tan;

				let displacement = this.getLookRight(camera).multiplyScalar(halfVerticalViewSize * screenRatioWtoH * screenDelta.x)
					.add(this.getLookUp(camera).multiplyScalar(halfVerticalViewSize * screenDelta.y));
				displacement.divideScalar(camera.zoom);
				const newPosition = camera.position.clone().sub(displacement)
				this.setupCamera(camera, newPosition, camera.LookAt.sub(displacement), camera.up, camera.zoom);
			}

			static rotateByOrientationWidget(camera, eyeFixed, viewGroupRenderer) {
				let duration = 100;
				let dist = Math.sqrt(camera.position.x * camera.position.x +
					camera.position.y * camera.position.y +
					camera.position.z * camera.position.z);
				let edgeDist = Math.sqrt(dist * dist / 2);
				let cornerDist = Math.sqrt(dist * dist / 3);
				let upFixed = new THREE.Vector3(0, 1, 0)
				const target = new THREE.Vector3();
				let vector = new THREE.Vector3().fromArray(eyeFixed(dist, edgeDist, cornerDist));

				this.setAnimationLoop(camera, viewGroupRenderer, target, vector, upFixed, duration);
			}

			static rotateLeft(camera, autoRotateSpeed) {
				const minAzimuthAngle = -Infinity;
				const maxAzimuthAngle = Infinity;
				const angle = Math.PI / 60 / 60 * autoRotateSpeed
				let spherical = new THREE.Spherical().setFromVector3(camera.position);
				spherical.theta -= angle;
				spherical.theta = Math.max(minAzimuthAngle, Math.min(maxAzimuthAngle, spherical.theta));
				spherical.makeSafe();
				camera.position.setFromSpherical(spherical);
				camera.lookAt(camera.LookAt);
				camera.updateProjectionMatrix();
			}

			static setupCameraDefaultView(camera, screenWByHRatio, dimensions, horizontalIndex, verticalIndex, viewGroupRenderer, defaultCameraProperties) {
				const defaultLookDirectionIndex = 3 - horizontalIndex - verticalIndex;
				const fullDepth = dimensions.toArray()[defaultLookDirectionIndex];
				let position, lookAt, lookUp, zoom = 1;
				if (defaultCameraProperties !== undefined && Object.keys(defaultCameraProperties).length !== 0) {
					position = defaultCameraProperties.defaultPosition;
					lookAt = defaultCameraProperties.defaultLookAt;
					lookUp = defaultCameraProperties.defaultLookUp;
					zoom = defaultCameraProperties.defaultZoom;
				} else {
					let maxRequiredHalfSize;
					if (screenWByHRatio !== undefined)
						maxRequiredHalfSize = Math.max(dimensions.toArray()[horizontalIndex] / screenWByHRatio,
							dimensions.toArray()[verticalIndex]) / 2;
					else
						maxRequiredHalfSize = dimensions.toArray()[defaultLookDirectionIndex];

					let distanceToNearPlane = maxRequiredHalfSize / this.getTan(camera);
					lookUp = new THREE.Vector3(0, 1, 0);
					lookAt = new THREE.Vector3();
					const lookRight = new THREE.Vector3(1, 0, 0);

					const lookDirection = new THREE.Vector3().crossVectors(lookUp, lookRight).multiplyScalar(distanceToNearPlane + fullDepth / 2);
					position = new THREE.Vector3().subVectors(lookAt, lookDirection);
				}
				if (viewGroupRenderer) {
					const duration = 250;
					this.setAnimationLoop(camera, viewGroupRenderer, lookAt, position, lookUp, duration);
				} else {
					this.setupCamera(camera, position, lookAt, lookUp, zoom);
				}
			}

			static setAnimationLoop(camera, viewGroupRenderer, lookAt, position, lookUp, duration) {
				viewGroupRenderer._height = viewGroupRenderer.div.clientHeight;
				let lookAtVector = camera.LookAt;
				let tweenPosition = new TWEEN.Tween(camera.position).to(position, duration).start();
				new TWEEN.Tween(lookAtVector).to(lookAt, duration).start();
				new TWEEN.Tween(camera.up).to(lookUp, duration).start();
				tweenPosition.onComplete(() => {
					setTimeout(() => {
						viewGroupRenderer.renderer.setAnimationLoop(null);
						viewGroupRenderer.renderTo(viewGroupRenderer.renderer, viewGroupRenderer.scene);
						camera.updateProjectionMatrix();
					})
				});

				viewGroupRenderer.renderer.setAnimationLoop(() => {
					TWEEN.update();
					camera.lookAt(lookAtVector);
					viewGroupRenderer.renderTo(viewGroupRenderer.renderer, viewGroupRenderer.scene);
				})
			}

			static setupCamera(camera, position, lookAt, lookUp, zoom) {
				camera.position.set(position.x, position.y, position.z);
				camera.lookAt(lookAt);
				camera.up.set(lookUp.x, lookUp.y, lookUp.z);
				camera.zoom = zoom;
				camera.updateProjectionMatrix();
			}
		}
	});
