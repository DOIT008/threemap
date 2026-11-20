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
}

/**
 * 地面光圈：一张大贴图贴在地图下方，缓慢自转。
 * 它是「悬浮在星空里」的视觉基底，也是镜面反射之外唯一的地面装饰。
 */
export function drawGroundRing(mapWidth: number): SceneLayer {
  const size = mapWidth * 1.066; // demo: 16 / 15（地图世界宽）
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
 * 漂浮光柱：20 根细光条在大范围内缓慢上升，到顶后回到下方重新开始。
 * 大屏里那种「空气里的碎光」，很淡但让画面不死。
 */
export function drawBeams(mapWidth: number): SceneLayer {
  const group = new THREE.Group();
  const range = mapWidth * 1.33; // demo: 20 / 15
  const unit = mapWidth / 15; // demo 的世界尺度换算
  const geometry = new THREE.CylinderGeometry(0.03 * unit, 0.03 * unit, 1, 6, 1, true);
  const materials: THREE.ShaderMaterial[] = [];
  const beams: { mesh: THREE.Mesh; speed: number; resetHeight: number }[] = [];

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
    mesh.position.set((Math.random() - 0.5) * range, (5 - Math.random() * 5) * unit, (Math.random() - 0.5) * range);
    mesh.scale.set(1, 2 + Math.random() * 4, 1);
    mesh.raycast = () => {};
    materials.push(material);
    beams.push({ mesh, speed: 2 + Math.random(), resetHeight: (10 + Math.random() * 20) * unit });
    group.add(mesh);
  }

  return {
    object: group,
    update: (delta: number) => {
      beams.forEach((beam) => {
        beam.mesh.position.y += beam.speed * delta * unit;
        if (beam.mesh.position.y > beam.resetHeight) {
          beam.mesh.position.x = (Math.random() - 0.5) * range;
          beam.mesh.position.z = (Math.random() - 0.5) * range;
          beam.mesh.position.y = (1 - Math.random() * 5) * unit;
          beam.mesh.scale.y = 2 + Math.random();
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
 * 描边跑光：沿城市外轮廓循环跑的一段亮光。
 * demo 里颜色极暗（additive 后几乎看不见），这里保持同样的克制强度，
 * 只在边缘留一点「活着」的感觉，不抢贴图自带的边界光。
 */
export function drawTrail(context: ThreeMapContext, boundary: GeoJsonFeatureCollection, topY: number, mapWidth: number): SceneLayer | null {
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
    points.push(new THREE.Vector3(x, topY, -y));
  });
  // 闭合
  if (points.length && points[0]!.distanceTo(points[points.length - 1]!) > 1e-6) {
    points.push(points[0]!.clone());
  }
  if (points.length < 3) return null;

  const geometry = buildRibbonGeometry(points, 2);
  const uniforms = {
    // demo 的 GeoTrail 用的是 `new Color(2, 10, 10)` —— 通道值远超 1 的 HDR 色。
    // 这不是随手写的：跑光本身只有 0.1 世界单位宽（屏幕上 1~2px），
    // 用普通色（0.6 亮度）叠在已经有一圈轮廓光的地图边上根本看不出来。
    // 必须给足亮度，让它自己「爆」出来。
    color: { value: new THREE.Color(2, 10, 10) },
    time: { value: 0 },
    opacity: { value: 0 },
    speed: { value: 0.1 }, // 10 秒跑一圈（demo: t += delta / 10）
    trailLength: { value: 0.3 }, // 尾长占整圈的比例（demo: 100 点 × 步长 3.3）
    width: { value: mapWidth * 0.0033 }, // demo: lineWidth 0.1 / 30 局部宽
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

  return {
    object: mesh,
    update: (delta: number) => {
      uniforms.time.value += delta;
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
