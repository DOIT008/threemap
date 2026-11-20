import * as THREE from 'three';

import { FLYLINE_FRAGMENT, FLYLINE_VERTEX, SinArcCurve, buildFlyLineGeometry, createFlyLineUniforms } from '../materials/flyLine';
import type { ThreeMapContext, FlightSeriesOptions, GeoJsonProperties, MapConfig } from '../types';

/**
 * 坐标转换器 - 将代码/坐标转为投影后的平面坐标
 *
 * 支持两种输入：
 * 1. adcode 码（字符串/数字）：查找 districtData 中的区域中心点
 * 2. [经度, 纬度] 数组：直接投影
 */
const transform = function (
  code: string | number | number[],
  districtData: GeoJsonProperties[],
  projection: (coords: [number, number]) => [number, number],
): [number, number] | null | false {
  if (Array.isArray(code)) {
    const point = projection(code as [number, number]);
    return [point[0], point[1]];
  }
  const district = districtData.find((city) => city.adcode == code);
  if (!district) return false;
  const center = (district.centroid || district.center) as [number, number];
  const point = projection(center);
  return [point[0], point[1]];
};

/**
 * demo 的局部尺度基准：地图局部宽 30.018（外层再乘 0.5 缩放）。
 * 弧高 arcMin/arcMax 写在 City 那一层的局部坐标里，用这个基准换算。
 */
const DEMO_LOCAL_WIDTH = 30.018;

/**
 * 绘制飞行线 - 与 demo 同一套「billboard 光带 + 正弦拱形」画法
 *
 * 为什么不用粒子流（原实现）：粒子是一条条小光点，近处看成一根点组成的线，
 * 远处直接糊掉；而 demo 用的是「始终正对相机的光带」，任何视角都是等宽细光带，
 * 再叠彗尾流动，才有那种「光束飞出去」的感觉。
 *
 * @param options - 飞行线配置
 * @param config - 地图配置
 * @returns THREE.Group - 包含所有飞行光带的组
 */
export const drawFlight = function (this: ThreeMapContext, options: FlightSeriesOptions, config: MapConfig): THREE.Group {
  const projection = this.projection;
  const data = options.data || [];
  const group = new THREE.Group() as any;
  // 飞线必须贴在顶面上，否则会沉进挤出体里显得是平的
  const topY = this.mapDepth ?? config.depth / config.scale;

  const mapWidth = this.mapWorldWidth ?? 10;
  const unit = mapWidth / DEMO_LOCAL_WIDTH;

  const { flightColor, headSize = 1, points, speed = 10 } = options;

  // 弧高：跨度比例决定，再夹到 [arcMin, arcMax]，近的矮、远的高才有层次
  const arcRatio = 0.3;
  const arcMin = 0.5 * unit;
  const arcMax = 2.0 * unit;

  const curves: SinArcCurve[] = [];
  data.forEach((it) => {
    const start = transform(it.start, this.districtData, projection);
    const end = transform(it.end, this.districtData, projection);
    if (!start || !end) return;

    // demo 里光带整体比顶面高 0.02（局部单位）
    const y = topY + 0.02 * unit;
    const a = new THREE.Vector3(start[0], y, start[1]);
    const b = new THREE.Vector3(end[0], y, end[1]);
    const chord = a.distanceTo(b);
    if (chord < 1e-4) return; // 中心区到自己的退化曲线，跳过

    const height = Math.min(Math.max(chord * arcRatio, arcMin), arcMax);
    curves.push(new SinArcCurve(a, b, height));
  });

  const geometry = buildFlyLineGeometry(curves, Math.max(24, Math.min(200, Math.round(points || 72))));
  const uniforms = createFlyLineUniforms(
    {
      color: flightColor[0] ?? '#5ea8f0',
      headColor: flightColor[1] ?? '#e6f6ff',
      // demo: 光带半宽 0.085（局部）→ 世界 0.0425 → 占地图宽 0.00283
      width: mapWidth * 0.00283 * headSize,
      flowSpeed: Math.max(0.02, speed / 33),
    },
    this.refDistance ?? mapWidth * 1.08,
  );

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: FLYLINE_VERTEX,
    fragmentShader: FLYLINE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 10;
  mesh.raycast = () => {};
  group.add(mesh);
  group._category = 'flight'; // 标记类型，render 循环里据此更新 time
  return group;
};

/** 每帧更新飞线流动 */
export const updateMiniFly = function (groups: THREE.Object3D[], delta: number): void {
  groups.forEach((group) => {
    group.children.forEach((mesh: any) => {
      const uniforms = mesh.material?.uniforms;
      if (uniforms?.time) uniforms.time.value += delta;
    });
  });
};
