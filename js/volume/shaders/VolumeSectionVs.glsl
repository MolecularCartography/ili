#include <VolumeCommon>

// Outputs.
varying vec3 v_texture_coordinates;

void main() {
    vec4 shiftPosition = vec4(position * u_shape_size - u_shape_size / 2.0 + u_coordinates_adjustment, 1.0);
    v_texture_coordinates = position;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * shiftPosition;
}