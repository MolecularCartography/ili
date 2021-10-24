precision highp float;
precision mediump sampler3D;

#include <Math>
#include <VolumeShading>

//----------------------------------------------------------------------
// Common uniforms.
//----------------------------------------------------------------------

// Size of 3D data matrix
uniform vec3 u_shape_size;

// Raycasting render style.
uniform int u_renderstyle;

// Relative step size.
uniform float u_relative_step_size;

// Uniform opacity.
uniform float u_uniformal_opacity;

// Output multiplier value.
uniform float output_multiplier_1;

// Output multiplier value.
uniform float output_multiplier_2;

//----------------------------------------------------------------------
// Shape uniforms.
//----------------------------------------------------------------------

// 3D texture of shape.
uniform sampler3D u_shape_data;

// 2D texture of shape color map.
uniform sampler2D u_shape_cmdata;

// 2D texture of shape transfer function.
uniform sampler2D u_shape_tfdata;

// 2D texture of shape transfer function based on intensity.
uniform sampler2D u_shape_tfdata_ex;

// Transfer function source enum.
// 0 - Disabled
// 1 - Shape
// 2 - Intensity
uniform int u_shape_tfsource;

// Shape bounds (min, max)
uniform vec2 u_shape_bounds;

// Shape coordinates adjustment.
uniform vec3 u_coordinates_adjustment;

// Notify is shape tf opacity enabled.
uniform int u_shape_tf_opacity_enabled;

// Shape slice min.
uniform vec3 u_shape_slice_min;

// Shape slice max.
uniform vec3 u_shape_slice_max;

//----------------------------------------------------------------------
// Intensity uniforms.
//----------------------------------------------------------------------

// 3D texture of intesities.
uniform sampler3D u_intensity_data;

// 3D texture of intensity opacities.
uniform sampler3D u_intensity_opacity_data;

// 2D texture of intensity color map.
uniform sampler2D u_intensity_cmdata;

// Transfer function source enum.
// 0 - Disabled
// 1 - Intensity
uniform int u_intensity_tfsource;

// 2D texture of intensity transfer function.
uniform sampler2D u_intensity_tfdata;

// Intensity bounds (min, max)
uniform vec2 u_intensity_bounds_scaled;

// Intensity size factor.
uniform float u_intensity_size_factor;

// Global intensity opacity.
uniform float u_intensity_opacity;

// Intensity mode flag.
uniform int u_intensity_enabled;

// Scale mode.
uniform int u_scalemode;

// Flag if intensity alpha should be multiplied by shape flag.
uniform int u_shape_intensity_enabled;

// Intensity opacity enabled flag.
uniform int u_intensity_opacity_enabled;

//----------------------------------------------------------------------
// Methods.
//----------------------------------------------------------------------

// Sample float value from a 3D texture. Assumes shappe intensity data.
float shape_sample(vec3 texcoords) { 
    return texture(u_shape_data, texcoords.xyz).r;
}

// Sample float value from a 3D texture. Assumes intensity data.
float intensity_sample(vec3 texcoords) {
    return texture(u_intensity_data, texcoords.xyz).r;
}

// Sample float value from a 3D texture. Assumes intensity opacity data.
float intensity_opacity_sample(vec3 texcoords) {
    return texture(u_intensity_opacity_data, texcoords.xyz).r;
}

vec4 apply_shape_colormap(float normalized_value) {
    return texture2D(u_shape_cmdata, vec2(normalized_value, 0.5));
}

vec4 apply_intensity_colormap(float normalized_value) {
    return texture2D(u_intensity_cmdata, vec2(normalized_value, 0.5));
}

float shape_transfer_function_sample(float normalized_value) {
    return texture2D(u_shape_tfdata, vec2(normalized_value, 0.5)).a;
}

float shape_transfer_function_ex_sample(float normalized_value) {
    return texture2D(u_shape_tfdata_ex, vec2(normalized_value, 0.5)).a;
}

float intensity_transfer_function_sample(float normalized_value) {
    return texture2D(u_intensity_tfdata, vec2(normalized_value, 0.5)).a;
}

