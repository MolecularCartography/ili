define(['three', 'threejsutils'], 
    function(THREE, ThreeJsUtils) {

        const DEFAULT_MIN = new THREE.Vector3().set(0, 0, 0);
        const DEFAULT_MAX = new THREE.Vector3().set(1, 1, 1);

        const FAKE_INDICES = new Uint8Array([]);
        const FAKE_VERTICES = new Array();

        class PolyAreaTriangulatorContext {

            constructor(context) {
                this._context = context;
            }

            extractSurfaceIndices() {
                const tempVertices = this._context.tempVertices;
                if (tempVertices.length < 3) {
                    return FAKE_INDICES;
                } 
                const triangleCount = tempVertices.length;
                const result = new Uint8Array(triangleCount * 3);
                for (let i = 0; i < triangleCount - 1; i++) {
                    const offset = i * 3;
                    result[offset] = 0;
                    result[offset + 1] = tempVertices[i].index + 1;
                    result[offset + 2] = tempVertices[i + 1].index + 1;
                }
                // special case for last.
                const lastOffset = (triangleCount - 1) * 3;
                result[lastOffset] = 0;
                result[lastOffset + 1] = tempVertices[triangleCount - 1].index + 1;
                result[lastOffset + 2] = 1;
                return result;
            }

            extractSurfaceVertices() {
                const tempVertices = this._context.tempVertices;
                const vertices = this._context.vertices;
                if (tempVertices.length < 3) {
                    return FAKE_VERTICES;
                } 
                const result = new Array(vertices.length + 1);
                result[0] = this._context.geometryCenter.clone();
                for (let i = 0; i < vertices.length; i++) {
                    result[i + 1] = vertices[i].clone();
                }
                return result;
            }

            extractIndices() {
                const tempVertices = this._context.tempVertices;
                if (tempVertices.length < 3) {
                    return FAKE_INDICES;
                } 
                const triangleCount = tempVertices.length - 2;
                const result = new Uint8Array(triangleCount * 3);
                for (let i = 0; i < triangleCount; i++) {
                    const offset = i * 3;
                    result[offset] = tempVertices[0].index;
                    result[offset + 1] = tempVertices[i + 1].index;
                    result[offset + 2] = tempVertices[i + 2].index;
                }
                return result;
            }

            extractEdgeVertices() {
                const tempVertices = this._context.tempVertices;
                const vertices = this._context.vertices;
                if (tempVertices.length < 3) {
                    return FAKE_VERTICES;
                } 
               
                const edgeCount = tempVertices.length;
                const result = new Array(edgeCount * 2);
                for (let i = 0; i < edgeCount - 1; i++) {
                    result[i * 2] = vertices[tempVertices[i].index];
                    result[i * 2 + 1] = vertices[tempVertices[i + 1].index];
                }
          
                const lastOffset = (edgeCount - 1) * 2;
                result[lastOffset] = result[lastOffset - 1];
                result[lastOffset + 1] = result[0];

                return result;
            }

        }

        class PolyAreaTriangulator {
            constructor(normal) {
                this._normal = normal;
            }

            triangulate(vertices) {
                if (!vertices || vertices.length < 3) {
                    return new PolyAreaTriangulatorContext({
                        geometryCenter: DEFAULT_MIN,
                        vertices: [],
                        tempVertices: []
                    });
                };
                const normal = this._normal;
                const geometryCenter = this._getGeometryCenter(vertices);
                const baseVector = new THREE.Vector3().subVectors(vertices[0], geometryCenter);

                const tempVertices = [];
                tempVertices.push({
                    index: 0,
                    angle: 0
                });

                const vectorCache1 = new THREE.Vector3();
                const vectorCache2 = new THREE.Vector3();
                for (let i = 1; i < vertices.length; i++) {
                    const tempVector = vectorCache1.subVectors(vertices[i], geometryCenter);
                    const crossProduct = vectorCache2.crossVectors(tempVector, baseVector);
                    const angle = this._getAngle(tempVector, baseVector);

                    if (Number.isNaN(angle)) {
                        const dotProduct = tempVector.dot(baseVector);
                        tempVertices.push({
                            index: i,
                            angle: dotProduct < 0 ? Math.PI : 0
                        });
                    } else {
                        const side = this._checkVectors(crossProduct, normal);
                        tempVertices.push({
                            index: i,
                            angle: side ? angle : Math.PI * 2 - angle
                        });
                    }
                }
                tempVertices.sort((a, b) => a.angle - b.angle);

                return new PolyAreaTriangulatorContext({
                    geometryCenter: geometryCenter,
                    vertices: vertices,
                    tempVertices: tempVertices
                });
            }

            _getAngle(v1, v2) {
                const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
                const length = v1.length() * v2.length();
                return Math.acos(dot / length);
            }

            _checkValue(a, b) {
                return Math.sign(a) == Math.sign(b) || (a == 0) || (b == 0);
            }

            _checkVectors(vector, normal) {
                return this._checkValue(vector.x, normal.x) &&
                    this._checkValue(vector.y, normal.y) &&
                    this._checkValue(vector.z, normal.z);
            }

            _getGeometryCenter(positions) {
                const geometryCenter = new THREE.Vector3().set(0, 0, 0);
                for (let i = 0; i < positions.length; i++) {
                    geometryCenter.add(positions[i]);
                }
                geometryCenter.divideScalar(positions.length);
                return geometryCenter;
            }
        }

        class VolumeSectionProcessor {
         
            constructor(min, max) {
                this._min = min ?  min : DEFAULT_MIN;
                this._max = max ? max : DEFAULT_MAX;
                this._size = this._max.clone().sub(this._min);
                this._cubeLinePositions = ThreeJsUtils.cubeLinePositions;
            }

            extractPositions(origin, direction) {
                const result = [];
                const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(direction, origin);
                const lineCache = new THREE.Line3();
                const vectorCache = new THREE.Vector3();

                const point1Cache = new THREE.Vector3();
                const point2Cache = new THREE.Vector3();

                const edgeCount = this._cubeLinePositions.length / 2;
                for (let i = 0; i < edgeCount; i++) {
                    const point1 = point1Cache.copy(this._cubeLinePositions[i * 2]).
                        multiply(this._size).
                        add(this._min);
                    const point2 = point2Cache.copy(this._cubeLinePositions[i * 2 + 1]).
                        multiply(this._size).
                        add(this._min);
                    lineCache.set(point1, point2);
                    if (plane.intersectLine(lineCache, vectorCache)) {
                        result.push(vectorCache.clone());
                    }
                }
                return result;
            }   

            triangulateConvex(vertices, normal) {
                normal = normal.clone().normalize();
                const triangulator = new PolyAreaTriangulator(normal);
                return triangulator.triangulate(vertices);
            }
        }

        return VolumeSectionProcessor;
    }
);
