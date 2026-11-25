import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import tinycolor from 'tinycolor2';

import { drawLabel } from './drawLabel';
import { isNumber, rangeColor, separateColor, centerOfMass, deepMerge } from './helpers';
import { SHIFT_FRAGMENT, SHIFT_VERTEX, applyShiftOptions, createShiftUniforms } from '../materials/shift';
import { SURFACE_FRAGMENT, SURFACE_VERTEX, applySurfaceOptions, createSurfaceUniforms } from '../materials/surface';
import { displayColor } from '../materials/color';
import type { ThreeMapContext, ThreeMapOptions, GeoJsonFeature, GeoJsonProperties, MapConfig, DataItem, LabelOptions } from '../types';

interface ShapeDataItem {
  shape: THREE.Shape;
  surfaceUniforms: Record<string, { value: any }>;
  shiftUniforms: Record<string, { value: any }>;
  material: THREE.ShaderMaterial;
  materialSide: THREE.ShaderMaterial;
  _privateData: any;
  label: CSS2DObject | null;
}

/**
 * 单个多边形的挤出深度。
 *
 * 直接用世界单位：threemap 的投影 scale 会随容器变化，如果沿用「config.depth / scale」
 * 的老算法，换个窗口尺寸地图厚薄就变了。改成由「地图宽度 × 厚度比」算出来，
 * 和 demo 的 1.6 / 30.018 完全等价，且跟容器无关。
 */
function resolveDepth(context: ThreeMapContext, config: MapConfig): number {
  if (typeof context.mapDepth === 'number' && context.mapDepth > 0) {
    return context.mapDepth;
  }
  return config.depth / config.scale;
}

/** 顶面/底面共用的 surface 材质 */
function createSurfaceMaterial(uniforms: Record<string, { value: any }>): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: SURFACE_VERTEX,
    fragmentShader: SURFACE_FRAGMENT,
    transparent: true,
    side: THREE.DoubleSide,
  });
}

/** 侧面（挤出体立面）材质 */
function createShiftMaterial(uniforms: Record<string, { value: any }>): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: SHIFT_VERTEX,
    fragmentShader: SHIFT_FRAGMENT,
    transparent: true,
    side: THREE.DoubleSide,
  });
}

/**
 * 用「整图包围盒」重写 UV。
 *
 * 这是整套视觉能和贴图对齐的关键：demo 里的贴图是整张郑州路网，
 * 每个区县必须按自己在整图中的位置去采样同一张图，而不是各自铺满。
 * 所以 UV = (local - bbox.min) / bbox.size，整图共用一套归一化。
 */
function applyGlobalUV(geometry: THREE.BufferGeometry, box: { minX: number; minY: number; width: number; height: number }): void {
  const pos = geometry.getAttribute('position');
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - box.minX) / box.width;
    uv[i * 2 + 1] = (pos.getY(i) - box.minY) / box.height;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

/**
 * 区县边界线样式。
 *
 * demo 的「每个区县轮廓一条发光线」写在 `City.vue` 里（EdgesGeometry + Line）。
 * 迁移时漏了这块，结果整张贴图铺下来、区县之间没有任何分界，看着就是一整块。
 * 这里用同一套做法补回来：缩成一个 shape 的轮廓边，压在顶面上方一点。
 */
interface DistrictLineStyle {
  color: THREE.Color;
  opacity: number;
}

/** 边界线浮在顶面上方的高度（相对厚度的比例）：太小会 z-fighting 闪烁，太大会像悬空 */
const LINE_EPS_RATIO = 0.012;

/** 悬浮时区县抬升到原厚度的多少倍（与 demo 的 City.vue 一致：group.scale.z → 1.5） */
export const HOVER_SCALE_Z = 1.5;

/**
 * 把区县轮廓做成 EdgesGeometry 线。
 *
 * EdgesGeometry 会把三角化产生的内部边全部剔除（共面、夹角 0），
 * 只留下真正的轮廓 —— 包括飞地、内环（洞）也都会留住。
 */
