import { displayColor } from './color';
import type { Uniforms } from './surface';

export const SHIFT_VERTEX = /* glsl */ `
varying vec3 vPosition;

void main() {
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const SHIFT_FRAGMENT = /* glsl */ `
varying vec3 vPosition;
uniform float time;
uniform float depth;
uniform vec3 baseTopColor;
uniform vec3 baseBottomColor;
uniform vec3 stripeColor;
uniform vec3 sideTintColor;
uniform float sideTintStrength;
uniform float stripeScale;
uniform float stripeStrength;
// 入场淡入进度（由 ThreeMap 的入场动画驱动）
uniform float opacity;
// 侧面的不透明度：1 = 整面实心（不透出背后的墙），越小越透，且越靠下先透
uniform float sideOpacity;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  float h = clamp(vPosition.z / depth, 0.0, 1.0);

  // 竖直水晶条纹：沿水平位置分柱，每根柱子亮度不同，高度方向几乎不变
  vec2 sp = vPosition.xy * stripeScale;
  float col1 = hash21(floor(sp));
  float col2 = hash21(floor(sp * 2.7 + 5.3));
  float col3 = hash21(floor(sp * 6.1 + 11.7));
  float stripe = 0.80 + col1 * 0.30 + col2 * 0.14 + col3 * 0.06;

  // 底部深蓝 → 顶部亮青的渐变，亮部集中在靠上的一小段
  vec3 color = mix(baseBottomColor, baseTopColor, pow(h, 1.8));

  // 条纹越靠上越明显（靠顶部的冰柱最亮）
  color *= mix(1.0, stripe, mix(0.5, 1.0, h) * stripeStrength);

  // 顶沿一线更亮，勾出顶面与侧面的交界
  color = mix(color, stripeColor, smoothstep(0.88, 1.0, h) * 0.34);

  // 底沿略微压低，让整块地图有落地的重量感
  color *= mix(0.72, 1.0, smoothstep(0.0, 0.3, h));

  // 极缓慢的整体明暗呼吸，避免侧面看起来是静止的死图
  float breathe = 0.94 + 0.06 * sin(time * 1.2 + vPosition.x * 0.8);
  color *= breathe;

  // ---- 侧面染色（与顶面同一套「色度替换、亮度守恒」）----
  // 放在所有颜色合成**之后**统一做，而不是只染 baseTopColor：
  // 侧面有三层颜色（底部深蓝 / 主体渐变 / 顶沿亮线 / 条纹），
  // 只染其中一层会让顶沿留一条蓝白线、侧面变紫后显脏。
  // 亮度由渐变自己提供，这里只替换色相，水晶质感不受影响。
  float sideLum = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float tintLum = max(dot(sideTintColor, vec3(0.2126, 0.7152, 0.0722)), 1e-3);
  vec3 sideTinted = min(sideTintColor * (sideLum / tintLum), vec3(3.0));
  color = mix(color, sideTinted, sideTintStrength);

  // 侧面透明度分两件事：
  // 1) sideOpacity = 1：整面 alpha 恒为 1，非镜面部分完全不透视，背后那面墙被正常遮挡；
  // 2) sideOpacity < 1：按竖向渐变淡出——底部比顶部先透，保留悬浮玻璃的观感。
  // 入场淡入（opacity）在它之上再乘一层，两者互不影响。
  float alpha = opacity * sideOpacity * mix(1.0, pow(h, 1.15), 1.0 - sideOpacity);

  gl_FragColor = vec4(color, alpha);
}
`;

/** 侧面（挤出体立面）配色，与顶面的纹理/法线组合完全独立 */
export interface SideOptions {
  /** 底部深蓝 */
  bottomColor: string;
  /** 顶部亮青 */
  topColor: string;
  /** 顶沿亮线 / 水晶条纹色 */
  stripeColor: string;
  /** 条纹密度 */
  stripeScale: number;
  /** 条纹强度 */
  stripeStrength: number;
  /** 染色色相，白色 = 保持原本的冰蓝 */
  tintColor: string;
  /** 染色强度 0~1 */
  tintStrength: number;
  /** 侧面不透明度：1 = 完全实心，越小越透（底部比顶部先透） */
  opacity: number;
}

const DEFAULT_SIDE_OPTIONS: SideOptions = {
  bottomColor: '#0a2952',
  topColor: '#6fb0d8',
  stripeColor: '#d8f0ff',
  stripeScale: 3.2,
  stripeStrength: 0.82,
  tintColor: '#ffffff',
  tintStrength: 0,
  opacity: 1,
};

export function createShiftUniforms(depth: number, options: Partial<SideOptions> = {}): Uniforms {
  const uniforms: Uniforms = {
    time: { value: 0 },
    depth: { value: depth },
    // 着色器输出不做色彩空间转换，用 displayColor 保证屏幕上的颜色等于设计色值
    baseBottomColor: { value: displayColor('#0a2952') },
    baseTopColor: { value: displayColor('#6fb0d8') },
    stripeColor: { value: displayColor('#d8f0ff') },
    sideTintColor: { value: displayColor('#ffffff') },
    sideTintStrength: { value: 0 },
    stripeScale: { value: 3.2 },
    stripeStrength: { value: 0.82 },
    opacity: { value: 0 },
    sideOpacity: { value: 1 },
  };
  applyShiftOptions(uniforms, options);
  return uniforms;
}

export function applyShiftOptions(uniforms: Uniforms | undefined, options: Partial<SideOptions> = {}): void {
  if (!uniforms) return;
  const cfg = { ...DEFAULT_SIDE_OPTIONS, ...options };
  (uniforms.baseBottomColor!.value as any).copy(displayColor(cfg.bottomColor));
  (uniforms.baseTopColor!.value as any).copy(displayColor(cfg.topColor));
  (uniforms.stripeColor!.value as any).copy(displayColor(cfg.stripeColor));
  uniforms.stripeScale!.value = cfg.stripeScale;
  uniforms.stripeStrength!.value = cfg.stripeStrength;
  (uniforms.sideTintColor!.value as any).copy(displayColor(cfg.tintColor));
  uniforms.sideTintStrength!.value = Math.min(1, Math.max(0, cfg.tintStrength));
  // 侧面不透明度：1 = 实心，0 = 完全消失，中间按竖向渐变透
  uniforms.sideOpacity!.value = Math.min(1, Math.max(0, cfg.opacity));
}
