import type * as THREE from 'three';

import type { SideOptions } from './materials/shift';
import type { SurfaceOptions } from './materials/surface';

export type { SideOptions, SurfaceOptions };

// ==================== GeoJSON ====================

export interface GeoJsonProperties {
  adcode: string | number;
  name: string;
  centroid?: [number, number];
  center?: [number, number];
  seriesName?: string;
  [key: string]: any;
}

export interface GeoJsonGeometry {
  type: "Polygon" | "MultiPolygon" | "Point" | "LineString" | "MultiLineString";
  coordinates: any;
}

export interface GeoJsonFeature {
  type: "Feature";
  properties: GeoJsonProperties;
  geometry: GeoJsonGeometry;
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

// ==================== Label / TextStyle ====================

export interface TextStyle {
  fontSize: number | string;
  color: string;
  fontStyle: string;
  fontWeight: string;
  fontFamily: string;
  textDecoration: string;
  textShadow: string;
  [key: string]: any;
}

export interface LabelItemStyle {
  padding: number[];
  backgroundColor: string;
  borderRadius: number | number[];
  borderColor: string;
  borderWidth: number | string;
  textStyle: TextStyle;
}

export interface LabelOptions {
  show: boolean;
  name: string;
  isFormatter: boolean;
  formatter: ((data: any) => string) | null;
  formatterHtml: string;
  className: string;
  offset: [number, number];
  itemStyle: LabelItemStyle;
}

// ==================== Series ====================

export interface FlightDataItem {
  start: string | number | number[];
  end: string | number | number[];
}

export interface FlightSeriesOptions {
  type: "flight";
  seriesName: string;
  points: number;
  flightLen: number;
  speed: number;
  flightColor: string[];
  headSize: number;
  data: FlightDataItem[];
}

export interface MarkerSeriesOptions {
  type: "marker";
  seriesName: string;
  symbol: string;
  symbolSize: [number, number];
  symbolSizeFormatter: ((data: any[]) => [number, number]) | null;
  offset: [number, number];
  className: string;
  label: LabelOptions;
  data: DataItem[];
}

export interface PrismSeriesOptions {
  type: "prism";
  seriesName: string;
  size: number;
  prismType: 1 | 2 | 3;
  maxHeight: number;
  minHeight: number;
  offset: [number, number];
  className: string;
  label: LabelOptions;
  itemStyle: {
    color: [string, string, string];
  };
  data: DataItem[];
}

export interface ScatterSeriesOptions {
  type: "scatter";
  seriesName: string;
  spotColor: string;
  spotSize: number;
  spotSizeFormatter: ((data: any[]) => number) | null;
  spotSeparate: number;
  ringColor: string;
  ringRatio: number;
  ringSeparate: number;
  offset: [number, number];
  label: LabelOptions;
  data: DataItem[];
}

export interface CylinderSeriesOptions {
  type: "cylinder";
  seriesName: string;
  mode: "cylinder" | "tower";
  towerColor: string;
  color: [string, string];
  size: number;
  maxHeight: number;
  minHeight: number;
  separate: number;
  offset: [number, number];
  label: LabelOptions;
  data: DataItem[];
}

export type SeriesOptions = FlightSeriesOptions | MarkerSeriesOptions | PrismSeriesOptions | ScatterSeriesOptions | CylinderSeriesOptions;

// ==================== Data ====================

export interface DataItem {
  district: string | number | number[];
  name?: string;
  value?: number;
  color?: string | null;
  adcode?: string | number;
  seriesName?: string;
  [key: string]: any;
}

export interface RangeRule {
  value: number;
  color: string;
  label: string;
}

// ==================== Options ====================

export interface MapConfig {
  autoScale: boolean;
  disableRotate: boolean;
  disableZoom: boolean;
  autoScaleFactor: number;
  scale: number;
  depth: number;
}

export interface TooltipItemStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  padding: number[];
  color: string;
  fontSize: number;
  minWidth: number;
  width: string;
  borderRadius: number;
  borderStyle: string;
  [key: string]: any;
}

export interface TooltipOptions {
  show: boolean;
  content: string;
  styleType: string;
  isFormatter: boolean;
  formatterHtml: string;
  formatter: ((data: any) => string) | null;
  itemStyle: TooltipItemStyle;
}

export interface RangeOptions {
  show: boolean;
  mode: "range" | "separate";
  rules: RangeRule[];
  color: string[];
  min: number;
  max: number;
  visualMap: {
    show: boolean;
    left: string;
    top: string;
    maxText: string;
    minText: string;
    textStyle: TextStyle;
  };
}

