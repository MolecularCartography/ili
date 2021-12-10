#include <VolumeCommon>

// Instance attributes.
attribute vec3 a_instance_position;
attribute vec3 a_instance_size;
attribute float a_instance_intensity;

// Outputs.
varying float v_normalized_scaled_intensity;
varying vec3 v_normal;

void main() {
    vec3 resultPosition = position * a_instance_size * u_intensity_size_factor + a_instance_position;
    vec3 maxSlice = u_shape_slice_max * u_shape_size;
    vec3 minSlice = u_shape_slice_min * u_shape_size;
    resultPosition = max(min(resultPosition, maxSlice), minSlice);

    v_normal = (viewMatrix * vec4(normal, 0.0)).xyz;

    float scaled_intensity = scale(a_instance_intensity, u_scalemode);
    float normalized_intensity = normalized_value(scaled_intensity, u_intensity_bounds_scaled);
    v_normalized_scaled_intensity = normalized_intensity;

    vec4 shiftPosition = vec4(resultPosition - u_shape_size / 2.0, 1.0);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * shiftPosition;
}
