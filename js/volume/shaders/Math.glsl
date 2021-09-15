
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

float normalized_value(float scaledValue, vec2 scaledBounds) {
    return (scaledValue - scaledBounds.x) / (scaledBounds.y - scaledBounds.x);
}

float scale(float value, int scaleMode) {
    // Sqrt.
    if(scaleMode == 1) {
        return value < 0.0 ? 0.0 : sqrt(value);
    }
    // Log.
    if (scaleMode == 2) {
        return value <= 0.0 ? 0.0 : log(value) / log(10.0);
    }
    // Linear.
    return value;
}