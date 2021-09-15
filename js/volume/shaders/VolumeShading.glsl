
//----------------------------------------------------------------------
// Shading constants
//----------------------------------------------------------------------

const vec3 viewVec = vec3(0.0, 0.0, 1.0);
const vec4 default_specular_color = vec4(1.0);
const vec4 default_rim_color = vec4(1.0);
const vec3 default_diffuse_light_position = vec3(0.0, 0.0, 1.0);
const vec3 default_specular_light_position = vec3(0.57735, 0.57735, 0.57735);
const float shininess = 16.0;

//----------------------------------------------------------------------
// Shading uniforms
//----------------------------------------------------------------------

// 3D texture of RGB (UInt8 x 3) values representing normalized normal vector coordinates.
uniform sampler3D u_normals_data;

// Lighting enabled flag (should use shading)
uniform int u_lighting_enabled;

// Ambient intensity.
uniform float u_ambient_intensity;

// Diffuse intensity.
uniform float u_diffuse_intensity;

// Specular intensity.
uniform float u_specular_intensity;

// Rim intensity.
uniform float u_rim_intensity;

//----------------------------------------------------------------------
// Methods
//----------------------------------------------------------------------

vec3 normals_sample(vec3 texcoords) {
    return 2.0 * (texture(u_normals_data, texcoords.xyz).rgb - vec3(0.5));
}

vec4 add_lighting(vec4 color, vec3 normal_vector, vec3 view_ray) {
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

vec4 modify_lighting(vec4 current_color, vec3 loc, vec3 view_ray) {
    if (u_lighting_enabled == 1) {
        vec3 normal_vector = normals_sample(loc);
        current_color = add_lighting(current_color, normal_vector, view_ray);
    }
    return current_color;
}