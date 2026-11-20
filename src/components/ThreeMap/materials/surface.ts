import { Vector2, Vector3, type Texture } from 'three';

import { displayColor } from './color';
import { getDarkMap, getNormalMap } from './textures';

export const SURFACE_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
varying vec3 vTangent;
varying vec3 vBitangent;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  mat3 nm = mat3(modelMatrix);

  // 这里不要 normalize：入场动画会把整组 y 缩放从 0 拉到 1，
  // 那一刻 modelMatrix 的第三列是零向量，normalize(vec3(0.0)) 在 GPU 上返回 NaN，
  // 而 NaN 会顺着 varying 一路污染到片元（见片元里的 safeNormalize 说明）。
  // 原始向量照原样传下去，长度在片元里统一归一化。
  vWorldNormal = nm * normal;
  // UV 由 local (x, y) 按整图包围盒归一化而来：
  // 所以切线空间 U 轴就是 local +X，V 轴就是 local +Y，法线是 local +Z。
  vTangent = nm * vec3(1.0, 0.0, 0.0);
  vBitangent = nm * vec3(0.0, 1.0, 0.0);

  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const SURFACE_FRAGMENT = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
varying vec3 vTangent;
varying vec3 vBitangent;

uniform sampler2D mapTex;
uniform sampler2D normalTex;
uniform vec3 rimColor;
uniform vec3 sweepColor;
uniform vec3 reliefColor;
uniform vec3 edgeColor;
uniform vec3 glowColor;
uniform vec3 mapColor;
uniform vec3 baseColor;
uniform vec3 tintColor;
uniform float tintStrength;
uniform vec3 lightDir;
uniform vec2 center;
uniform float time;
uniform float gain;
uniform float darkGain;
uniform float reliefStrength;
uniform float specStrength;
uniform float specPower;
uniform float edgeStrength;
uniform float edgeWidth;
uniform float glowStrength;
uniform float glowWidth;
uniform float centerDark;
uniform float opacity;
// 悬浮/选中高亮：0 = 无，1 = 全量。颜色由 emphasis.topColor 给，
// 走 uniform 而不是改材质 color —— ShaderMaterial 没有 color 属性，
// 而且改 uniform 不重编译着色器，鼠标划过是零开销的。
uniform float highlight;
uniform vec3 highlightColor;
// ---- 可选组合开关（全部 0/1，用 mix 切换，不走 if 分支）----
// 走 mix 而不是 if：uniform 分支虽然每个 draw call 结果一致，
// 但片元里的 texture2D 落在非统一控制流里会被某些驱动警告，mipmap 也可能失效。
uniform float useMapTex;    // 1 = 用图片贴图
uniform float useMapColor;  // 1 = 用纯色贴图
uniform float useNormalMap; // 1 = 启用法线贴图浮雕
uniform float useDist;      // 1 = 启用贴图 alpha 里的「距边界距离」

// 安全归一化。GLSL 里 normalize(vec3(0.0)) 返回 NaN（0/0），
// 而 NaN 一旦写进 gl_FragColor，混合时 NaN*0 仍然是 NaN，
// 连 alpha = 0 都挡不住 —— 帧缓冲那块像素直接被污染成黑色。
// 入场动画的「厚度从 0 长起来」正好会把法线打成零向量：
// 镜面反射里那块地图就变成一大片死黑。
// 比较运算符遇到 NaN 恒为 false，所以能安全地走兜底分支。
vec3 safeNormalize(vec3 v, vec3 fallback) {
  float len2 = dot(v, v);
  return len2 > 1e-12 ? v * inversesqrt(len2) : fallback;
}

