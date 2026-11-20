import { BufferGeometry, Curve, Float32BufferAttribute, Vector3 } from 'three';

import { displayColor } from './color';
import type { Uniforms } from './surface';

/**
 * 飞线光带材质。
 *
 * 为什么不用圆管（TubeGeometry）：管是有厚度的实体，截面 `sin(π·vUv.y)`
 * 会让管子的两侧各亮一条、正面反而暗，additive 叠起来就是一根「塑料白管」。
 * 而且管径随距离不变，远处细成一条、近处粗成一坨。
 *
 * 这里改成「始终正对相机的平面光带」（billboard ribbon）：
 * - 顶点着色器把每个顶点沿 cross(切线, 视线) 方向推开 → 条带永远垂直于视线，
 *   所以不管相机怎么转，看到的都是一条等宽的细光带，没有体积感
 * - 片元截面 = 细亮芯 + 柔和外晕；沿弧长 = 短彗尾 + 头部亮点
 */
export const FLYLINE_VERTEX = /* glsl */ `
attribute vec3 aTangent;
attribute float aSide;
attribute float aPhase;

uniform float width;
uniform float uRefDistance;

varying vec2 vUv;
varying float vPhase;

void main() {
  vUv = uv;
  vPhase = aPhase;

  mat3 m3 = mat3(modelMatrix);
  vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;

  // 所有 normalize 都先判零向量：入场动画把整组的 y 缩放从 0 拉起，
  // 那一刻 modelMatrix 是奇异的，normalize(0) 会产出 NaN 并污染整块画面。
  vec3 T = m3 * aTangent;
  float t2 = dot(T, T);
  T = t2 > 1e-10 ? T * inversesqrt(t2) : vec3(1.0, 0.0, 0.0);

  vec3 V = cameraPosition - wp;
  float v2 = dot(V, V);
  V = v2 > 1e-10 ? V * inversesqrt(v2) : vec3(0.0, 0.0, 1.0);

  // 光带的宽度方向 = 切线 × 视线，于是条带面永远正对相机
  vec3 S = cross(T, V);
  float s2 = dot(S, S);
  if (s2 < 1e-10) {
    // 视线和切线几乎平行（弧线正对着相机飞来），退化成用世界 Z 取垂直方向
    S = cross(T, vec3(0.0, 0.0, 1.0));
    s2 = dot(S, S);
    S = s2 > 1e-10 ? S * inversesqrt(s2) : vec3(1.0, 0.0, 0.0);
  } else {
    S *= inversesqrt(s2);
  }

  // 距离补偿：远处不缩成一条线，近处也不至于过粗。
  // 14.0 是 demo 里的世界尺度基准，换算成「地图宽度的 0.99 倍」，见 createFlyLineUniforms。
  float w = width * clamp(sqrt(v2) / uRefDistance, 0.65, 1.7);
  wp += S * aSide * w;

  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}
`;

export const FLYLINE_FRAGMENT = /* glsl */ `
varying vec2 vUv;
varying float vPhase;

uniform vec3 color;
uniform vec3 headColor;
uniform float time;
uniform float opacity;
uniform float flowSpeed;

void main() {
  // ---- 截面：0 在光带中心，1 在外沿 ----
  float t = abs(vUv.y * 2.0 - 1.0);
  float core = pow(1.0 - t, 5.0) * 1.75;   // 中间一条锐亮的芯，勾出光带走向
  float glow = pow(1.0 - t, 1.4) * 0.30;   // 外圈柔和光晕，负责「光」而不「线」的感觉
  float section = core + glow;

  // ---- 沿弧长：彗尾 + 头部亮点 ----
  // vPhase 让各条弧线的流动错开，否则它们会同时亮、同时暗，像在打拍子
  float flow = fract(vUv.x - time * flowSpeed + vPhase);
  float comet = pow(1.0 - flow, 3.0);
  float head = pow(1.0 - flow, 40.0);

  // 底光负责「整条弧线始终可见」，彗尾负责流动感。
  float bright = 0.38 + 0.62 * comet;

  // 两端收口：多条弧线共用同一个起点，不收口会在中心叠出死白光斑
  float ends = smoothstep(0.0, 0.18, vUv.x) * (1.0 - smoothstep(0.88, 1.0, vUv.x));

  float a = opacity * section * bright * ends;
  if (a < 0.003) discard;

  vec3 col = mix(color, headColor, clamp(comet * 0.85 + head * 0.9, 0.0, 1.0));
  col += headColor * head * 0.45;

  gl_FragColor = vec4(col, a);
}
`;

