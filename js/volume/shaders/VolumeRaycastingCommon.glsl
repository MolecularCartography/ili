#include <VolumeCommon>

//----------------------------------------------------------------------
// Constants.
//----------------------------------------------------------------------

// By default true
const bool complex_distance_calculation = true;

// Debug mode flag.
const bool debug_mode = false;

// Minimum transparency.
const float transperancy_limit = 0.05;

// The maximum distance through our rendering volume is sqrt(3).
const int MAX_STEPS = 2000;      // 887 for 512^3, 1774 for 1024^3

//----------------------------------------------------------------------
// Common uniforms.
//----------------------------------------------------------------------

// Uniform opacity for step.
uniform float u_uniformal_step_opacity;

//----------------------------------------------------------------------
// Methods.
//----------------------------------------------------------------------

bool ray_box_intersection(vec3 view_ray_start, vec3 view_ray_direction, vec3 top, vec3 bottom, out float t_0, out float t_1)
{
    vec3 direction_inv = 1.0 / view_ray_direction;
    vec3 t_top = direction_inv * (top - view_ray_start);
    vec3 t_bottom = direction_inv * (bottom - view_ray_start);
    vec3 t_min = min(t_top, t_bottom);
    vec2 t = max(t_min.xx, t_min.yz);
    t_0 = max(0.0, max(t.x, t.y));
    vec3 t_max = max(t_top, t_bottom);
    t = min(t_max.xx, t_max.yz);
    t_1 = min(t.x, t.y);
    return !(t_0 < 0.0 || t_0 > t_1);
}

void debug_steps(int nsteps, float range) {
    // For testing: show the number of steps. This helps to establish
    // whether the rays are correctly oriented
    gl_FragColor = vec4(0.0, float(nsteps) / 1.0 / range, 0.0, 1.0);
}

void discard_transparent() {
    if (gl_FragColor.a < transperancy_limit)
    {
        if(debug_mode)
        {
            gl_FragColor = vec4(0.9, 0.1, 0.1, 1.0);
        }
        else
        {
            discard;
        }
    }
}

