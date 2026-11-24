import * as THREE from 'three';

import ringUrl from '@/assets/mapTex/quan1.png';
import haloUrl from '@/assets/mapTex/guangquan01.png';
import { displayColor } from '../materials/color';
import { SPARKLE_FRAGMENT, SPARKLE_VERTEX, createSparkleUniforms } from '../materials/sparkle';
import { buildRibbonGeometry } from '../materials/trail';
import type { GeoJsonFeatureCollection, ThreeMapContext } from '../types';

const ringTexture = new THREE.TextureLoader().load(ringUrl);
const haloTexture = new THREE.TextureLoader().load(haloUrl);

export interface SceneLayer {
  object: THREE.Object3D;
  update: (delta: number) => void;
  dispose: () => void;
  /** 可选：运行时改尾长（入场时压短，只剩一段光在描轮廓） */
  setTrailLength?: (value: number) => void;
}

/**
 * 地面光圈：一张大贴图贴在地图下方，缓慢自转。
 * 它是「悬浮在星空里」的视觉基底，也是镜面反射之外唯一的地面装饰。
 *
 * @param scale 圆环自己的缩放倍率（独立于地图尺寸）：1 就是 demo 的 1.066 倍地图宽，
 *              调大后光圈会撑到地图之外，当纯粹的背景装饰用
 */
export function drawGroundRing(mapWidth: number, scale = 1): SceneLayer {
  const size = mapWidth * 1.066 * Math.max(0.1, scale); // demo: 16 / 15（地图世界宽）
  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    map: ringTexture,
    color: new THREE.Color('#8fc2ff'),
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -mapWidth * 0.000667; // demo: -0.01 / 15

  return {
    object: mesh,
    update: (delta: number) => {
      mesh.rotation.z += delta / 5;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}

/**
 * 在多边形内部随机取一点（xz 平面，世界坐标）。
 *
 * 用「奇偶规则」把外环和洞一起算：穿越次数为奇即在内部。
 * 一次拒绝采样最多试 80 轮，实在取不到（多边形退化）就返回 null 交给调用方兜底。
 */
function sampleInRings(rings: [number, number][][]): { x: number; z: number } | null {
  if (!rings.length) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  rings.forEach((ring) =>
    ring.forEach(([x, z]) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }),
  );
  if (!Number.isFinite(minX) || maxX <= minX || maxZ <= minZ) return null;

  const inside = (x: number, z: number): boolean => {
    let hit = false;
    for (const ring of rings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, zi] = ring[i]!;
        const [xj, zj] = ring[j]!;
        if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit;
      }
    }
    return hit;
  };

  for (let i = 0; i < 80; i++) {
    const x = minX + Math.random() * (maxX - minX);
    const z = minZ + Math.random() * (maxZ - minZ);
    if (inside(x, z)) return { x, z };
  }
  return null;
}

/**
 * 漂浮光柱：一堆细光条缓缓上升，到顶后回到下方重新开始。
 * 大屏里那种「空气里的碎光」，很淡但让画面不死。
 *
 * region 传城市轮廓（世界坐标的 xz 环列表）时，光条只撒在轮廓以内；
 * topY 传地图顶面高度，光条就只在顶面上方那层薄空气里飘。
 *
 * demo 是撒在 mapWidth × 1.33 的方框里（比地图本身还大一圈），并且从地面
 * 一路升到 0.66~2 倍地图宽的高空 —— 那个高度早就飞出取景之外了。结果是
 * 屏幕上看到一堆又长又直的青色光带横穿空白背景、和地图完全脱节，很容易
 * 被误认成「没贴边的边缘流光」。所以这里把落点和高度都收进城市范围内。
 */
