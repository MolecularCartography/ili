define([
		'three', 'tween'
	],
	function (THREE, TWEEN) {

		return class CameraHelper {

			// tricky way of making ThreeJS camera more functional.
			static decorateCamera(camera, animationController) {

				// setup animation controller property.
				camera._proxy_animationController = animationController;

				// decorate lookAt.
				const prevLookAt = camera.lookAt;
				camera.getLookAt = () => camera._proxy_lookAt;
				camera._proxy_lookAt = new THREE.Vector3();
				camera.lookAt = (lookAt) => {
					prevLookAt.bind(camera)(lookAt);
					camera._proxy_lookAt = lookAt;
				}; 

				// decorate update method.
				camera.getLookRight = () => camera._proxy_lookRight;
				camera.getLookUp = () => camera._proxy_lookUp;
				camera.getLookTo = () => camera._proxy_lookTo;
				camera.getLookToNormalized = () => camera._proxy_lookToNormalized;
				camera.getAspect = () => camera._proxy_aspect;
				
				const cameraDirection = new THREE.Vector3();
				const cameraRight = new THREE.Vector3();
				const cameraLookUp = new THREE.Vector3();
				const cameraLookTo = new THREE.Vector3();
				const cameraLookToNormalized = new THREE.Vector3();

				camera._proxy_cameraDirection = cameraDirection;
				camera._proxy_lookRight = cameraRight;
				camera._proxy_lookUp = cameraLookUp;
				camera._proxy_lookTo = cameraLookTo;
				camera._proxy_lookToNormalized = cameraLookToNormalized;

				const prepareParameters = () => {
					camera.getWorldDirection(cameraDirection);
					cameraRight.crossVectors(camera.up, cameraDirection).normalize();
					cameraLookUp.copy(camera.up);
					cameraLookTo.subVectors(camera.getLookAt(), camera.position);
					cameraLookToNormalized.copy(cameraLookTo).normalize();

					let aspect = 0;
					if (camera instanceof THREE.PerspectiveCamera) {
						aspect = camera.aspect;
					} else {
						aspect = Math.abs(camera.right - camera.left) / Math.abs(camera.top - camera.bottom);
					}
					camera._proxy_aspect = aspect;
				};

				const prevUpdate = camera.updateProjectionMatrix;
				camera.updateProjectionMatrix = () => {
					prepareParameters();
					prevUpdate.bind(camera)();
				};

				camera.setup = (viewInfo, duration) => {
					if (!viewInfo) {
						return;
					}
					if (camera._proxy_animationController && duration) {
						CameraHelper.animateCamera(camera._proxy_animationController, camera, viewInfo, duration);
					} else {
						if (viewInfo.fov) {
							camera.fov = viewInfo.fov;
						}
						if (viewInfo.position) {
							camera.position.copy(viewInfo.position);
						}		
						if (viewInfo.lookUp) {
							camera.up.copy(viewInfo.lookUp);
						}
						if (viewInfo.zoom) {
							camera.zoom = viewInfo.zoom;
						}
						if (viewInfo.lookAt) {
							camera.lookAt(viewInfo.lookAt);
						} else {
							camera.lookAt(camera.getLookAt());
						}
						camera.updateProjectionMatrix();
					}			
				};

				prepareParameters();
			}

			static zoom(camera, wheelDelta, scalingCoefficient) {
				const minZoom = 0.1;
				const maxZoom = 4.0;

				let zoom = camera.zoom * scalingCoefficient;
				zoom = Math.min(zoom, maxZoom);
				zoom = Math.max(zoom, minZoom);
				camera.setup({
					zoom: zoom
				});
			}

			static getCameraCSSMatrix(matrix) {
				const elements = matrix.elements;
				return 'matrix3d(' +
					this.epsilon(elements[0]) + ',' +
					this.epsilon(-elements[1]) + ',' +
					this.epsilon(elements[2]) + ',' +
					this.epsilon(elements[3]) + ',' +
					this.epsilon(elements[4]) + ',' +
					this.epsilon(-elements[5]) + ',' +
					this.epsilon(elements[6]) + ',' +
					this.epsilon(elements[7]) + ',' +
					this.epsilon(elements[8]) + ',' +
					this.epsilon(-elements[9]) + ',' +
					this.epsilon(elements[10]) + ',' +
					this.epsilon(elements[11]) + ',' +
					0 + ',' +
					0 + ',' +
					0 + ',' +
					1 +
					')';
			}

			static epsilon( value ) {
				return Math.abs( value ) < 1e-10 ? 0 : value;
			}

			static pan(camera, screenDelta) {
				let halfVerticalViewSize = 0;
				if (camera instanceof THREE.PerspectiveCamera) {
					halfVerticalViewSize += camera.getLookTo().length() * Math.tan(camera.fov / 2);
				} else {
					halfVerticalViewSize = Math.abs(camera.right - camera.left) / 2;
				}

				const lookRight = camera.getLookRight().clone();
				const lookUp = camera.getLookUp().clone();

				const displacement = lookRight.multiplyScalar(halfVerticalViewSize * camera.aspect * screenDelta.x)
					.add(lookUp.multiplyScalar(-halfVerticalViewSize * screenDelta.y));
				displacement.multiplyScalar(2.0);
				displacement.divideScalar(camera.zoom);

				const newPosition = camera.position.clone().add(displacement);
				const newLookAt = camera.getLookAt().clone().add(displacement);

				camera.setup({
					position: newPosition,
					lookAt: newLookAt
				});
			}

			static rotateByOrientationWidget(camera, target, eyeFixed, duration) {
				const dist = camera.position.clone().sub(target).length();
				const edgeDist = Math.sqrt(dist * dist / 2);
				const cornerDist = Math.sqrt(dist * dist / 3);
				const position = new THREE.Vector3().fromArray(eyeFixed(dist, edgeDist, cornerDist));
				const up = camera.up.clone(); // TODO: think of improving up logic.
				camera.setup({
					lookUp: up,
					lookAt: target,
					position: position,
					zoom: 1.0
				}, duration);
			}

			static convertRelative(point) {
				return new THREE.Vector2().set(point.x * 2.0 - 1.0, point.y * 2.0 - 1.0);
			}

			static rotate(camera, startLocation, stopLocation) {

				startLocation = this.convertRelative(startLocation);
				stopLocation = this.convertRelative(stopLocation);

				const MapToSphericalPoint = (point) => {
                    let squareLength = point.lengthSq();
                    return new THREE.Vector3(point.x, point.y, squareLength > 1 ? 0.0 : Math.sqrt(1.0 - squareLength));
				}
                
                const MapToDataCoordSystem = (point) => {
					const lookRight = camera.getLookRight().clone().normalize();
					const lookUp = camera.getLookUp().clone().normalize();
					const lookTo = camera.getLookTo().clone().normalize();
					return (lookRight.multiplyScalar(-point.x)).add(lookUp.multiplyScalar(point.y)).sub(lookTo.multiplyScalar(point.z));
				};

                const mappedStartRotation = MapToDataCoordSystem(MapToSphericalPoint(startLocation)).normalize();
                const mappedStopRotation = MapToDataCoordSystem(MapToSphericalPoint(stopLocation)).normalize();

                const rotationAxis = new THREE.Vector3().crossVectors(mappedStartRotation, mappedStopRotation).normalize();
                let dotProduct = mappedStartRotation.dot(mappedStopRotation);
                dotProduct = Math.min(dotProduct, 1); // in some cases even normalized vectors (even with double precision) can get product > 1.
                const angle = -Math.acos(dotProduct);

				this.rotateAroundAxis(camera, rotationAxis, angle);
			}

			static rotateAroundAxis(camera, rotationAxis, angle) {
                const rotation = new THREE.Matrix4().makeRotationAxis(rotationAxis, angle);
				const lookToEx = camera.getLookTo().clone();
				const lookToLength = lookToEx.length();
				const rotatedLookTo = lookToEx.transformDirection(rotation).multiplyScalar(lookToLength);
				const newPosition = camera.getLookAt().clone().sub(rotatedLookTo);
				const newLookUp = camera.up.clone().transformDirection(rotation);
				camera.setup({
					position: newPosition, 
					lookUp: newLookUp
				});
			}

			static rotateLeft(camera, axis, autoRotateSpeed) {
				const angle = Math.PI / 60 / 60 * autoRotateSpeed;
				const transformedAxis = axis.clone().transformDirection(camera.matrixWorld);
				this.rotateAroundAxis(camera, transformedAxis, angle);
			}

			static fitAspect(camera, boundingBox, horizontalIndex, verticalIndex, multiplier) {
				multiplier = multiplier ? multiplier : 1.1;
				if (!boundingBox) {
					return;
				}
				const cameraAspect = camera.aspect;
				if (camera instanceof THREE.OrthographicCamera) {
					const depthIndex = 3 - horizontalIndex - verticalIndex;
					const min = boundingBox.min;
					const max = boundingBox.max;
					const size = new THREE.Vector3().subVectors(max, min);
					
					const horizontal = size.getComponent(horizontalIndex);
					const vertical = size.getComponent(verticalIndex)
					const depth = size.getComponent(depthIndex);

				    const maxDimension = Math.max(horizontal, vertical) * multiplier;
					const maxDimensionWithDepth = Math.max(Math.abs(depth), Math.max(Math.abs(horizontal), Math.abs(vertical)));

					const right = maxDimension / 2 * cameraAspect;
					const left = -right;
					const top = maxDimension / 2;
					const bottom = -top;

					camera.left = left;
					camera.right = right;
					camera.top = top;
					camera.bottom = bottom;
					camera.near = 0.1;
					camera.far = maxDimensionWithDepth * 4;
				}
				camera.updateProjectionMatrix();
			}

			static setup(camera, position, lookAt, up, zoom, animationController, duration) {
				if (animationController && duration !== undefined) {
					this.animateCamera(animationController, camera, {
						position: position,
						lookAt: lookAt,
						up: up,
						zoom: zoom,
					}, duration);		
				} else {
					camera.setup(position, lookAt, up, zoom);
				}
			}

			static setDefaultView(camera, boundingBox, horizontalIndex, verticalIndex, duration) {
				const defaultLookDirectionIndex = 3 - horizontalIndex - verticalIndex;

				// def parameters.
				const size = boundingBox.getSize(new THREE.Vector3());
				const center = boundingBox.getCenter(new THREE.Vector3());
				const fullDepth = size.getComponent(defaultLookDirectionIndex);
				const aspect = !Number.isNaN(camera.aspect) ? camera.aspect : 1.0;
				const maxRequiredHalfSize = Math.max(
					size.getComponent(horizontalIndex) / aspect,
					size.getComponent(verticalIndex)) / 2;

				const fov = Math.PI / 4;
				let distanceToNearPlane = 0;
				if (camera instanceof THREE.PerspectiveCamera) {
					distanceToNearPlane += maxRequiredHalfSize / Math.tan(fov / 2) + fullDepth / 2;
				} 
				else {
					distanceToNearPlane += maxRequiredHalfSize + fullDepth * 2;
				}
				distanceToNearPlane *= 1.1;

				// look up to vertical index.
				const lookUp = new THREE.Vector3().set(0, 0, 0).setComponent(verticalIndex, 1);
				const lookAt = new THREE.Vector3().copy(center);
				const lookRight = new THREE.Vector3().set(0, 0, 0).setComponent(horizontalIndex, 1);
				const lookDirection = new THREE.Vector3().crossVectors(lookUp, lookRight).multiplyScalar(distanceToNearPlane);
				const position = new THREE.Vector3().subVectors(lookAt, lookDirection);

				// setup settings.
				const resultView = {
					position: position,
					lookAt: lookAt,
					lookUp: lookUp,
					zoom: 1.0,
					fov: fov * (180.0 / Math.PI)
				};
				camera.setup(resultView, duration);				
			}

			// TODO: use this method.
			static animateCamera(controller, camera, viewInfo, duration) {
				controller.setState('begin');

				const setters = [
					(camera, value) => camera.position.copy(value),				
					(camera, value) => camera.up.copy(value),
					(camera, value) => camera.zoom = value[0],
					(camera, value) => camera.lookAt(value),
				];
				const destValues = [viewInfo.position, viewInfo.lookUp, viewInfo.zoom, viewInfo.lookAt];
				const srcValues = [camera.position, camera.up, camera.zoom, camera.getLookAt()];

				return new Promise((resolve, reject) => {
					const infos = [];
					for (let i = 0; i < srcValues.length; i++) {
						if (!destValues[i] || !srcValues[i]) {
							continue;
						}
						const value = srcValues[i] instanceof THREE.Vector3 ? srcValues[i].clone() : [srcValues[i]];
						const destValue = destValues[i] instanceof THREE.Vector3 ? destValues[i].clone() : [destValues[i]];
						const tween = new TWEEN.Tween(value);
						tween.to(destValue, duration);
						tween.start();
						infos.push({
							storage: value,
							tween: tween,
							setter: setters[i]
						});
					}
	
					const update = () => {
						for (let i = 0; i < infos.length; i++) {
							const setter = infos[i].setter;
							setter(camera, infos[i].storage);
						}
						camera.updateProjectionMatrix();
					};
	
					infos[0].tween.onComplete(() => {
						setTimeout(() => {
							update();
							animationLoop.stop();
							controller.requestRedraw();		
							resolve();	
						});
						controller.setState('end');
					});
	
					const animationLoop = controller.setAnimationLoop(() => {
						TWEEN.update();
						update();
						controller.requestRedraw();
					});
	
				});	
			}

		}
	});
