#include <VolumeCommon>

const vec3 view_ray = vec3(0.0, 0.0, 1.0);

// Varyings.
varying float v_normalized_scaled_intensity;
varying vec3 v_normal;

void main() {
    vec4 intensity_color = apply_intensity_colormap(v_normalized_scaled_intensity);
    intensity_color.a *= u_intensity_opacity;
    intensity_color.a *= get_intensity_tf_modifier(1.0, v_normalized_scaled_intensity);
    vec4 shaded_color = add_lighting(intensity_color, v_normal, view_ray);
    shaded_color.a *= u_uniformal_opacity;
    gl_FragColor = shaded_color;
}