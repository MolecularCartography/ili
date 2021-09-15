precision highp float;
precision mediump sampler3D;

#include <VolumeRaycastingCommon>

// Attributes.
varying vec3 v_position;
varying vec4 v_nearpos;
varying vec4 v_farpos;

void raycast(vec3 start_loc, vec3 step, int nsteps, vec3 view_ray);

void main() {
    //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    //return;
    
    // Normalize clipping plane info
    vec3 farpos = v_farpos.xyz / v_farpos.w;
    vec3 nearpos = v_nearpos.xyz / v_nearpos.w;

    // Calculate unit vector pointing in the view direction through this fragment.
    //vec3 view_ray = normalize(nearpos.xyz - farpos.xyz);
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

    if ( nsteps < 1 )
    {
        if(debug_mode)
        {
            gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
            return;
        }
        else
        {
            discard;
        }
    }

    // Get texture step.
    vec3 step = ray_diff / float(nsteps);

    // Raycast.
    if (u_renderstyle == 0)
    {
        raycast(ray_start, step, nsteps, view_ray);
    }
    // Debug.
    if (u_renderstyle == 1)
    {
        debug_steps(nsteps, u_shape_size.x);
    }
}

void raycast(vec3 start_loc, vec3 step, int nsteps, vec3 view_ray) {
    gl_FragColor = vec4(0.0);
    vec4 final_color = vec4(0.0);
    vec3 loc = start_loc;

    // Enter the raycasting loop. In WebGL 1 the loop index cannot be compared with
    // non-constant expression. So we use a hard-coded max, and an additional condition
    // inside the loop.
    for (int iter=0; iter<MAX_STEPS; iter++) {
        if (iter >= nsteps)
            break;

        // Finalize step output.
        vec4 current_color = get_ray_color(loc, view_ray, true);
        current_color.a *= u_uniformal_step_opacity;
        final_color = inverseBlend(final_color, current_color);
        loc += step;
    }

    final_color = finish_inverse_blend(final_color);
    final_color.a *= u_uniformal_opacity;
    gl_FragColor = final_color;
}