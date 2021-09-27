precision highp float;
precision mediump sampler3D;

#include <VolumeRaycastingCommon>

// Attributes.
varying vec3 v_position;
varying vec4 v_nearpos;
varying vec4 v_farpos;

void main() {  
    RaycastingParameters parameters = compute_parameters(v_position, v_nearpos, v_farpos);
    gl_FragColor = raycast(parameters);
}