function createDistrictLine(shape: THREE.Shape, depth: number, style: DistrictLineStyle): THREE.LineSegments {
  const flat = new THREE.ShapeGeometry(shape);
  const edges = new THREE.EdgesGeometry(flat, 1);
  flat.dispose();

  const material = new THREE.LineBasicMaterial({
    color: style.color.clone(),
    transparent: true,
    opacity: style.opacity,
    depthWrite: false,
  });
  // 入场淡入要按比例还原，先把基准透明度记在材质上
  material.userData.baseOpacity = style.opacity;

  const line = new THREE.LineSegments(edges, material) as any;
  line._type = 'districtLine';
  // 线不参与拾取：鼠标压在边界上时应该仍然拾到区县，否则会「点不到」
  line.raycast = () => {};
  line.position.z = depth * (1 + LINE_EPS_RATIO);
  return line;
}

/**
 * 批量构建拉伸几何体（ExtrudeGeometry）
 *
 * 关键点：
 * - 上下盖共用 material-0（surface），侧面用 material-1（shift），和 demo 一致
 * - 关闭斜角（bevelEnabled: false）：斜角会在轮廓边缘多出一圈窄面，
 *   贴着贴图边界光带看就是一条毛边，demo 里也是关掉的
 * - 挤出后按整图 bbox 重写 UV，保证贴图对齐
 * - 每个区县包一层 cell（统一 -90° 旋转），顶面和边界线都挂在 cell 里，
 *   悬浮时只推 cell.scale.z 就能整体抬厚 —— 和 demo 的 City.vue 结构完全对应
 */
const drawShapeAssist = function (
  shapeData: ShapeDataItem[],
  box: { minX: number; minY: number; width: number; height: number },
  depth: number,
  lineStyle: DistrictLineStyle | null,
): { group: THREE.Group; cells: THREE.Group[] } {
  const group = new THREE.Group();
  const cells: THREE.Group[] = [];

  shapeData.forEach((item) => {
    const { shape, material, materialSide, _privateData, label } = item;

    const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    applyGlobalUV(geometry, box);

    const district = new THREE.Mesh(geometry, [material, materialSide]) as any;
    district._type = 'district';
    district._privateData = _privateData;

    label && (district._label = label.element);

    // cell 承担 -90° 旋转：几何体的局部 +Z（挤出方向）从此就是世界 +Y，
    // 顶面 mesh 和边界线因此可以共用一套「z = 厚度」的坐标，抬升也只需要动 cell。
    const cell = new THREE.Group() as any;
    cell.rotation.x = -0.5 * Math.PI;
    cell._targetZ = 1;
    cell._scaleZ = 1;
    cell.add(district);

    if (lineStyle && lineStyle.opacity > 0) {
      const lineMesh = createDistrictLine(shape, depth, lineStyle);
      // 入场淡入要按比例还原透明度，挂在 cell 上直接取，不用每帧遍历场景树
      cell._line = lineMesh;
      cell.add(lineMesh);
    }

    district._cell = cell;
    cells.push(cell);
    group.add(cell);
  });

  return { group, cells };
};

interface DrawDistrictResult {
  meshGroup: THREE.Group;
  advanceMeshGroup: THREE.Group;
  districtData: GeoJsonProperties[];
  surfaceMaterials: THREE.ShaderMaterial[];
  shiftMaterials: THREE.ShaderMaterial[];
  _realShape: () => Promise<THREE.Group>;
  _cancelRealShape: () => void;
}

/**
 * 构建区域数据 - 核心渲染函数
 *
 * 流程与 demo 对齐：
 * 1. 把 GeoJSON 投影成 2D Shape，同时累计整图包围盒
 * 2. 用整图包围盒归一化 UV（所有区县共用同一张贴图坐标）
 * 3. 顶面 surface 材质（暗底路网 + 法线浮雕 + 轮廓光 + 中心压暗）
 * 4. 侧面 shift 材质（底部深蓝 → 顶部亮青的水晶立面）
 * 5. 延迟 17ms 生成 ExtrudeGeometry，先用平面预览顶上首帧
 */
