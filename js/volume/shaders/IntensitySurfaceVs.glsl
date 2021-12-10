#include <VolumeCommon>

// Uniforms.
uniform float u_spot_intensity;
uniform vec3 u_spot_size;
uniform vec3 u_spot_offset;

// Outputs.
varying float v_normalized_scaled_intensity;
varying vec3 v_normal;

void main() {
    vec3 resultPosition = position * u_spot_size * u_intensity_size_factor + u_spot_offset;
    vec3 maxSlice = u_shape_slice_max * u_shape_size;
    vec3 minSlice = u_shape_slice_min * u_shape_size;
    resultPosition = max(min(resultPosition, maxSlice), minSlice);

    v_normal = (viewMatrix * vec4(normal, 0.0)).xyz; // TODO:

    float scaled_intensity = scale(u_spot_intensity, u_scalemode);
    float normalized_intensity = normalized_value(scaled_intensity, u_intensity_bounds_scaled);
    v_normalized_scaled_intensity = normalized_intensity;

    vec4 shiftPosition = vec4(resultPosition - u_shape_size / 2.0 + u_coordinates_adjustment, 1.0);
    gl_Position = projectionMatrix * viewMatrix * shiftPosition;
}
