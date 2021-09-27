#include <VolumeCommon>

//----------------------------------------------------------------------
// Structures.
//----------------------------------------------------------------------

struct RaycastingParameters 
{
    vec3 ray_start;
    vec3 ray_stop;
    vec3 ray_step;
    vec3 view_ray;
    int nsteps; 
};

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

RaycastingParameters compute_parameters(vec3 v_position, vec4 v_nearpos, vec4 v_farpos) {
    // Normalize clipping plane info
    vec3 farpos = v_farpos.xyz / v_farpos.w;
    vec3 nearpos = v_nearpos.xyz / v_nearpos.w;

    // Calculate unit vector pointing in the view direction through this fragment.
    vec3 view_ray = normalize(nearpos.xyz - farpos.xyz);

    vec3 minPosition = u_coordinates_adjustment + u_shape_slice_min * u_shape_size;
    vec3 maxPosition = u_coordinates_adjustment + u_shape_slice_max * u_shape_size;

    // Intersect the view ray and the box.
    float t_0, t_1;
    if (!ray_box_intersection(nearpos, view_ray, maxPosition, minPosition, t_0, t_1)) {
        //discard; // TODO: seems to be an error in this check
    }
    vec3 ray_start = (nearpos + view_ray * t_0 - u_coordinates_adjustment) / u_shape_size;
    vec3 ray_stop = (nearpos + view_ray * t_1 - u_coordinates_adjustment) / u_shape_size;
    
    // Find distance.
    vec3 ray_diff = ray_stop - ray_start;
    float distance = length(ray_diff * u_shape_size);

    // Decide how many steps to take
    int nsteps = int((distance / u_relative_step_size) + 0.5);
    // Get texture step.
    vec3 step = ray_diff / float(nsteps);

    RaycastingParameters result;
    result.ray_start = ray_start;
    result.ray_stop = ray_stop;
    result.ray_step = step;
    result.nsteps = nsteps;
    result.view_ray = view_ray;
    return result;
}

vec4 default_raycast(RaycastingParameters parameters) {
    vec4 final_color = vec4(0.0);
    vec3 loc = parameters.ray_start;

    // Enter the raycasting loop. In WebGL 1 the loop index cannot be compared with
    // non-constant expression. So we use a hard-coded max, and an additional condition
    // inside the loop.
    for (int iter = 0; iter < MAX_STEPS; iter++) {
        if (iter >= parameters.nsteps)
            break;

        // Finalize step output.
        vec4 current_color = get_ray_color(loc, parameters.view_ray);
        current_color.a *= u_uniformal_step_opacity;
        final_color = inverseBlend(final_color, current_color);
        loc += parameters.ray_step;
    }

    final_color = finish_inverse_blend(final_color);
    final_color.a *= u_uniformal_opacity;
    return final_color;
}

vec4 debug_steps(RaycastingParameters parameters) {
    // For testing: show the number of steps. This helps to establish
    // whether the rays are correctly oriented
    return vec4(0.0, float(parameters.nsteps) / 1.0 / u_shape_size.x, 0.0, 1.0);
}

vec4 raycast(RaycastingParameters parameters) {
    if (parameters.nsteps < 1 )
    {
        if(debug_mode)
        {
            return vec4(0.0, 1.0, 0.0, 1.0);
        }
        else
        {
            discard;
            return vec4(0, 0, 0, 0);
        }
    }  
    return default_raycast(parameters);
}