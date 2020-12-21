precision highp float;
precision mediump sampler3D;

uniform vec3 u_shape_size;
uniform sampler3D u_shape_data;
uniform sampler2D u_shape_cmdata;
uniform vec2 u_shape_bounds;

uniform vec3 u_intensity_size;
uniform sampler3D u_intensity_data;
uniform sampler2D u_intensity_cmdata;
uniform vec2 u_intensity_bounds;

uniform vec3 u_normals_size;
uniform sampler3D u_normals_data;

uniform int u_renderstyle;
uniform float u_relative_step_size;
uniform int u_scalemode;
uniform float uniformal_opacity;
uniform float uniformal_step_opacity;

uniform int u_proportional_opacity_enabled;
uniform int u_lighting_enabled;

uniform float u_ambient_intensity;
uniform float u_diffuse_intensity;
uniform float u_specular_intensity;
uniform float u_rim_intensity;

varying vec3 v_position;
varying vec4 v_nearpos;
varying vec4 v_farpos;


// The maximum distance through our rendering volume is sqrt(3).
const int MAX_STEPS = 887;      // 887 for 512^3, 1774 for 1024^3

const vec3 viewVec = vec3(0.0, 0.0, 1.0);

const vec4 default_specular_color = vec4(1.0);
const vec4 default_rim_color = vec4(1.0);
const vec3 default_diffuse_light_position = vec3(0.0, 0.0, 1.0);
const vec3 default_specular_light_position = vec3(0.57735, 0.57735, 0.57735);

const float shininess = 16.0;

const float transperancy_limit = 0.05;

const bool complex_distance_calculation = true;
const bool debug_mode = false;

void raycast(vec3 start_loc, vec3 step, int nsteps, vec3 view_ray);

float shape_sample(vec3 texcoords);
float intensity_sample(vec3 texcoords);
vec3 normals_sample(vec3 texcoords);

float calculate_distance(vec3 nearpos, vec3 farpos, vec3 view_ray);
void debug_steps(int nsteps, float range);
void discard_transparent();

vec4 apply_shape_colormap(float val);
vec4 apply_intensity_colormap(float val);

vec4 add_lighting(vec4 color, vec3 normal_vector, vec3 view_ray);
float normalized_value(float intensity, vec2 bounds);
float scale(float value);

vec4 inverseBlend(vec4 base, vec4 blend);
vec4 finish_inverse_blend(vec4 color);

void main() {
    // Normalize clipping plane info
    vec3 farpos = v_farpos.xyz / v_farpos.w;
    vec3 nearpos = v_nearpos.xyz / v_nearpos.w;

    // Calculate unit vector pointing in the view direction through this fragment.
    vec3 view_ray = normalize(nearpos.xyz - farpos.xyz);

    float distance = calculate_distance(nearpos, farpos, view_ray);

    // Now we have the starting position on the front surface
    vec3 front = v_position + view_ray * distance;

    // Decide how many steps to take
    int nsteps = int((-distance / u_relative_step_size) + 0.5);
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

    // Get starting location and step vector in texture coordinates
    vec3 step = ((v_position - front) / u_shape_size) / float(nsteps);
    vec3 start_loc = front / u_shape_size;

    if (u_renderstyle == 0)
    {
        raycast(start_loc, step, nsteps, view_ray);
    }
    if (u_renderstyle == 1)
    {
        debug_steps(nsteps, u_shape_size.x);
    }
}

float shape_sample(vec3 texcoords) {
    // Sample float value from a 3D texture. Assumes intensity data.
    return texture(u_shape_data, texcoords.xyz).r;
}

float intensity_sample(vec3 texcoords) {
    // Sample float value from a 3D texture. Assumes intensity data.
    return texture(u_intensity_data, texcoords.xyz).r;
}

vec3 normals_sample(vec3 texcoords) {
    return 2.0 * (texture(u_normals_data, texcoords.xyz).rgb - vec3(0.5));
}

float calculate_distance(vec3 nearpos, vec3 farpos, vec3 view_ray) {
    // Compute the (negative) distance to the front surface or near clipping plane.
    // v_position is the back face of the cuboid, so the initial distance calculated in the dot
    // product below is the distance from near clip plane to the back of the cuboid
    float distance = dot(nearpos - v_position, view_ray);
    if (complex_distance_calculation)
    {
        distance = max(
            distance,
            min((-0.5 - v_position.x) / view_ray.x,
                (u_shape_size.x - 0.5 - v_position.x) / view_ray.x));
        distance = max(
            distance,
            min((-0.5 - v_position.y) / view_ray.y,
                (u_shape_size.y - 0.5 - v_position.y) / view_ray.y));
        distance = max(
            distance,
            min((-0.5 - v_position.z) / view_ray.z,
                (u_shape_size.z - 0.5 - v_position.z) / view_ray.z));
    }
    return distance;
}