export const drawDistrict = function (
  this: ThreeMapContext,
  data: DataItem[],
  options: ThreeMapOptions,
  features: GeoJsonFeature[],
  config: MapConfig,
): DrawDistrictResult {
  const projection = this.projection;
  const itemStyle = options.itemStyle;
  const emphasis = options.emphasis;
  const lineStyle = options.lineStyle;
  const seriesName = options.seriesName;
  const range = itemStyle.range;

  // 区县边界线：demo 的 City.vue 里每个区县轮廓都有一条淡青发光线，
  // 各区域的形状就是靠它区分开的。透明度在 demo 的 0.42 基础上提到 0.58 ——
  // 底下这层是暗色路网贴图，0.42 在 1080p 屏上基本糊掉，看不清区县分界。
  // 颜色跟随 lineStyle.color，配成透明色时整条线不建。
  const lineFormat = tinycolor(lineStyle.color);
  const lineRgb = lineFormat.toRgb();
  const districtLineStyle: DistrictLineStyle | null =
    lineFormat.getAlpha() > 0
      ? {
          color: new THREE.Color(`rgb(${lineRgb.r},${lineRgb.g},${lineRgb.b})`),
          opacity: 0.58 * lineFormat.getAlpha(),
        }
      : null;

  // 色阶参数解析：如果开启 range.show，根据 value 计算颜色
  let sc: string | null = null;
  let ec: string | null = null;
  let min = Number.MIN_SAFE_INTEGER;
  let max = Number.MAX_SAFE_INTEGER;
  if (range.show) {
    sc = range.color[0]!;
    ec = range.color[1]!;
    min = range.min;
    max = range.max;
  }

  const dataMap = new Map<string, DataItem>();
  data.forEach((it) => {
    if (sc != null && ec != null) {
      const value = it.value;
      it.color = range.mode === 'separate' ? separateColor(value!, range.rules, ec) : rangeColor(sc, ec, min, max, value);
    } else {
      it.color = null;
    }
    dataMap.set(it.district + '', it);
  });

  const depth = resolveDepth(this, config);

  const meshGroup = new THREE.Group();
  const advanceMeshGroup = new THREE.Group();
  const districtData: GeoJsonProperties[] = [];
  const shapeData: ShapeDataItem[] = [];
  const surfaceMaterials: THREE.ShaderMaterial[] = [];
  const shiftMaterials: THREE.ShaderMaterial[] = [];

  // 第一遍：投影所有点，算出整图包围盒
  const box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const projectFeature = (feature: GeoJsonFeature): number[][][] => {
    let coordinates: any = feature.geometry.coordinates;
    if (feature.geometry.type === 'Polygon') coordinates = [coordinates];
    const rings: number[][][] = [];
    coordinates.forEach((multiPolygon: any) => {
      multiPolygon.forEach((polygon: number[][]) => {
        const ring: number[][] = [];
        for (let i = 0; i < polygon.length; i++) {
          const [x, y] = projection(polygon[i] as [number, number]);
          if (!x || !y) continue;
          ring.push([x, -y]);
          if (x < box.minX) box.minX = x;
          if (x > box.maxX) box.maxX = x;
          if (-y < box.minY) box.minY = -y;
          if (-y > box.maxY) box.maxY = -y;
        }
        rings.push(ring);
      });
    });
    return rings;
  };

  const allRings = features.map((feature) => projectFeature(feature));
  const bbox = {
    minX: box.minX,
    minY: box.minY,
    width: Math.max(1e-6, box.maxX - box.minX),
    height: Math.max(1e-6, box.maxY - box.minY),
  };
  // 世界宽度缓存：飞线宽度、光柱尺寸等都按「地图宽度的比例」换算，跨地图才一致
  this.mapBox = bbox;

  // 第二遍：建 Shape + 材质
  features.forEach((feature, featureIndex) => {
    const { properties } = feature;
    districtData.push(properties);
    properties.seriesName = seriesName;
    const item = dataMap.get(properties.adcode + '');

    // 绘制区域名称标签（CSS2DObject）
    const label = drawDistrictName.call(this, item ? item : undefined, options.label, properties, feature, config);
    label && meshGroup.add(label);

    const rings = allRings[featureIndex]!;
    rings.forEach((ring) => {
      if (ring.length < 3) return;
      const shape = new THREE.Shape();
      ring.forEach((point, i) => {
        const x = point[0]!;
        const y = point[1]!;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      });

      // 色阶开启时每个区域用自己的数据色；否则交给顶面配置里的铺色
      const color = item && item.color ? item.color : options.surface.mapColor;
      const surfaceUniforms = createSurfaceUniforms({ ...options.surface, mapColor: color });
      const shiftUniforms = createShiftUniforms(depth, options.side);
      const material = createSurfaceMaterial(surfaceUniforms);
      const materialSide = createShiftMaterial(shiftUniforms);

      const _privateData: any = {
        ...deepMerge({} as any, properties, item || {}),
        deriveColor: color,
        textStyle: options.label.itemStyle.textStyle,
      };
      _privateData['emphasisColor'] = emphasis.topColor;
      _privateData['emphasisText'] = emphasis.textStyle;
      _privateData['emphasisEnabled'] = emphasis.show;

      const meshRef: any = { surfaceUniforms, shiftUniforms };
      material.userData.district = meshRef;
      materialSide.userData.district = meshRef;

      surfaceMaterials.push(material);
      shiftMaterials.push(materialSide);

      shapeData.push({ shape, surfaceUniforms, shiftUniforms, material, materialSide, label: label || null, _privateData });

      // 快速预览版本：ShapeGeometry 平面体（不带厚度）
      const shapeGeo = new THREE.ShapeGeometry(shape);
      applyGlobalUV(shapeGeo, bbox);
      const preview = new THREE.Mesh(shapeGeo, material) as any;
      preview._type = 'shape_district';
      preview._privateData = _privateData;
      preview.rotation.x = -0.5 * Math.PI;
      preview.position.y = depth;
      label && (preview._label = label.element);
      advanceMeshGroup.add(preview);
    });
  });

  const isClearRef = this;
  let _realShapeTimerId: ReturnType<typeof setTimeout> | null = null;

  const _realShape = (): Promise<THREE.Group> => {
    return new Promise((resolve) => {
      // setTimeout 17ms 约等于 1 帧（60fps），让浏览器先渲染平面版
      _realShapeTimerId = setTimeout(() => {
        _realShapeTimerId = null;
        if (!isClearRef.isClear) {
          const { group, cells } = drawShapeAssist(shapeData, bbox, depth, districtLineStyle);
          // 悬浮抬升要逐帧 lerp，缓存一份 cell 列表，省得每帧遍历整棵树
          isClearRef.districtCells = cells;
          resolve(group);
        } else {
          resolve(new THREE.Group());
        }
      }, 17);
    });
  };

  const _cancelRealShape = (): void => {
    if (_realShapeTimerId !== null) {
      clearTimeout(_realShapeTimerId);
      _realShapeTimerId = null;
    }
  };

  return { meshGroup, advanceMeshGroup, districtData, surfaceMaterials, shiftMaterials, _realShape, _cancelRealShape };
};