/**
 * 正弦拱形弧线：两端精确落在顶面，中段按 sin(πt) 平滑抛起。
 *
 * 不用二次贝塞尔的原因：控制点抬高 h 时，曲线实际最高点只有 0.5h，
 * 想让弧顶到 1.0 就得把控制点抬到 2.0，而且弧顶附近会有一段明显发平，
 * 几个不同高度的弧叠在一起看着就是「一排平行的白管子」。
 */
export class SinArcCurve extends Curve<Vector3> {
  start: Vector3;
  end: Vector3;
  height: number;

  constructor(start: Vector3, end: Vector3, height: number) {
    super();
    this.start = start;
    this.end = end;
    this.height = height;
  }

  getPoint(t: number, target = new Vector3()): Vector3 {
    target.lerpVectors(this.start, this.end, t);
    target.y += Math.sin(Math.PI * t) * this.height;
    return target;
  }
}

export interface FlyLineOptions {
  /** 光带主色 */
  color: string;
  /** 彗尾/头部亮点颜色 */
  headColor: string;
  /** 光带半宽（世界单位） */
  width: number;
  /** 流动速度 */
  flowSpeed: number;
}

export function createFlyLineUniforms(options: Partial<FlyLineOptions> = {}, refDistance = 14): Uniforms {
  return {
    color: { value: displayColor(options.color ?? '#5ea8f0') },
    headColor: { value: displayColor(options.headColor ?? '#e6f6ff') },
    time: { value: 0 },
    opacity: { value: 0 },
    flowSpeed: { value: options.flowSpeed ?? 0.3 },
    width: { value: options.width ?? 0.085 },
    uRefDistance: { value: refDistance },
  };
}

/**
 * 把若干条曲线合并成一张「光带」几何。
 *
 * 每条曲线沿弧长采样 segments 段，每段两个顶点（左右各一），
 * 顶点上带 aTangent（切线）和 aSide（-1 / +1，决定往哪一侧推开）。
 * uv.x = 沿弧长 0..1，uv.y = 0 / 1（横跨光带），
 * aPhase = 该条弧线的流动相位偏移（让各条弧错开，不要一起闪）。
 */
export function buildFlyLineGeometry(curves: Curve<Vector3>[], segments = 72): BufferGeometry {
  const position: number[] = [];
  const tangent: number[] = [];
  const side: number[] = [];
  const phase: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];

  let base = 0;

  curves.forEach((curve, curveIndex) => {
    // 均匀错开相位；用 0.618 的黄金比打散，比 1/n 更不容易看出规律
    const phaseOffset = (curveIndex * 0.618) % 1;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = curve.getPoint(t);
      const tan = curve.getTangent(t);

      for (const s of [-1, 1]) {
        position.push(p.x, p.y, p.z);
        tangent.push(tan.x, tan.y, tan.z);
        side.push(s);
        phase.push(phaseOffset);
        uv.push(t, s > 0 ? 1 : 0);
      }
    }

    for (let i = 0; i < segments; i++) {
      const a = base + i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      index.push(a, b, c, b, d, c);
    }

    base += (segments + 1) * 2;
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3));
  geometry.setAttribute('aTangent', new Float32BufferAttribute(tangent, 3));
  geometry.setAttribute('aSide', new Float32BufferAttribute(side, 1));
  geometry.setAttribute('aPhase', new Float32BufferAttribute(phase, 1));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);

  return geometry;
}