void main() {
  vec4 tex = texture2D(mapTex, vUv);

  // 挤出体的上盖和下盖共用 material-0。下盖这里直接丢掉：
  // 1) 它是深色的一张面，透过半透明上盖看是一团错位的深色，会显得脏
  // 2) 它在地面镜子里会映出一条贴着轮廓的深色锯齿带，就是边缘看着最脏的地方
  // 3) 丢掉之后从上盖往下看直接透到环境，通透感更好
  if (vWorldNormal.y < 0.0) discard;

  // 上盖：直接呈现贴图原貌（暗底 + 真实路网 + 贴图自带的边界发光）
  //
  // gain 就取 1.0 附近：贴图是「暗底路网 + 蓝白边界泛光」，乘大于 1 的 gain
  // 会把那圈泛光推到 225+ 变成死白，同时底色的蓝调也被一起冲淡。
  // 半透明混合本身会让颜色略暗一点（alpha 0.93 → 约衰减 7%）。
  //
  // 两种纹理来源按开关叠出来（互斥，由 JS 侧保证同一时刻有且仅有一个为 1）：
  //   baseColor → 兜底底色；mapTex → 图片贴图（可染色）；mapColor → 纯色贴图
  //
  // 图片模式下的染色：不是把整片涂成 tintColor（那会把路网和底图的明暗关系抹平，
  // 变成一块死板的色块），而是做「色度替换、亮度守恒」：
  //   先把 tint 按自身亮度归一化（tintColor / tintLum），再乘回当前像素的亮度。
  // 于是 tintStrength = 1 时整片变成 tint 的色相，而「哪条是路、哪里是底」的
  // 明暗层次完全保留 —— 这才是给贴图换色，不是覆盖。
  // min(..., 3.0) 是防呆：tint 选极暗的颜色（如 #0d2340，tintLum ≈ 0.03）时
  // 归一化系数会放大几十倍，个别通道可能冲出 1.0 造成溢色。
  vec3 img = tex.rgb;
  float imgLum = dot(img, vec3(0.2126, 0.7152, 0.0722));
  float tintLum = max(dot(tintColor, vec3(0.2126, 0.7152, 0.0722)), 1e-3);
  vec3 tinted = min(tintColor * (imgLum / tintLum), vec3(3.0));
  img = mix(img, tinted, tintStrength);

  vec3 col = baseColor;
  col = mix(col, img, useMapTex);
  col = mix(col, mapColor, useMapColor);
  col *= gain;

  // 暗部提亮：贴图的暗底在 3D 里会被雾和半透明混合吃掉一档，
  // 这里只拉 luma 0.45 以下的暗部，边界那圈泛光（0.8 以上）完全不动 ——
  // 既补回底色和路网的层次，又不会把边界推成死白。
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col *= mix(1.0 + darkGain, 1.0, smoothstep(0.06, 0.45, luma));

  // ---- 地形浮雕：法线贴图 → 切线空间法线 → 世界空间法线 ----
  // 地图绕 X 轴转了 -90°，local +Y 对应世界 -Z，所以兜底方向按这个来。
  vec3 Ng = safeNormalize(vWorldNormal, vec3(0.0, 1.0, 0.0));
  vec3 T = safeNormalize(vTangent, vec3(1.0, 0.0, 0.0));
  vec3 B = safeNormalize(vBitangent, vec3(0.0, 0.0, -1.0));

  // 关掉法线贴图时退回「平面法线」(0,0,1)：N 就等于几何法线 Ng，
  // 下面 slope 也会变成 0，于是浮雕起伏和高光同时归零，不需要额外分支。
  vec3 nTex = texture2D(normalTex, vUv).rgb * 2.0 - 1.0;
  nTex = mix(vec3(0.0, 0.0, 1.0), nTex, useNormalMap);
  vec3 N = safeNormalize(T * nTex.x + B * nTex.y + Ng * nTex.z, Ng);

  vec3 L = normalize(lightDir);
  vec3 V = normalize(vViewDir);
  float flatNdl = max(dot(Ng, L), 0.08);   // 平地受光量，做归一化基准
  float ndl = max(dot(N, L), 0.0);
  float slope = length(nTex.xy);           // 0 = 平地，越大坡越陡

  // 起伏对比：迎光面提亮、背光面压暗；乘除归一化让「平地」正好等于原色，
  // 这样路网底图的明度不会被整体拉偏。
  float shade = clamp(ndl / flatNdl, 0.0, 2.2);
  col *= mix(1.0, shade, reliefStrength);

  // 迎光的山脊再补一点冷白，浮雕才有「被光扫到」的立体感
  col += reliefColor * max(ndl - flatNdl, 0.0) * reliefStrength * 0.26;

  // 极淡的斜向流光，保留呼吸感
  float progress = fract(time * 0.2);
  float d = vUv.x * 0.55 + vUv.y * 0.45;
  float band = 1.0 - smoothstep(0.0, 0.35, abs(d - progress));
  col += sweepColor * pow(band, 2.0) * 0.035;

  // 高光只落在起伏处：平地不反光，山脊才闪一下
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), specPower) * specStrength;
  col += vec3(0.72, 0.88, 1.0) * spec * smoothstep(0.02, 0.30, slope) * 0.55;

  // 掠射角补一点冷光，压住平涂感
  float fresnel = pow(1.0 - abs(dot(Ng, V)), 3.0);
  col += rimColor * fresnel * 0.07;

  // ---- 轮廓亮边：分两层 ----
  // 贴图 alpha 存的是「归一化距边界距离」(0=边界, 1=内部)，可以直接反推距离：
  //   ① 紧贴轮廓的一条亮线，负责勾出外形（宽度只有几个像素）
  //   ② 一条宽得多的柔光带，从边界向内线性淡出
  // 合成一条 smoothstep 做不出这个形状：收窄了只剩硬线，放宽了整片糊成一块，
  // 所以这里必须拆开分别给强度和宽度。
  // 关掉轮廓光时喂 1.0（等于「远离边界」），两层光带自然归零。
  float dist = mix(1.0, tex.a, useDist);
  float tight = 1.0 - smoothstep(0.0, edgeWidth, dist);
  float wide = 1.0 - smoothstep(0.0, glowWidth, dist);

  // ① 外缘亮线：偏白，但不过曝 —— 贴图边界本身就 (103,253,255)，
  //    再叠纯白会烧成死白块，是「脏」的第一观感。
  col += edgeColor * pow(tight, 1.2) * edgeStrength;

  // ② 宽内发光：偏蓝、强度低于亮线，靠宽度和面积撑出体积感。
  col += glowColor * pow(wide, 1.0) * glowStrength;

  // ---- 中心压暗 ----
  // 要压的是「地图中间」，所以暗化强度用 (1 - 径向距离)：中心最重、向外递减到 0。
  // 过渡区间拉到 1.25（比地图半径还大），衰减慢于地图尺寸，
  // 这样暗化是整片的柔和渐变，而不是中心糊一块边界可辨的圆形暗斑。
  // 乘 (1 - wide) 是为了不压到边界那片发光，否则压暗会把描边和光带一起吃掉。
  float radial = length((vUv - center) * vec2(1.0, 0.86)) * 2.0;
  float cDark = (1.0 - smoothstep(0.0, 1.25, radial)) * (1.0 - wide);
  col *= mix(1.0, 1.0 - centerDark, cDark);

  // ---- 悬浮/选中高亮 ----
  // 主要反馈是几何抬升（cell.scale.z 1 → 1.5），颜色只做辅助。
  // 这里刻意不用 mix(col, highlightColor, ...)：那等于用一块纯色覆盖过去，
  // 路网、浮雕、轮廓光全被抹平，区县变成一块发光的色板（试过 0.34 权重依然过曝）。
  // 改成「整体提亮 + 叠一点高亮色泛光」：贴图的明暗层次完整保留，
  // 观感是这块区域被灯照亮了，而不是被换了皮。
  float hl = clamp(highlight, 0.0, 1.0);
  col *= mix(1.0, 1.8, hl);
  col += highlightColor * hl * 0.055;

  // 边界那条亮带顺手把不透明度抬一点：半透明混合会把加进来的光再冲淡一次，
  // 不抬 alpha 的话加多少亮都不够「实」。宽光带也一起抬，光晕才有体积。
  float alpha = opacity * mix(0.93, 0.99, max(pow(tight, 1.2) * 0.7, wide * 0.5));

  gl_FragColor = vec4(col, alpha);
}
`;

/** 顶面渲染配置：纹理来源 × 法线 两个维度自由交叉 */
export interface SurfaceOptions {
  /** 'image' 图片贴图 | 'color' 纯色贴图（二选一，必居其一） */
  mapMode: 'image' | 'color';
  /** 纯色模式的铺色 */
  mapColor: string;
  /** 图片模式的染色色相，白色 = 不改色 */
  tintColor: string;
  /** 染色强度 0~1（0 = 原图色相，1 = 完全换成 tintColor 的色相） */
  tintStrength: number;
  /** 是否启用法线贴图浮雕 */
  normalMap: boolean;
  /** 是否启用轮廓光带（取自贴图 alpha 的距离场） */
  edgeGlow: boolean;
  /** 浮雕强度（0 = 平的，1 以上更夸张） */
  reliefStrength: number;
  /** 轮廓光整体倍率（0 = 全关，2 = 加倍） */
  glowLevel: number;
  /** 中心压暗强度 0~1 */
  centerDark: number;
  /** 自定义贴图，传 null 用内置暗底路网贴图 */
  mapTex: Texture | null;
}

const DEFAULT_SURFACE_OPTIONS: SurfaceOptions = {
  mapMode: 'image',
  mapColor: '#0d2340',
  tintColor: '#ffffff',
  tintStrength: 0,
  normalMap: true,
  edgeGlow: true,
  reliefStrength: 0.45,
  glowLevel: 1,
  centerDark: 0.34,
  mapTex: null,
};

// 轮廓光两层的基准强度，glowLevel 在这上面做整体倍率
const BASE_EDGE_STRENGTH = 0.62;
const BASE_GLOW_STRENGTH = 0.3;

export type Uniforms = Record<string, { value: any }>;

/**
 * 把配置折算成着色器里的 0/1 开关。
 *
 * 纹理只有「图片」和「纯色」两种来源，且二者**互斥且完备**：
 * useMapColor 直接取 `1 - useMapTex`，永远保证有且只有一个生效，
 * 不存在「两个都不开」的悬空状态。
 */
function resolveSurfaceFlags(options: Partial<SurfaceOptions> = {}) {
  const cfg = { ...DEFAULT_SURFACE_OPTIONS, ...options };
  const glowLevel = Math.max(0, cfg.glowLevel);
  const useMapTex = cfg.mapMode === 'image' ? 1 : 0;
  return {
    useMapTex,
    useMapColor: 1 - useMapTex,
    useNormalMap: cfg.normalMap ? 1 : 0,
    useDist: cfg.edgeGlow && glowLevel > 0 ? 1 : 0,
    mapColor: displayColor(cfg.mapColor),
    baseColor: displayColor(cfg.mapColor),
    tintColor: displayColor(cfg.tintColor),
    tintStrength: Math.min(1, Math.max(0, cfg.tintStrength)),
    mapTex: cfg.mapTex ?? getDarkMap(),
    reliefStrength: Math.max(0, cfg.reliefStrength),
    centerDark: Math.min(1, Math.max(0, cfg.centerDark)),
    edgeStrength: BASE_EDGE_STRENGTH * glowLevel,
    glowStrength: BASE_GLOW_STRENGTH * glowLevel,
  };
}

/**
 * 运行时切换纹理 / 法线贴图的组合。
 * 直接改 uniforms 的 value，不重建材质，所以不会触发着色器重编译。
 */
export function applySurfaceOptions(uniforms: Uniforms | undefined, options: Partial<SurfaceOptions> = {}): void {
  if (!uniforms) return;
  const flags = resolveSurfaceFlags(options);
  uniforms.useMapTex!.value = flags.useMapTex;
  uniforms.useMapColor!.value = flags.useMapColor;
  uniforms.useNormalMap!.value = flags.useNormalMap;
  uniforms.useDist!.value = flags.useDist;
  (uniforms.mapColor!.value as any).copy(flags.mapColor);
  (uniforms.baseColor!.value as any).copy(flags.baseColor);
  (uniforms.tintColor!.value as any).copy(flags.tintColor);
  uniforms.tintStrength!.value = flags.tintStrength;
  uniforms.mapTex!.value = flags.mapTex;
  uniforms.reliefStrength!.value = flags.reliefStrength;
  uniforms.centerDark!.value = flags.centerDark;
  uniforms.edgeStrength!.value = flags.edgeStrength;
  uniforms.glowStrength!.value = flags.glowStrength;
}

export function createSurfaceUniforms(options: Partial<SurfaceOptions> = {}): Uniforms {
  const flags = resolveSurfaceFlags(options);

  return {
    mapTex: { value: flags.mapTex },
    normalTex: { value: getNormalMap() },
    useMapTex: { value: flags.useMapTex },
    useMapColor: { value: flags.useMapColor },
    useNormalMap: { value: flags.useNormalMap },
    useDist: { value: flags.useDist },
    mapColor: { value: flags.mapColor },
    baseColor: { value: flags.baseColor },
    tintColor: { value: flags.tintColor },
    tintStrength: { value: flags.tintStrength },
    rimColor: { value: displayColor('#7cc8ff') },
    sweepColor: { value: displayColor('#5f9fe8') },
    reliefColor: { value: displayColor('#9ed2ff') },
    edgeColor: { value: displayColor('#cfeaff') },
    glowColor: { value: displayColor('#3d8de0') },
    // 光从「上方偏北」打来，与 demo 里那盏 DirectionalLight 同向
    lightDir: { value: new Vector3(0.0, 0.707, -0.707) },
    // 中心压暗的椭圆中心，贴图中心就是地图 bbox 中心
    center: { value: new Vector2(0.5, 0.5) },
    time: { value: 0 },
    gain: { value: 1.0 },
    darkGain: { value: 0.0 },
    reliefStrength: { value: flags.reliefStrength },
    specStrength: { value: 0.18 },
    specPower: { value: 26.0 },
    // 贴图 alpha 的归一化尺度是短边 7.5%（约 74px），所以 0.07 ≈ 5px
    edgeStrength: { value: flags.edgeStrength },
    edgeWidth: { value: 0.07 },
    glowStrength: { value: flags.glowStrength },
    glowWidth: { value: 0.85 },
    centerDark: { value: flags.centerDark },
    opacity: { value: 0 },
    // 悬浮高亮：默认 0（无），由 districtRender 按鼠标拾取结果推
    highlight: { value: 0 },
    highlightColor: { value: displayColor('#73f8ff') },
  };
}