/**
 * 更新区域材质（不重新构建几何体）
 *
 * 全部走 uniform：纹理/法线组合、贴图染色、侧面配色都是改值，
 * 不重建材质也不重编译着色器，所以面板拖动是实时的。
 */
export const updateDistrictMaterials = function (this: ThreeMapContext, data: DataItem[], options: ThreeMapOptions): void {
  if (!this.seriesGroup) return;

  const { itemStyle, lineStyle, outLineStyle, emphasis, surface, side } = options;
  const range = itemStyle.range;

  let sc: string | null = null;
  let ec: string | null = null;
  let min = Number.MIN_SAFE_INTEGER;
  let max = Number.MAX_SAFE_INTEGER;
  if (range.show) {
    sc = range.color[0]!;
    ec = range.color[1]!;
    min = range.min;
    max = range.max;
  }

  const dataMap = new Map<string, DataItem>();
  data.forEach((it) => {
    if (sc != null && ec != null) {
      it.color = range.mode === 'separate' ? separateColor(it.value!, range.rules, ec) : rangeColor(sc, ec, min, max, it.value);
    } else {
      it.color = null;
    }
    dataMap.set(it.district + '', it);
  });

  const lineFormat = tinycolor(lineStyle.color);
  const lineRgb = lineFormat.toRgb();
  const nextLineColor = `rgb(${lineRgb.r},${lineRgb.g},${lineRgb.b})`;
  const lineOpacity = lineFormat.getAlpha();

  const outlineFormat = tinycolor(outLineStyle.color);
  const outlineRgb = outlineFormat.toRgb();
  const nextOutlineColor = `rgb(${outlineRgb.r},${outlineRgb.g},${outlineRgb.b})`;
  const outlineOpacity = outlineFormat.getAlpha();

  this.seriesGroup.traverse((obj: any) => {
    if (obj._type === 'district' || obj._type === 'shape_district') {
      const item = dataMap.get(obj._privateData?.adcode + '');
      const color = item && item.color ? item.color : surface.mapColor;
      obj._privateData.deriveColor = color;
      obj._privateData.textStyle = options.label.itemStyle.textStyle;
      obj._privateData.emphasisColor = emphasis.topColor;
      obj._privateData.emphasisText = emphasis.textStyle;
      obj._privateData.emphasisEnabled = emphasis.show;

      const uniforms = Array.isArray(obj.material) ? obj.material[0]?.uniforms : obj.material?.uniforms;
      applySurfaceOptions(uniforms, { ...surface, mapColor: color });

      if (Array.isArray(obj.material) && obj.material[1]) {
        const sideUniforms = obj.material[1].uniforms;
        // 挤出深度可能随「地图深度」一起变，这里同步一下，保证侧面渐变比例不变
        sideUniforms.depth.value = obj.material[1].userData.extrudeDepth ?? sideUniforms.depth.value;
        applyShiftOptions(sideUniforms, side);
      }

      if (obj._label) {
        (obj._label as HTMLElement).style.display = options.label.show ? '' : 'none';
      }
    } else if (obj._type === 'districtLine') {
      obj.material.color.set(nextLineColor);
      obj.material.opacity = lineOpacity;
      obj.material.needsUpdate = true;
    } else if (obj._type === 'label' && obj._isDistrict) {
      obj.visible = options.label.show;
      if (obj.element) {
        obj.element.style.display = options.label.show ? '' : 'none';
      }
    } else if (obj._isGlow && obj.material && obj.material.isLineBasicMaterial) {
      obj.material.color.set(nextOutlineColor);
      obj.material.opacity = outlineOpacity;
      obj.material.needsUpdate = true;
    }
  });
};