bool extract_shape_values(vec3 loc, out float value, out float normalizedValue) {
    value = shape_sample(loc);
    normalizedValue = normalized_value(value, u_shape_bounds);
    return true;
}

bool extract_intensity_values(vec3 loc, out float value, out float normalizedValue) {
    value = 0.0;
    normalizedValue = 0.0;

    if (u_intensity_enabled == 1) {
        value = intensity_sample(loc);
        if (!isinf(value)) {
            normalizedValue = normalized_value(
                scale(value, u_scalemode), 
                u_intensity_bounds_scaled);
            return true;
        }
        return false;
    }
    return false;
}

vec4 extract_shape_color(vec3 loc, out float tfModifier) {
    float shape_value, normalized_shape_value;
    if (!extract_shape_values(loc, shape_value, normalized_shape_value)) {
        tfModifier = 0.0;
        return vec4(0.0);
    }

    vec4 shape_color = apply_shape_colormap(normalized_shape_value);
    tfModifier = normalized_shape_value;
    return shape_color;
}

vec4 extract_intensity_color(vec3 loc, out float tfModifier) {
    float intensity_value, normalized_intensity_value;
    if (!extract_intensity_values(loc, intensity_value, normalized_intensity_value)) {
        tfModifier = -1.0;
        return vec4(0.0);
    }

    vec4 intensity_color = apply_intensity_colormap(normalized_intensity_value);
    intensity_color.a *= u_intensity_opacity;
    if (u_intensity_opacity_enabled == 1) {
        intensity_color.a *= intensity_opacity_sample(loc);
    }  
    tfModifier = normalized_intensity_value;
    return intensity_color;
}

float get_shape_tf_modifier(float shapeModifier, float intensityModifier) {
    switch (u_shape_tfsource) {
        case 1:
            return shapeModifier;
        case 2:
            return shape_transfer_function_sample(shapeModifier);
        case 3:
            if (intensityModifier >= 0.0) {
                return shape_transfer_function_sample(shapeModifier) * shape_transfer_function_ex_sample(intensityModifier);
            } else {
                return 0.0;
            }
    }
    return 0.0;
}

float get_intensity_tf_modifier(float shapeModifier, float intensityModifier) {
    switch (u_intensity_tfsource) {
        case 0:
            return 1.0;
        case 1:
            return intensityModifier;
        case 2:
            return intensity_transfer_function_sample(intensityModifier);
    }
    return 0.0;
}

vec4 merge_shape_intensity_colors(vec4 shape_color, vec4 intensity_color) {
    switch (u_renderstyle) {
        case 0:
            shape_color.rgb = mix(shape_color.rgb, intensity_color.rgb, intensity_color.a);
            return shape_color;
    }
}

vec4 get_ray_color(vec3 loc, vec3 shading_ray) {
    // Accumulate shape color.
    float shapeTfModifier = 0.0;
    vec4 shape_color = extract_shape_color(loc, shapeTfModifier);
    if (shape_color.a == 0.0) {
        return vec4(0.0);
    }

    // Accumulate intensity color.
    float intensityTfModifier = 0.0;
    vec4 intensity_color = extract_intensity_color(loc, intensityTfModifier);

    // Submit transfer functions alpha modifiers based on input sources.
    float shape_tf_modifier = get_shape_tf_modifier(shapeTfModifier, intensityTfModifier);
    float intensity_tf_modifier = get_intensity_tf_modifier(shapeTfModifier, intensityTfModifier);
    if (u_shape_tf_opacity_enabled == 1) {
        shape_color.a *= shape_tf_modifier;
    } 
    intensity_color.a *= intensity_tf_modifier;
    if (u_shape_intensity_enabled == 1) {
        intensity_color.a *= shape_tf_modifier;
    }

    // Merge the colors.
    vec4 merged_color = merge_shape_intensity_colors(shape_color, intensity_color);
    vec4 shaded_color = modify_lighting(merged_color, loc, shading_ray);   

    // This contains result color.
    return shaded_color;
}