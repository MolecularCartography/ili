#include <VolumeCommon>

const vec3 view_ray = vec3(0.0, 0.0, 1.0);

// Output multiplier value.
uniform float output_multiplier;

// Varyings.
varying vec3 v_texture_coordinates;

void main() {
    vec4 ray_color = get_ray_color(v_texture_coordinates, view_ray);
    ray_color.a *= u_uniformal_opacity;
    ray_color.rgb *= output_multiplier;
    gl_FragColor = ray_color;
}