/** 顶面/侧面时间动画（法线流光 + 侧面呼吸 + 悬浮抬升） */
export const districtAnimate = function (this: ThreeMapContext, deltaTime: number): void {
  const surfaceMaterials = this.surfaceMaterials;
  if (surfaceMaterials) {
    for (let i = 0; i < surfaceMaterials.length; i++) {
      const u = surfaceMaterials[i]!.uniforms;
      if (u.time) u.time.value += deltaTime / 3;
    }
  }
  const shiftMaterials = this.shiftMaterials;
  if (shiftMaterials) {
    for (let i = 0; i < shiftMaterials.length; i++) {
      const u = shiftMaterials[i]!.uniforms;
      if (u.time) u.time.value += deltaTime / 3;
    }
  }

  // 悬浮抬升：cell.scale.z 插值追 target。
  // demo 是 `group.scale.lerp(target, 0.1)`（每帧固定系数），这里用 0.18 稍快一点，
  // 鼠标快速划过时不会留一串「半抬起来」的区县。
  const cells = this.districtCells;
  if (cells) {
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i] as any;
      if (!cell) continue;
      const target = cell._targetZ ?? 1;
      const current = cell._scaleZ ?? 1;
      const diff = target - current;
      if (Math.abs(diff) < 0.002) {
        if (current !== target) {
          cell._scaleZ = target;
          cell.scale.z = target;
        }
        continue;
      }
      const next = current + diff * LEAP_LERP;
      cell._scaleZ = next;
      cell.scale.z = next;
    }
  }
};