export function drawBeams(
  mapWidth: number,
  options: { region?: [number, number][][]; topY?: number } = {},
): SceneLayer {
  const { region, topY } = options;
  const group = new THREE.Group();
  const range = mapWidth * 1.33; // demo: 20 / 15
  const unit = mapWidth / 15; // demo 的世界尺度换算
  const geometry = new THREE.CylinderGeometry(0.03 * unit, 0.03 * unit, 1, 6, 1, true);
  const materials: THREE.ShaderMaterial[] = [];
  const beams: { mesh: THREE.Mesh; speed: number; resetHeight: number }[] = [];

  // 撒点：优先落在城市轮廓内；取不到（没传 region / 多边形退化）才退回原来的方框
  const spread = (): { x: number; z: number } =>
    (region ? sampleInRings(region) : null) ?? {
      x: (Math.random() - 0.5) * range,
      z: (Math.random() - 0.5) * range,
    };

  // 活动高度带：贴着地图顶面往上一小段。
  // 太矮会被顶面挡掉（additive + depthTest），太高又会飘回空白背景里。
  const baseY = (topY ?? mapWidth * 0.072) + mapWidth * 0.004;
  const bandHeight = unit * 1.8;
  const beamLength = (): number => 0.9 + Math.random() * 1.3;

  for (let i = 0; i < 20; i++) {
    const material = new THREE.ShaderMaterial({
      uniforms: createSparkleUniforms(0.5 + Math.random() * 0.2),
      vertexShader: SPARKLE_VERTEX,
      fragmentShader: SPARKLE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geometry, material);
    const start = spread();
    mesh.position.set(start.x, baseY + Math.random() * bandHeight, start.z);
    mesh.scale.set(1, beamLength(), 1);
    mesh.raycast = () => {};
    materials.push(material);
    beams.push({
      mesh,
      speed: 0.4 + Math.random() * 0.4,
      resetHeight: baseY + bandHeight,
    });
    group.add(mesh);
  }

  return {
    object: group,
    update: (delta: number) => {
      beams.forEach((beam) => {
        beam.mesh.position.y += beam.speed * delta * unit;
        if (beam.mesh.position.y > beam.resetHeight) {
          const next = spread();
          beam.mesh.position.x = next.x;
          beam.mesh.position.z = next.z;
          beam.mesh.position.y = baseY + Math.random() * bandHeight * 0.15;
          beam.mesh.scale.y = beamLength();
        }
      });
    },
    dispose: () => {
      geometry.dispose();
      materials.forEach((m) => m.dispose());
    },
  };
}

/**
 * 区域标点：每个区县中心一根上下浮动的小光柱 + 一个旋转的光环。
 * 入场动画结束后才出现（和 demo 一致，避免和地图生长过程打架）。
 */
export function drawCones(centers: THREE.Vector3[], topY: number, mapWidth: number): SceneLayer {
  const group = new THREE.Group();
  // demo 的标点写在「局部单位」里（外层还有 0.5 缩放），所以基准是 30.018 而不是 15
  const unit = mapWidth / 30.018;
  const coneGeometry = new THREE.ConeGeometry(0.3 * unit, 0.5 * unit, 4);
  const coneMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0x2f7fd8),
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });
  const haloGeometry = new THREE.PlaneGeometry(0.8 * unit, 0.8 * unit);
  const haloMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    color: new THREE.Color(0x2f7fd8),
    alphaMap: haloTexture,
    opacity: 1,
    depthTest: false,
    fog: false,
    blending: THREE.AdditiveBlending,
  });

  const cones: THREE.Mesh[] = [];
  const halos: THREE.Mesh[] = [];
  const dirs: number[] = [];

  centers.forEach((center) => {
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(center.x, topY + 0.01 * unit, center.z);
    // demo 里锥体经两次 -90° 旋转后指向世界 -Y（锥尖朝下，像一滴垂下的光）
    cone.rotation.x = Math.PI;
    cone.raycast = () => {};
    group.add(cone);
    cones.push(cone);
    dirs.push(1);

    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.position.set(center.x, topY + 0.01 * unit, center.z);
    halo.rotation.x = -Math.PI / 2;
    halo.raycast = () => {};
    group.add(halo);
    halos.push(halo);
  });

  group.visible = false;

  return {
    object: group,
    update: (delta: number) => {
      cones.forEach((cone, i) => {
        const base = topY + 0.01 * unit;
        if (cone.position.y >= base + 1 * unit) dirs[i] = -1;
        if (cone.position.y <= base) dirs[i] = 1;
        cone.rotation.y += delta;
        cone.position.y += (dirs[i]! * delta * unit) / 2;
      });
      halos.forEach((halo) => {
        halo.rotation.z += delta + 0.02;
      });
    },
    dispose: () => {
      coneGeometry.dispose();
      coneMaterial.dispose();
      haloGeometry.dispose();
      haloMaterial.dispose();
    },
  };
}

/**
 * 边缘流光：沿城市外轮廓循环跑的一段亮光。
 *
 * 参数（速度 / 尾长 / 亮度）全部可从面板调 —— 默认值照 demo，
 * 但跑光本身只有 1~2px 宽，不同地图、不同机位下观感差别不小，
 * 交给使用者自己拧比硬编码一个「刚好」的值更实在。
 */