vec4 apply_shape_colormap(float normalized_value) {
    return texture2D(u_shape_cmdata, vec2(normalized_value, 0.5));
}

vec4 apply_intensity_colormap(float normalized_value) {
    return texture2D(u_intensity_cmdata, vec2(normalized_value, 0.5));
}

void raycast(vec3 start_loc, vec3 step, int nsteps, vec3 view_ray) {
    gl_FragColor = vec4(0.0);
    vec4 final_color = vec4(0.0, 0.0, 0.0, 0.0);
    vec3 loc = start_loc;

    // Enter the raycasting loop. In WebGL 1 the loop index cannot be compared with
    // non-constant expression. So we use a hard-coded max, and an additional condition
    // inside the loop.
    for (int iter=0; iter<MAX_STEPS; iter++) {
        if (iter >= nsteps)
            break;

        float shape_value = shape_sample(loc);
        float normalized_shape_value = normalized_value(shape_value, u_shape_bounds);
        vec4 shape_color = apply_shape_colormap(normalized_shape_value);
        shape_color.a *= normalized_shape_value;

        vec4 current_color = shape_color; 

        float intensity_value = intensity_sample(loc);
        float normalized_intensity_value = normalized_value(
            intensity_value, 
            u_intensity_bounds);
        if (!isnan(normalized_intensity_value)) {
            vec4 intensity_color = apply_intensity_colormap(normalized_intensity_value);
            if (u_proportional_opacity_enabled == 1) {
                intensity_color.a *= normalized_intensity_value; 
            }
            current_color.rgb = mix(current_color.rgb, intensity_color.rgb, intensity_color.a);
        }
      
        if (u_lighting_enabled == 1) {
            vec3 normal_vector = normals_sample(loc);
            current_color = add_lighting(current_color, normal_vector, view_ray);
        }
  
        current_color.a *= uniformal_step_opacity;

        final_color = inverseBlend(final_color, current_color);

        loc += step;
    }
    final_color = finish_inverse_blend(final_color);
    final_color.a *= uniformal_opacity;
    gl_FragColor = final_color;
}

vec4 inverseBlend(vec4 base, vec4 blend) {
    return base + (1.0 - base.a) * vec4(blend.rgb * blend.a, blend.a);
}

vec4 finish_inverse_blend(vec4 color) {
    if (color.a == 0.0) {
        return vec4(0.0, 0.0, 0.0, 0.0);
    }
    else {
        return vec4(color.rgb / color.a, color.a);
    }
}

float normalized_value(float value, vec2 bounds) {
    // scale all values and calculate normalized value with it.
    float scaled_value = scale(value);
    float scaled_min = scale(bounds.x);
    float scaled_max = scale(bounds.y);

    return (scaled_value - scaled_min) / (scaled_max - scaled_min);
}

float scale(float value) {
    if(u_scalemode == 1) {
        value = max(0.0, value);
        return sqrt(value);
    }
    if (u_scalemode == 2) {
        value = max(0.0001, value);
        return log(value) / log(10.0);
    }
    return value;
}

vec4 add_lighting(vec4 color, vec3 normal_vector, vec3 view_ray) {
    // Calculate color by incorporating lighting

    // View direction
    vec3 V = normalize(view_ray);
    normal_vector = normalize(normal_vector);

    // Flip normal so it points towards viewer
    //float Nselect = float(dot(normal_vector, V) > 0.0);
    //normal_vector = (2.0 * Nselect - 1.0) * normal_vector;

    float dd = 0.0;
    vec4 final_color = color * u_ambient_intensity;
    if (u_diffuse_intensity > 0.0) {
        dd = abs(dot(normal_vector, default_diffuse_light_position));
        final_color += color * u_diffuse_intensity * dd;
    }
    if (u_specular_intensity > 0.0) {
        vec3 H = normalize(default_specular_light_position + viewVec);
        float D = abs(dot(normal_vector, H));
        final_color += default_specular_color * u_specular_intensity * D 
            / (shininess - D * shininess + D);
    }
    if (u_rim_intensity > 0.0) {
        if (dd == 0.0) {
            dd = abs(dot(normal_vector, default_diffuse_light_position));
        }
        final_color += pow(1.0 - dd, 4.0) * u_rim_intensity * default_rim_color;
    }

    final_color.a = color.a;
    return clamp(final_color, 0.0, 1.0);
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