/** 抬升插值速度（每帧靠拢比例） */
const LEAP_LERP = 0.18;

/** 取区县顶面材质的 uniforms（挤出体是双材质数组，顶面在 material-0） */
function surfaceUniformsOf(mesh: any): Record<string, { value: any }> | undefined {
  const material = Array.isArray(mesh?.material) ? mesh.material[0] : mesh?.material;
  return material?.uniforms;
}

/** 把一套 CSS 文本样式写到标签元素上 */
function applyLabelStyle(element: HTMLElement, style: Record<string, any>): void {
  Object.keys(style).forEach((key: string) => {
    if (isNumber(style[key])) {
      (element.style as any)[key] = style[key] + 'px';
    } else if (Array.isArray(style[key])) {
      (element.style as any)[key] = style[key].join('px ') + 'px';
    } else {
      (element.style as any)[key] = style[key];
    }
  });
}

/** 复位一个区县的高亮（厚度落回 1、顶面高亮归零、标签回到常态样式） */
function resetDistrictEmphasis(mesh: any): void {
  if (!mesh || mesh._type !== 'district') return;

  const cell = mesh._cell;
  if (cell) cell._targetZ = 1;

  const uniforms = surfaceUniformsOf(mesh);
  if (uniforms?.highlight) uniforms.highlight.value = 0;

  const textStyle = mesh._privateData?.textStyle;
  if (textStyle && mesh._label) applyLabelStyle(mesh._label as HTMLElement, textStyle);
}

/** 上一帧的鼠标指针形态，避免每帧重复写 style */
let cursorState = '';

/** 可以触发 tooltip 的图元：区域/散点/圆柱读 _privateData，飞线按面索引定位单条数据 */
const TOOLTIP_PICK_TYPES = new Set(['district', 'scatter', 'cylinder', 'flight']);

/**
 * 区域渲染（悬浮高亮）
 *
 * 顶面是 ShaderMaterial，没有 color 属性可以直接改，所以高亮走两条独立通道：
 *   ① 几何 —— cell.scale.z 从 1 抬到 1.5，区县整块「顶起来」（demo 同款）
 *   ② 颜色 —— 推动 surface 的 highlight/highlightColor uniform，在片元里按明暗投色
 * 两条都不重建材质、不重编译着色器，鼠标划过是零开销的。
 */