export function drawTrail(
  context: ThreeMapContext,
  boundary: GeoJsonFeatureCollection,
  topY: number,
  mapWidth: number,
  options: { speed?: number; length?: number; brightness?: number } = {},
): SceneLayer | null {
  const projection = context.projection;
  const feature = boundary.features[0];
  if (!feature) return null;

  let coordinates: any = feature.geometry.coordinates;
  if (feature.geometry.type === 'Polygon') coordinates = [coordinates];

  // 取最长的一圈（主体轮廓），短碎环跑光会显得乱
  let best: number[][] = [];
  coordinates.forEach((multiPolygon: any) => {
    multiPolygon.forEach((ring: number[][]) => {
      if (ring.length > best.length) best = ring;
    });
  });
  if (best.length < 3) return null;

  const points: THREE.Vector3[] = [];
  best.forEach((coord) => {
    const [x, y] = projection(coord as [number, number]);
    if (!x || !y) return;
    // z 用 +y：和区县填充、轮廓描线、区县标点是同一套约定。
    // 这里曾经写成 -y，结果整条流光变成「地图轮廓按 z 轴镜像」——
    // 它跑在一条不存在的镜像路径上，看着就是地图实体外面飘着一条
    // 和边缘形状相似、但整体错开的亮线（用户反馈的「没紧贴地图边缘」）。
    points.push(new THREE.Vector3(x, topY, y));
  });
  // 闭合
  if (points.length && points[0]!.distanceTo(points[points.length - 1]!) > 1e-6) {
    points.push(points[0]!.clone());
  }
  if (points.length < 3) return null;

  const speedSeconds = Math.max(1, options.speed ?? 10);
  const tail = Math.min(1, Math.max(0.03, options.length ?? 0.3));
  const brightness = Math.max(0.05, options.brightness ?? 1);

  const geometry = buildRibbonGeometry(points, 2);
  const uniforms = {
    // demo 的 GeoTrail 用的是 `new Color(2, 10, 10)` —— 通道值远超 1 的 HDR 色。
    // demo 那道光只有 1~2px 宽，整条过曝成一根细白线才好看；这里的带宽有几像素，
    // 若按原亮度整条都会是实心白带（看着像被人擦掉一段），所以压到 0.16 倍：
    // 中心仍然过曝成白，两侧由 section 衰减回轮廓的青色，才像「一道光扫过」。
    color: { value: new THREE.Color(2, 10, 10).multiplyScalar(0.16 * brightness) },
    time: { value: 0 },
    // 这道光是唯一不参与入场淡入的图层：demo 的进场就是让它在空场景上先沿着
    // 外轮廓跑，跑了 2.5s 地图才长出来（GeoTrail 的 mesh 挂在 scene 上，不在淡入名单里）。
    // 所以它的 opacity 一直是满的，见下面 material.userData.skipIntroFade。
    opacity: { value: 1 },
    speed: { value: 1 / speedSeconds }, // 越小越慢（speed × 秒数 = 1 圈）
    trailLength: { value: tail },
    // 宽度按地图宽占比（ribbon 左右各一份，屏幕上总宽 ≈ 2×该值×视距补偿）。
    // demo 是 0.1/30 ≈ 0.0033（屏幕 1~2px，几乎看不见）；放到 0.0042 约 5px，
    // 看得清又不至于一半宽度甩到轮廓外的暗背景上（那样会显得「没沿边缘」）。
    width: { value: mapWidth * 0.0042 },
    uRefDistance: { value: context.refDistance ?? mapWidth * 1.08 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: RIBBON_VERTEX,
    fragmentShader: RIBBON_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 10;
  mesh.raycast = () => {};
  // 第 1 层：主相机可见，镜面倒影用的虚拟相机不可见。
  // 地图是悬浮在镜面上方的，这道光只有几个像素宽又很亮，倒影会跑到轮廓之外的
  // 空白处，看着就像「流光没沿着地图边缘」（本体其实是严格贴合的）。
  mesh.layers.set(1);

  // 入场淡入时跳过这个材质：进场那 2.5 秒里地图还是全透明的，画面里只应该有它
  // 沿着空地图的边缘跑（见 ThreeMap.collectFadeMaterials / adoptFadeObject）
  material.userData.skipIntroFade = true;

  return {
    object: mesh,
    update: (delta: number) => {
      uniforms.time.value += delta;
    },
    setTrailLength: (value: number) => {
      uniforms.trailLength.value = Math.min(1, Math.max(0.03, value));
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}

const RIBBON_VERTEX = /* glsl */ `
attribute vec3 aTangent;
attribute float aSide;

uniform float width;
uniform float uRefDistance;

varying vec2 vUv;

void main() {
  vUv = uv;
  mat3 m3 = mat3(modelMatrix);
  vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;

  vec3 T = m3 * aTangent;
  float t2 = dot(T, T);
  T = t2 > 1e-10 ? T * inversesqrt(t2) : vec3(1.0, 0.0, 0.0);

  vec3 V = cameraPosition - wp;
  float v2 = dot(V, V);
  V = v2 > 1e-10 ? V * inversesqrt(v2) : vec3(0.0, 0.0, 1.0);

  vec3 S = cross(T, V);
  float s2 = dot(S, S);
  S = s2 > 1e-10 ? S * inversesqrt(s2) : vec3(0.0, 1.0, 0.0);

  wp += S * aSide * width * clamp(sqrt(v2) / uRefDistance, 0.65, 1.7);
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}
`;

const RIBBON_FRAGMENT = /* glsl */ `
varying vec2 vUv;

uniform vec3 color;
uniform float time;
uniform float opacity;
uniform float speed;
uniform float trailLength;

void main() {
  // 截面：中心亮、外沿淡
  float t = abs(vUv.y * 2.0 - 1.0);
  float section = pow(1.0 - t, 2.0);

  // 沿环：头部后面拖一条尾巴
  float head = fract(time * speed);
  float d = fract(head - vUv.x);
  float tail = clamp(1.0 - d / trailLength, 0.0, 1.0);

  float a = opacity * section * tail * tail;
  if (a < 0.004) discard;

  gl_FragColor = vec4(color, a);
}
`;