export interface ThreeMapOptions {
  config: MapConfig;
  autoRotate: {
    autoRotate: boolean;
    autoRotateSpeed: number;
  };
  camera: {
    x: number;
    y: number;
    z: number;
  };
  grid: {
    show: boolean;
    color: string;
    opacity: number;
  };
  foundation: {
    show: boolean;
    size: number;
    speed: number;
    image: string;
    isRotate: boolean;
    static: boolean;
  };
  tooltip: TooltipOptions;
  mirror: {
    show: boolean;
    color: [string, string];
  };
  wall: {
    show: boolean;
    height: number;
    color: string;
  };
  texture: {
    show: boolean;
    autoRepeat: boolean;
    repeat: { x: number; y: number };
    offset: { x: number; y: number };
    image: string;
  };
  /** 顶面材质：纹理来源（图片/纯色）× 法线 自由组合，外加轮廓光与中心压暗 */
  surface: SurfaceOptions;
  /** 侧面（挤出体立面）配色，与顶面完全独立 */
  side: SideOptions;
  /** 场景特效开关 */
  scene: {
    /** 地面光圈 */
    groundRing: boolean;
    /** 漂浮光柱 */
    beams: boolean;
    /** 区县标点（光锥 + 光环） */
    cones: boolean;
    /** 沿轮廓的描边跑光 */
    trail: boolean;
    /** 入场动画（相机推进 + 厚度生长 + 淡入） */
    intro: boolean;
  };
  map: string;
  mapName: string;
  glow: {
    show: boolean;
    threshold: number;
    strength: number;
    radius: number;
  };

  itemStyle: {
    range: RangeOptions;
    topColor: string;
    sideColor: string;
    uColor: string;
  };
  emphasis: {
    show: boolean;
    topColor: string;
    textStyle: TextStyle;
  };
  lineStyle: {
    color: string;
  };
  outLineStyle: {
    /** 是否显示外轮廓线（贴图自带边界光时建议关掉，避免和光带夹出一条暗边） */
    show: boolean;
    color: string;
  };
  label: LabelOptions;
  seriesName: string;
  data: DataItem[];
  series: SeriesOptions[];
}

// ==================== Three.js Extensions ====================

export interface ExtendedMesh extends THREE.Mesh {
  _type?: string;
  _privateData?: any;
  _label?: HTMLElement;
  _isGlow?: boolean;
  _speed?: number;
  _scale?: number;
}

export interface ExtendedObject3D extends THREE.Object3D {
  _type?: string;
  _category?: string;
  _privateData?: any;
  _isGlow?: boolean;
  element?: HTMLElement;
}

export interface ExtendedGroup extends THREE.Group {
  _category?: string;
}

export interface ExtendedPoints extends THREE.Points {
  _speed?: number;
  _repeat?: number;
  _been?: number;
  _total?: number;
  _isHalf?: string | null;
}

export interface MapUniform {
  uTime: { value: number };
  uHeight: { value: number };
  uColor: { value: THREE.Color };
  uStart: { value: number };
  uSpeed: { value: number };
}

export interface TooltipInstance {
  _type: "tooltip";
  _show: (data: any) => void;
  _hide: () => void;
}

export interface CacheModel {
  modelScale: { code: string | number; scale: number }[];
  modelBox: THREE.Box3 | null;
  code: string | null;
}

// ==================== ThreeMap Context ====================

export interface ThreeMapContext {
  projection: (coords: [number, number]) => [number, number];
  districtData: GeoJsonProperties[];
  events: Record<string, ((data: any) => void)[]>;
  scale: number;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  raycaster: THREE.Raycaster;
  innerWidth: number;
  innerHeight: number;
  tooltipDom: HTMLElement;
  tooltip: TooltipInstance | null;
  pickDistrictMesh: THREE.Intersection | null;
  mouseEvent: MouseEvent | null;
  clock: THREE.Clock;
  refresh: boolean;
  uvScale?: THREE.Vector2;
  isClear: boolean;
  mapUf?: MapUniform;
  /** 地图在投影平面上的包围盒（世界单位） */
  mapBox?: { minX: number; minY: number; width: number; height: number };
  /** 地图世界宽度，用来把贴图/图元尺寸换算成「占宽比」 */
  mapWorldWidth?: number;
  /** 地图世界厚度（挤出体高度），同样由地图宽度换算，保证换容器不变形 */
  mapDepth?: number;
  /** 飞线/跑光的距离补偿基准（通常等于机位距离 × 1.215） */
  refDistance?: number;
  /** 顶面材质列表（每帧推进 time） */
  surfaceMaterials?: THREE.ShaderMaterial[];
  /** 侧面材质列表 */
  shiftMaterials?: THREE.ShaderMaterial[];
  /** 每个区县的载体节点（悬浮抬升用，逐帧 lerp scale.z） */
  districtCells?: THREE.Group[];
  [key: string]: any;
}