export const districtRender = function (this: ThreeMapContext): void {
  const { raycaster, scene } = this;

  // 复位上一次悬停的区县
  if (this.pickDistrictMesh) {
    resetDistrictEmphasis(this.pickDistrictMesh.object);
    this.pickDistrictMesh = null;
  }

  // DOM 悬浮由 mouseleave 清理；飞线来自射线拾取，每帧重建
  if (this.tooltipHover?.source === 'series') this.tooltipHover = null;

  const intersects = raycaster.intersectObjects(scene.children, true);
  const hits = intersects.filter((it: any) => TOOLTIP_PICK_TYPES.has(it.object._type));
  const picked = hits[0]?.object as any;

  if (!picked) {
    if (cursorState !== '') {
      document.body.style.cursor = '';
      cursorState = '';
    }
    return;
  }

  // 系列图元也要记录：tooltipRender 从它的 _privateData 读取 name / value
  this.pickDistrictMesh = hits[0]!;

  // 飞线把多条曲线合并成一个 Mesh，用面索引反推命中的那条数据
  if (picked._type === 'flight') {
    const hit = hits[0]!;
    const segments = (picked as any)._segments ?? 72;
    const curveIndex = Math.floor((hit.faceIndex ?? 0) / (segments * 6));
    const item = (picked as any)._flightData?.[curveIndex];
    if (item && this.mouseEvent) {
      const nameOf = (code: any) => {
        const district = this.districtData.find((it) => it.adcode == code);
        return district?.name ?? (Array.isArray(code) ? code.join(",") : String(code));
      };
      this.tooltipHover = {
        data: {
          ...item,
          name: `${nameOf(item.start)} → ${nameOf(item.end)}`,
          seriesName: (picked as any)._seriesName,
        },
        x: this.mouseEvent.offsetX,
        y: this.mouseEvent.offsetY,
        source: 'series',
      };
    }
  }

  // 非区域图元只参与 tooltip / 指针，不触发区域抬升与高亮
  if (picked._type !== 'district') {
    if (cursorState !== 'pointer') {
      document.body.style.cursor = 'pointer';
      cursorState = 'pointer';
    }
    return;
  }

  const { emphasisColor, emphasisText, emphasisEnabled } = picked._privateData || {};
  if (!emphasisEnabled) {
    if (cursorState !== '') {
      document.body.style.cursor = '';
      cursorState = '';
    }
    return;
  }

  // ① 厚度抬升
  const cell = picked._cell;
  if (cell) cell._targetZ = HOVER_SCALE_Z;

  // ② 顶面高亮
  const uniforms = surfaceUniformsOf(picked);
  if (uniforms?.highlight) {
    uniforms.highlight.value = 1;
    if (uniforms.highlightColor) {
      uniforms.highlightColor.value.copy(displayColor(emphasisColor || '#73f8ff'));
    }
  }

  // ③ 标签切到悬浮样式
  if (emphasisText && picked._label) applyLabelStyle(picked._label as HTMLElement, emphasisText);

  if (cursorState !== 'pointer') {
    document.body.style.cursor = 'pointer';
    cursorState = 'pointer';
  }
};

/**
 * 绘制区域名称
 */
function drawDistrictName(
  this: ThreeMapContext,
  data: DataItem | undefined,
  options: LabelOptions,
  properties: GeoJsonProperties,
  feature: GeoJsonFeature,
  config: MapConfig,
): CSS2DObject | undefined {
  const projection = this.projection;
  let center = properties.centroid || properties.center;

  if (!Array.isArray(center)) {
    center = centerOfMass(feature).geometry.coordinates;
  }
  const [x, y] = projection(center as [number, number]);
  const label = drawLabel(options, { ...properties, ...data });

  let now = new Date().getTime();
  let isDbl = false;
  label.addEventListener('pointerdown', (e: PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const clickTime = new Date().getTime();
    if (clickTime - now < 300) {
      isDbl = true;
      if (this.events['dblclick']) {
        this.events['dblclick'].forEach((cb) => {
          cb(properties);
        });
      }
    } else {
      setTimeout(() => {
        if (!isDbl && this.events['click']) {
          this.events['click'].forEach((cb) => {
            cb(properties);
          });
        }
        isDbl = false;
      }, 300);
    }
    now = clickTime;
  });

  const name = new CSS2DObject(label) as any;
  // 标签压在顶面上方一点，和 demo 的 depth + 0.2（局部）/ 0.5 等价
  const z = (this.mapDepth || 0) + (this.mapWorldWidth || 10) * 0.0067;
  name.position.set(x, z, y);
  name._type = 'label';
  name._isDistrict = true;
  name.visible = options.show;
  return name;
}
