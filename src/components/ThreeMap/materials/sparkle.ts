import { Color } from 'three';

import type { Uniforms } from './surface';

/**
 * 漂浮光柱（BeamLight）材质：一根细长的圆柱，用 uv 做「中间亮、两端淡出」的软光条，
 * additive 叠起来就是大屏里那种缓慢上升的碎光。
 */
export const SPARKLE_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const SPARKLE_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  float strength = 1.0 - abs(vUv.x - 0.5) * 2.0;
  strength = pow(strength, 2.0);

  float verticalFade = sin(vUv.y * 3.14159);
  verticalFade = pow(verticalFade, 0.5);

  float brightness = strength * verticalFade * (0.6 + 0.4);

  vec3 finalColor = uColor * brightness * 2.0;
  gl_FragColor = vec4(finalColor, brightness * uOpacity);
}
`;

export function createSparkleUniforms(opacity: number, color = 0x8fc2ff): Uniforms {
  return {
    uColor: { value: new Color(color) },
    uOpacity: { value: opacity },
  };
}
