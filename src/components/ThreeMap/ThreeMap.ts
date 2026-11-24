import * as THREE from "three";
import { geoMercator } from "d3-geo";

import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";

import { drawDistrict, districtRender, districtAnimate, updateDistrictMaterials } from './utils/drawDistrict';
import { drawOutline } from './utils/drawOutLine';
import { drawGlow } from './utils/drawGlow';
import { drawMarker } from './utils/drawMarker';
import { drawPrism } from './utils/drawPrism';
import { drawFlight, updateMiniFly } from './utils/drawFlight';
import { drawScatter } from './utils/drawScatter';
import { drawCylinder } from './utils/drawCylinder';
import { addTooltip, tooltipRender } from './utils/addTooltip';
import { drawGrid } from './utils/drawGrid';
import { drawFoundation } from './utils/drawFoundation';
import { drawMirror } from './utils/drawMirror';
import { drawBeams, drawCones, drawGroundRing, drawTrail, type SceneLayer } from './utils/drawScene';
import { register } from './utils/register';

import { uuid, centerOfMass, bbox, featureCollection } from "./utils/helpers";

import type {
  ThreeMapOptions,
  GeoJsonFeatureCollection,
  GeoJsonProperties,
  MapUniform,
  TooltipInstance,
  CacheModel,
  MarkerSeriesOptions,
  PrismSeriesOptions,
  FlightSeriesOptions,
  ScatterSeriesOptions,
  CylinderSeriesOptions,
} from "./types";

/**
 * 相机距离 = 地图宽度 × 该比例。
 * demo: |(-0.8, 10.2, 5.3)| = 11.52，地图世界宽 15.009 → 0.7675。
 */
const CAMERA_DISTANCE_RATIO = 0.7675;

/**
 * 入场起始机位相对最终机位的三轴倍率。
 * demo: 从 (2, 15, 8) 推到 (-0.8, 10.2, 5.3)
 *   距离 17.12 / 11.52 = 1.4861
 *   方位角 atan2(2,8)=14.04° → atan2(-0.8,5.3)=-8.58°，差 22.6°
 *   极角 acos(0.8761)=28.82° → acos(0.8854)=27.62°，比 1.0434
 */
const INTRO = {
  distanceRatio: 1.4861,
  azimuthDelta: (22.6 * Math.PI) / 180,
  polarRatio: 1.0434,
};

/** 把向量按球坐标缩放：保持方向语义的「拉远 + 转一点 + 抬一点」 */
function toSphericalFrom(from: THREE.Vector3, distanceRatio: number, azimuthDelta: number, polarRatio: number): THREE.Vector3 {
  const radius = from.length() * distanceRatio;
  const polar = Math.acos(THREE.MathUtils.clamp(from.y / (from.length() || 1), -1, 1)) * polarRatio;
  const azimuth = Math.atan2(from.x, from.z) + azimuthDelta;
  const sinPolar = Math.sin(polar);
  return new THREE.Vector3(radius * sinPolar * Math.sin(azimuth), radius * Math.cos(polar), radius * sinPolar * Math.cos(azimuth));
}

export default class ThreeMap {
  el: HTMLElement;
  innerWidth: number;
  innerHeight: number;

  isInitCamera: boolean;
  registerList: Map<string, [GeoJsonFeatureCollection, GeoJsonFeatureCollection, ReturnType<typeof geoMercator>]>;
  scene: THREE.Scene | null;
  renderer: THREE.WebGLRenderer | null;
  camera: THREE.PerspectiveCamera | null;
  tooltipDom: HTMLElement;
  tooltip: TooltipInstance | null;

  events: Record<string, ((data: any) => void)[]>;
  mapTextures: (THREE.Texture | null)[];
  projection: any;
  axesHelper: THREE.AxesHelper | null;
  cacheMaterials: Record<string, any>;
  cacheDarkMaterials: Record<string, any>;

  districtData: GeoJsonProperties[];
  seriesGroup: THREE.Group;
  environmentGroup: THREE.Group;
  refresh: boolean;
  scale: number;
  cacheModel: CacheModel | null;
  foundationIns: any[];
  isClear: boolean;

  pointer: THREE.Vector2 | null;
  mouseEvent: MouseEvent | null;

  onPointerMove: (e: MouseEvent) => void;
  onPointerClick: (e: MouseEvent) => void;
  onDblClick: (e: MouseEvent) => void;

  clock: THREE.Clock | null;
  raycaster: THREE.Raycaster | null;
  controls: OrbitControls | null;
  CSS2DRenderer: CSS2DRenderer | null;
  lights: THREE.Light[];

  bloomComposer: EffectComposer | null;
  finalComposer: EffectComposer | null;

  resizeObserver: ResizeObserver | null;
  _cancelRealShape: (() => void) | null;
  lastGeometryKey: string | null;
  seriesKeyMap: Map<string, string>;

  options: ThreeMapOptions | null;
  mapKey: string;
  mapUf: MapUniform | undefined;
  pickDistrictMesh: THREE.Intersection | null;
  uvScale?: THREE.Vector2;
  boundaryFeatures: GeoJsonFeatureCollection["features"] | null;
  lastWallKey: string | null;

  /** 地图投影包围盒（世界单位），贴图/图元尺寸都按它换算 */
  mapBox?: { minX: number; minY: number; width: number; height: number };
  mapWorldWidth: number;
  /** 地图世界厚度（挤出体高度），由地图宽度换算 */
  mapDepth: number;
  /** 飞线/跑光的距离补偿基准（跟随机位距离，保证线宽观感不变） */
  refDistance: number;
  /**
   * 冻结动画（调试用）。
   *
   * 只有 URL 带 ?freeze=1 时由 index.vue 打开。冻结后所有 time 型动画
   * （飞线流光、光柱漂移、光圈自转、顶点流光、侧面条纹）都停在原地，
   * 画面完全静止 —— 逐项核对配置面板时才有稳定的基准可以做像素比对。
   * 悬浮抬升不受影响，仍然照常插值。
   */
  frozen: boolean;
  surfaceMaterials: THREE.ShaderMaterial[];
  shiftMaterials: THREE.ShaderMaterial[];
  /** 每个区县的载体节点：悬浮抬升逐帧 lerp scale.z */
  districtCells: THREE.Group[];
  /** 参与入场淡入的材质（所有带 uniforms.opacity 的材质） */
  fadeMaterials: THREE.Material[];
  /**
   * 入场时同样要跟着压暗、但用的是 material.opacity 的线状材质
   * （外轮廓描线、电子围栏墙体）—— 见 collectIntroLineMaterials。
   */
  introLineMaterials: any[];
  /** 场景特效层（光圈/光柱/标点/描边跑光） */
  sceneLayers: SceneLayer[];
  mirrorHandle: ReturnType<typeof drawMirror> | null;
  conesLayer: SceneLayer | null;
  trailLayer: SceneLayer | null;
  /** 场景图元（标点/跑光）的开关快照，变化时才重建 */
  lastSceneToggleKey: string;
  /** 机位（观测角度 + 地图尺寸）快照，只有真变了才重设相机 */
  lastCameraKey: string;
  /** 入场动画开关快照 */
  lastIntroKey: string;
  lastSceneKey: string;
  introFrame: number | null;
  introDone: boolean;
  /**
   * 当前入场淡入进度（0~1）。
   *
   * 场景图元（区县标点、边缘流光）是可以在入场跑完之后才被面板重建的：
   * 新材质的 opacity 初始是 0，如果没人负责赋值，就会永远停在 0 ——
   * 表现就是「把流光关掉再打开，它再也不出现了」。所以把进度存成字段，
   * 任何时刻新建的图元都能立刻对齐到当前进度。
   */
  introOpacity: number;

  /**
   * ThreeMap 核心实例构造：初始化场景、渲染器、交互控制器和鼠标事件。
   */
  constructor(el: HTMLElement, tooltipDom: HTMLElement) {
    this.el = el;
    this.innerWidth = el.offsetWidth;
    this.innerHeight = el.offsetHeight;

    this.isInitCamera = false;
    this.registerList = new Map();
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.tooltipDom = tooltipDom;
    this.tooltip = null;

    this.events = {};
    this.mapTextures = [];
    this.projection = null;
    this.axesHelper = null;
    this.cacheMaterials = {};
    this.cacheDarkMaterials = {};

    this.districtData = [];
    this.seriesGroup = new THREE.Group();
    this.environmentGroup = new THREE.Group();
    this.refresh = true;

    this.scale = 1;

    this.cacheModel = {
      modelScale: [],
      modelBox: null,
      code: null,
    };

    this.foundationIns = [];
    this.isClear = false;

    this.pointer = new THREE.Vector2(-100000, -10000);
    this.mouseEvent = null;
    this.options = null;
    this.mapKey = "";
    this.pickDistrictMesh = null;
    this.bloomComposer = null;
    this.finalComposer = null;
    this.controls = null;
    this.CSS2DRenderer = null;
    this.lights = [];
    this.clock = null;
    this.raycaster = null;
    this.resizeObserver = null;
    this._cancelRealShape = null;
    this.lastGeometryKey = null;
    this.seriesKeyMap = new Map();
    this.boundaryFeatures = null;
    this.lastWallKey = null;

    this.mapWorldWidth = 10;
    this.surfaceMaterials = [];
    this.districtCells = [];
    this.shiftMaterials = [];
    this.fadeMaterials = [];
    this.sceneLayers = [];
    this.mirrorHandle = null;
    this.conesLayer = null;
    this.trailLayer = null;
    this.introLineMaterials = [];
    this.lastSceneToggleKey = "";
    this.lastCameraKey = "";
    this.lastIntroKey = "";
    this.lastSceneKey = "";
    this.mapDepth = 0;
    this.refDistance = 10;
    this.frozen = false;
    this.introFrame = null;
    this.introDone = false;
    this.introOpacity = 0;

    const onPointerMove = (mouseEvent: MouseEvent): void => {
      this.pointer!.x = (mouseEvent.offsetX / this.innerWidth) * 2 - 1;
      this.pointer!.y = -(mouseEvent.offsetY / this.innerHeight) * 2 + 1;
      this.mouseEvent = mouseEvent;
    };
    this.onPointerMove = onPointerMove;

    const onPointerClick = (e: MouseEvent): void => {
      e.stopPropagation();
    
      const { raycaster, scene } = this;
      if (!raycaster || !scene) return;
      const intersects = raycaster.intersectObjects(scene.children, true);
      const r = intersects.filter((it: any) => it.object._type === "cylinder" || it.object._type === "district" || it.object._type === "scatter");
      if (r.length) {
        const mesh = r[0]!.object as any;
        const { deriveColor, ...properties } = mesh._privateData;
        if (this.events["click"]) {
          this.events["click"].forEach((cb) => {
            cb(properties);
          });
        }
      }
    };
    this.onPointerClick = onPointerClick;
    this.el.addEventListener("mousemove", this.onPointerMove);
    this.el.addEventListener("mousedown", this.onPointerClick);

    const onDblClick = (e: MouseEvent): void => {
      e.stopPropagation();
      const { raycaster, scene } = this;
      if (!raycaster || !scene) return;
      const intersects = raycaster.intersectObjects(scene.children, true);
      const r = intersects.filter((it: any) => it.object._type === "cylinder" || it.object._type === "district" || it.object._type === "scatter");
      if (r.length) {
        const mesh = r[0]!.object as any;
        const { deriveColor, ...properties } = mesh._privateData;
        if (this.events["dblclick"]) {
          this.events["dblclick"].forEach((cb) => {
            cb(properties);
          });
        }
      }
    };
    this.onDblClick = onDblClick;
    this.el.addEventListener("dblclick", this.onDblClick);

    this.scene = new THREE.Scene();
    this.scene.add(this.seriesGroup);
    this.scene.add(this.environmentGroup);

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();

    this.lights = this.setLight();
    this.initCamera();
    this.setRenderer();
    this.setCssRenderer();
    this.addHelper();
    this.setController();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.el);
  }

  /**
   * 设置配置项
   */
  setOption(options: ThreeMapOptions, refresh = true): void {
    const geometryKey = this.getGeometryKey(options);
    const canUpdateMaterials = this.options && this.lastGeometryKey === geometryKey && this.seriesGroup && this.seriesGroup.children.length > 0;
    if (canUpdateMaterials) {
      this.options = options;
      updateDistrictMaterials.call(this as any, options.data, options);
      this.updateOutlineLayers(options);
      this.applyCamera(options);
      this.setBackground(options);
      this.updateEnvironment(options);
      this.updateSceneLayers(options);
      this.updateControls(options);
      this.addTooltipLayer();
      this.updateSeriesLayers(options);
      // 入场动画开关被打开时补播一次
      const introKey = `${options.scene.intro}`;
      if (introKey !== this.lastIntroKey) {
        this.lastIntroKey = introKey;
        this.collectFadeMaterials();
        this.playIntro(options);
      }
      return;
    }

    this.mapKey = uuid();
    this.clearMap();
    this.isClear = false;
    this.seriesGroup = new THREE.Group();
    this.scene!.add(this.seriesGroup);
    this.environmentGroup = new THREE.Group();
    this.scene!.add(this.environmentGroup);
    this.options = options;
    this.lastGeometryKey = geometryKey;
    this.seriesKeyMap = new Map();

    const code = options.map + "";

    const { autoRotate, config } = options;
    const { disableRotate = false, disableZoom = false } = config;

    if (autoRotate && this.controls) {
      this.controls.autoRotate = autoRotate.autoRotate;
      this.controls.autoRotateSpeed = autoRotate.autoRotateSpeed;
    }
    if (this.controls) {
      this.controls.enableRotate = !disableRotate;
      this.controls.enableZoom = !disableZoom;
    }

    this.addTooltipLayer();

    if (this.registerList.get(code)) {
      const [boundary, full, projection] = this.registerList.get(code)!;
      this.refresh = refresh;
      this.boundaryFeatures = boundary.features;

      if (refresh) {
        this.projection = projection;
        this.scale = 1;
        this.cacheModel = {
          modelScale: [],
          modelBox: null,
          code: code,
        };
      } else {
        try {
          if (code === this.cacheModel!.code) {
            this.scale = 1;
          } else {
            const item = this.cacheModel!.modelScale.find((it) => it.code == code);
            this.scale = item!.scale;
          }
        } catch (error) {
          console.warn(`abstain model failed ${error}`);
          this.refresh = true;
          this.projection = projection;
          this.scale = 1;
        }
      }

      // ---- 尺寸基准：所有图元（光圈/光柱/飞线/描线）都按「地图宽度」换算，
      //      这样换地图、换容器大小，观感比例都不会跑
      this.updateMapSize(full, projection, config.depth);

      // ---- 居中 + 悬浮 ----
      // demo 的 Center 组件把地图按「包围盒中心」对齐到 x/z 原点（投影中心来自形心，
      // 两者并不重合，不补这个偏移地图会整体偏一边）；
      // y 方向抬离地面 0.19（地图宽 15.009），镜面/光圈留在 y≈0 撑出倒影的间隙。
      const box = this.mapBox;
      const offsetX = box ? -(box.minX * 2 + box.width) / 2 : 0;
      // 形状坐标 y 与世界 z 差一个负号（rotation.x = -90°），所以 z 的偏移是正的包围盒中心
      const offsetZ = box ? (box.minY * 2 + box.height) / 2 : 0;
      this.seriesGroup.position.set(offsetX, this.mapWorldWidth * 0.01266, offsetZ);

      // ---- 相机：方向取 options.camera（观测角度），距离再按 config.mapSize 缩放 ----
      this.applyCamera(options, true);
      this.isInitCamera = true;

      // ---- 背景与雾：可画底色，也可以整体透明让页面背景透出来 ----
      this.setBackground(options);

      // ---- 环境层（镜面 / 地面光圈 / 光柱）----
      this.setEnvironment(options);
      this.setFoundation(options);
      // 背景开关也参与 key：透明背景要把镜面从「深色底板」换成按倒影亮度取透明
      this.lastSceneKey = `${options.background.show}|${options.mirror.show}|${options.scene.groundRing}|${options.scene.groundRingScale}|${options.scene.beams}|${options.glow.show}|${options.grid.show}|${options.foundation.show}`;

      this.drawDistrictArea(options.data, full.features, options);
      this.drawDistrictOutline(boundary.features, options);
      this.lastWallKey = `${options.wall.show}|${options.wall.height}|${options.wall.color}`;

      const series = options.series;
      series.forEach((item) => {
        switch (item.type) {
          case "marker":
            this.addMarkerLayer(item as MarkerSeriesOptions);
            break;
          case "prism":
            this.addPrismLayer(item as PrismSeriesOptions);
            break;
          case "flight":
            this.addLinkLayer(item as FlightSeriesOptions);
            break;
          case "scatter":
            this.addSCatterLayer(item as ScatterSeriesOptions);
            break;
          case "cylinder":
            this.addCylinderLayer(item as CylinderSeriesOptions);
            break;
        }
        const seriesId = this.getSeriesId(item);
        this.seriesKeyMap.set(seriesId, this.getSeriesKey(item));
      });

      // ---- 场景特效（区县标点 / 边缘流光）----
      // 放在系列之后建：面板切开关时要重建这两层，重加的对象会落到
      // seriesGroup.children 末尾；首次构建也按同样顺序建，开关来回切
      // 才不会因为透明物体的叠放顺序变化而出现细微色差。
      this.buildSceneLayers(options);

      // ---- 入场动画：收集淡入材质，跑相机推进 + 厚度生长 ----
      this.collectFadeMaterials();
      this.lastIntroKey = `${options.scene.intro}`;
      this.playIntro(options);
    } else {
      throw Error("请先注册地图: " + code);
    }
  }

  /**
   * 更新电子围栏（wall）图层，不重建地图块。
   */
  updateOutlineLayers(options: ThreeMapOptions): void {
    if (!this.seriesGroup || !this.boundaryFeatures) return;

    // 外轮廓描线显隐（贴图自带边界光时关掉，避免外沿夹出一条暗带）
    this.seriesGroup.children.forEach((child: any) => {
      if (child?._category === 'outline') {
        child.visible = options.outLineStyle.show !== false;
      }
    });

    const wallKey = `${options.wall.show}|${options.wall.height}|${options.wall.color}`;
    if (this.lastWallKey === wallKey) return;

    const removeWallGroup = (): void => {
      const targets: THREE.Object3D[] = [];
      this.seriesGroup.children.forEach((child: any) => {
        if (child?._category === "wall") {
          targets.push(child);
        }
      });

      const disposeObject = (obj: any): void => {
        if (!obj) return;
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m: any) => {
              m.map?.dispose();
              m.dispose?.();
            });
          } else {
            obj.material.map?.dispose();
            obj.material.dispose?.();
          }
        }
      };

      targets.forEach((target) => {
        target.traverse((obj: any) => {
          disposeObject(obj);
        });
        this.seriesGroup.remove(target);
      });
    };

    removeWallGroup();

    if (options.wall.show) {
      const { drawWall } = drawOutline.call(this as any, this.boundaryFeatures, options, options.config);
      drawWall().then((group) => {
        (group as any)._category = "wall";
        this.seriesGroup && this.seriesGroup.add(group);
        this.collectIntroLineMaterials(group);
      });
    }

    this.lastWallKey = wallKey;
  }

  /**
   * 更新环境层（镜面 / 地面光圈 / 光柱），只在开关变化时重建。
   */
  updateEnvironment(options: ThreeMapOptions): void {
    if (!this.environmentGroup) return;

    // 倒影浓度只是 uniform，不重建离屏纹理，所以放在 key 判断之前：
    // 拖面板时不用重建整个环境层就能实时变淡
    this.mirrorHandle?.setOpacity(options.mirror.opacity ?? 1);

    const key = `${options.background.show}|${options.mirror.show}|${options.scene.groundRing}|${options.scene.groundRingScale}|${options.scene.beams}|${options.glow.show}|${options.grid.show}|${options.foundation.show}`;
    if (this.lastSceneKey === key) return;
    this.lastSceneKey = key;

    // 先按专用句柄回收（光柱/跑光有额外资源，镜面有离屏 fbo）
    this.sceneLayers.forEach((layer) => layer.dispose());
    this.sceneLayers = [];
    if (this.mirrorHandle) {
      this.mirrorHandle.dispose();
      this.mirrorHandle = null;
    }
    this.foundationIns = [];

    // 再兜底清空环境组剩余对象（网格 / 底座）
    this.environmentGroup.children.slice().forEach((child: any) => {
      this.environmentGroup!.remove(child);
      child.traverse((obj: any) => {
        obj.geometry?.dispose?.();
        const materials = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
        materials.forEach((m: any) => {
          m.map?.dispose?.();
          m.dispose?.();
        });
      });
    });

    this.setFoundation(options);
    this.setEnvironment(options);
  }

  /**
   * 更新控制器参数。
   */
  updateControls(options: ThreeMapOptions): void {
    const { autoRotate, config } = options;
    const { disableRotate = false, disableZoom = false } = config;

    if (autoRotate && this.controls) {
      this.controls.autoRotate = autoRotate.autoRotate;
      this.controls.autoRotateSpeed = autoRotate.autoRotateSpeed;
    }
    if (this.controls) {
      this.controls.enableRotate = !disableRotate;
      this.controls.enableZoom = !disableZoom;
    }
  }

  /**
   * 提取会影响几何或场景结构的配置快照。
   */
  getGeometryKey(options: ThreeMapOptions): string {
    return `${options.map}|${options.config.depth}|${options.config.scale}`;
  }

  /**
   * 提取 series 的稳定 id 和快照 key。
   */
  getSeriesId(series: ThreeMapOptions["series"][number]): string {
    return `${series.type}:${series.seriesName}`;
  }

  getSeriesKey(series: ThreeMapOptions["series"][number]): string {
    return JSON.stringify(series);
  }

  /**
   * 按需更新 series，未变化的 series 复用现有对象。
   */
  updateSeriesLayers(options: ThreeMapOptions): void {
    if (!this.seriesGroup) return;

    const nextSeriesKeyMap = new Map<string, string>();
    const nextSeriesIdSet = new Set<string>();

    options.series.forEach((series) => {
      const id = this.getSeriesId(series);
      const key = this.getSeriesKey(series);
      nextSeriesKeyMap.set(id, key);
      nextSeriesIdSet.add(id);
    });

    // 移除已删除的 series
    const removedIds = new Set<string>();
    this.seriesGroup.children.forEach((child: any) => {
      const id = child?._seriesId;
      if (id && !nextSeriesIdSet.has(id)) {
        removedIds.add(id);
      }
    });
    removedIds.forEach((id) => this.removeSeriesGroup(id));

    // 更新变更的 series
    options.series.forEach((series) => {
      const id = this.getSeriesId(series);
      const key = this.getSeriesKey(series);
      const prevKey = this.seriesKeyMap.get(id);

      if (prevKey !== key) {
        this.removeSeriesGroup(id);
        switch (series.type) {
          case "marker":
            this.addMarkerLayer(series as MarkerSeriesOptions);
            break;
          case "prism":
            this.addPrismLayer(series as PrismSeriesOptions);
            break;
          case "flight":
            this.addLinkLayer(series as FlightSeriesOptions);
            break;
          case "scatter":
            this.addSCatterLayer(series as ScatterSeriesOptions);
            break;
          case "cylinder":
            this.addCylinderLayer(series as CylinderSeriesOptions);
            break;
        }
      }
    });

    this.seriesKeyMap = nextSeriesKeyMap;
  }

  /**
   * 移除并释放指定 series 的所有对象。
   */
  removeSeriesGroup(seriesId: string): void {
    if (!this.seriesGroup) return;

    const removeTargets: THREE.Object3D[] = [];
    this.seriesGroup.children.forEach((child: any) => {
      if (child?._seriesId === seriesId) {
        removeTargets.push(child);
      }
    });

    const disposeObject = (obj: any): void => {
      if (!obj) return;
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m: any) => {
            m.map?.dispose();
            m.dispose?.();
          });
        } else {
          obj.material.map?.dispose();
          obj.material.dispose?.();
        }
      }
    };

    removeTargets.forEach((target) => {
      target.traverse((obj: any) => {
        disposeObject(obj);
        if (["label", "marker", "prism", "scatter"].includes(obj._type)) {
          obj.element?.remove();
        }
      });
      this.seriesGroup.remove(target);
    });
  }

  /**
   * 城市轮廓 → 世界坐标的 xz 环列表（供漂浮光柱做「点是否在城市内」判定）。
   *
   * 投影坐标本身没有居中（地图是靠 seriesGroup.position 挪到原点的），
   * 而光柱挂在 environmentGroup 上、就在世界原点附近，所以这里要先补上
   * 那个偏移，才能和光柱的坐标系对齐。
   *
   * 注意 z 的符号：mapBox.minY 存的是 min(-projY) = -max(projY)，
   * 所以 `minY + height/2` 等于「-投影中心Y」，而不是中心Y —— 它刚好就等于
   * seriesGroup.position.z。也就是说世界 z = projY + 这个值（是加不是减）。
   * 写成减会让采样区域整体错开约 3.5% 地图宽。
   */
  getBoundaryRingsWorld(): [number, number][][] {
    const projection = this.projection;
    if (!projection || !this.boundaryFeatures) return [];

    const box = this.mapBox;
    const cx = box ? box.minX + box.width / 2 : 0;
    const cz = box ? box.minY + box.height / 2 : 0;

    const rings: [number, number][][] = [];
    const pushRing = (ring: any): void => {
      const out: [number, number][] = [];
      ring.forEach((p: number[]) => {
        const point = projection(p as [number, number]);
        if (!point) return;
        const [x, y] = point;
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        out.push([x - cx, y + cz]);
      });
      if (out.length >= 3) rings.push(out);
    };

    const walk = (obj: any): void => {
      if (!obj) return;
      if (obj.type === 'FeatureCollection') obj.features.forEach(walk);
      else if (obj.type === 'Feature') walk(obj.geometry);
      else if (obj.type === 'Polygon') obj.coordinates.forEach(pushRing);
      else if (obj.type === 'MultiPolygon') obj.coordinates.forEach((poly: any) => poly.forEach(pushRing));
    };
    walk({ type: 'FeatureCollection', features: this.boundaryFeatures });

    return rings;
  }

  /**
   * 配置场景环境特效（镜面反射 + 地面光圈 + 漂浮光柱）
   */
  setEnvironment(options: ThreeMapOptions): void {
    // bloom 只在需要时创建：demo 本体没有辉光，默认走直接渲染，颜色才不会被推白
    if (options.glow.show) {
      const { bloomComposer, finalComposer } = drawGlow.call(this as any, options);
      this.bloomComposer = bloomComposer;
      this.finalComposer = finalComposer;
    } else {
      this.bloomComposer = null;
      this.finalComposer = null;
    }

    const width = this.mapWorldWidth;

    if (options.scene.groundRing) {
      const ring = drawGroundRing(width, options.scene.groundRingScale);
      this.environmentGroup.add(ring.object);
      this.sceneLayers.push(ring);
    }

    if (options.scene.beams) {
      // 传城市轮廓 + 顶面高度：光条只撒在轮廓以内、并且只在地图顶面上方那层
      // 薄空气里飘，不会再有长光带横在空白背景上（容易被当成没贴边的流光）
      const beams = drawBeams(width, {
        region: this.getBoundaryRingsWorld(),
        topY: width * 0.01266 + this.mapDepth,
      });
      this.environmentGroup.add(beams.object);
      this.sceneLayers.push(beams);
    }

    if (options.mirror.show) {
      // 透明背景时镜面不留深色底板，只把倒影按亮度叠上去；
      // 地图底面的高度传进去，镜面才能贴着本体放、倒影不会和地图分家；
      // 最后一个参数是倒影浓度，只影响倒影深浅，不动地图本体
      this.mirrorHandle = drawMirror(
        width,
        this.scene!,
        this.camera!,
        !options.background.show,
        this.seriesGroup.position.y,
        options.mirror.opacity ?? 1,
      );
      this.environmentGroup.add(this.mirrorHandle.mesh);
    }
  }

  /**
   * 计算地图的投影包围盒与世界宽度。
   *
   * 所有图元尺寸（光圈、光柱、飞线宽度、描线宽度）都以它为基准换算成「占宽比」，
   * 这样换地图、换容器尺寸，观感比例都不会跑偏。
   */
  updateMapSize(boundary: GeoJsonFeatureCollection, projection: (coords: [number, number]) => [number, number] | null, depthValue = 0): void {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const walk = (obj: any): void => {
      if (!obj) return;
      if (obj.type === 'FeatureCollection') obj.features.forEach(walk);
      else if (obj.type === 'Feature') walk(obj.geometry);
      else if (obj.type === 'Polygon') obj.coordinates.forEach((ring: any) => ring.forEach((p: number[]) => push(p)));
      else if (obj.type === 'MultiPolygon') obj.coordinates.forEach((poly: any) => poly.forEach((ring: any) => ring.forEach((p: number[]) => push(p))));
    };
    const push = (p: number[]): void => {
      const point = projection(p as [number, number]);
      if (!point) return;
      const [x, y] = point;
      if (!x || !y) return;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (-y < minY) minY = -y;
      if (-y > maxY) maxY = -y;
    };
    walk(boundary);

    if (Number.isFinite(minX) && maxX > minX) {
      this.mapBox = { minX, minY, width: maxX - minX, height: maxY - minY };
      this.mapWorldWidth = maxX - minX;
    } else {
      this.mapWorldWidth = 10;
    }

    // 厚度 = 宽度 × 厚度比。demo 是 1.6 / 30.018 ≈ 5.33%，
    // config.depth 在这里当成「千分比」，默认 53 就是 5.3%。
    this.mapDepth = this.mapWorldWidth * (depthValue / 1000);
  }

  /**
   * 背景与雾：show 打开时画深海军蓝底 + 远处渐隐，让地图像悬在空间里；
   * show 关闭时什么都不要写，清屏 alpha 归零，画布透明、页面背景直接透出。
   * 参数按地图宽度换算（demo: 底色 #041533，雾 20~60，地图宽 15）。
   */
  setBackground(options: ThreeMapOptions): void {
    if (!this.scene) return;
    const { show, color: bgColor } = options.background;
    const color = new THREE.Color(bgColor);
    const w = this.mapWorldWidth;

    // scene.background 为 null 且 clearColor 的 alpha 为 0 时，renderer（alpha: true）
    // 才不会往画布上刷底色；雾只在有底色时启用，否则会把远处图元染成一片深蓝。
    this.scene.background = show ? color : null;
    this.scene.fog = show ? new THREE.Fog(color, w * 1.33, w * 4) : null;
    this.renderer?.setClearColor(show ? color : 0x000000, show ? 1 : 0);
  }

  /**
   * 场景特效层：区县标点 + 边缘流光
   */
  buildSceneLayers(options: ThreeMapOptions): void {
    // 可重复调用：先把上一次的标点/流光摘掉（面板切开关时会走这里）
    const dropLayer = (layer: SceneLayer | null): null => {
      if (!layer) return null;
      this.seriesGroup?.remove(layer.object);
      // 顺手把它的材质从淡入列表里剔除：否则每开关一次就积一批已释放的材质
      const dead = new Set<THREE.Material>();
      layer.object.traverse((obj: any) => {
        const materials = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
        materials.forEach((m: any) => dead.add(m));
      });
      this.fadeMaterials = this.fadeMaterials.filter((m) => !dead.has(m));
      layer.dispose();
      return null;
    };
    this.conesLayer = dropLayer(this.conesLayer);
    this.trailLayer = dropLayer(this.trailLayer);

    // 顶面高度：光柱/光圈/飞线都要站在顶面上，否则会沉进挤出体里
    const topY = this.mapDepth;

    if (options.scene.cones && this.districtData.length) {
      const centers = this.districtData.map((d) => {
        const center = (d.centroid || d.center) as [number, number];
        const [x, y] = this.projection(center);
        return new THREE.Vector3(x, 0, y);
      });
      const cones = drawCones(centers, topY, this.mapWorldWidth);
      // 入场没结束时先藏着，等厚度长完再显形
      cones.object.visible = this.introDone;
      this.conesLayer = cones;
      this.seriesGroup.add(cones.object);
    }

    if (options.scene.trail && this.boundaryFeatures) {
      const trail = drawTrail(
        this as any,
        { type: 'FeatureCollection', features: this.boundaryFeatures },
        topY,
        this.mapWorldWidth,
        { speed: options.scene.trailSpeed, length: options.scene.trailLength, brightness: options.scene.trailBrightness },
      );
      if (trail) {
        this.trailLayer = trail;
        this.seriesGroup.add(trail.object);
        // 这道光不参与入场淡入（见 drawTrail 里的 skipIntroFade）：进场那 2.5 秒
        // 地图还是全透明的，画面里只应该有它沿着空地图边缘跑。
        // 它自己就是常亮、每次重建都从 opacity 1 开始，所以不用 adoptFadeObject。
      }
    }

    this.lastSceneToggleKey = this.getSceneToggleKey(options);
  }

  /**
   * 场景图元开关快照。除了开关本身，流光的可调参数也算在内 ——
   * 改速度/尾长/亮度要重建几何与材质才能生效。
   */
  getSceneToggleKey(options: ThreeMapOptions): string {
    const s = options.scene;
    return `${s.cones}|${s.trail}|${s.trailSpeed}|${s.trailLength}|${s.trailBrightness}`;
  }

  /**
   * 把一段新加入场景的图元接入淡入体系：材质立刻对齐当前进度，
   * 并登记进 fadeMaterials，这样入场还在跑的时候新建的图元也会继续跟着淡入。
   */
  adoptFadeObject(object: THREE.Object3D): void {
    const seen = new Set<THREE.Material>(this.fadeMaterials);
    object.traverse((obj: any) => {
      const materials = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
      materials.forEach((m: any) => {
        // skipIntroFade：边缘流光这类「进场时就要亮着」的图层，不接进淡入体系
        if (!m?.uniforms?.opacity || seen.has(m) || m.userData?.skipIntroFade) return;
        m.uniforms.opacity.value = this.introOpacity;
        m.depthWrite = this.introOpacity > 0.06;
        seen.add(m);
        this.fadeMaterials.push(m);
      });
    });
  }

  /**
   * 增量更新场景图元开关（标点 / 流光）。
   */
  updateSceneLayers(options: ThreeMapOptions): void {
    const key = this.getSceneToggleKey(options);
    if (key === this.lastSceneToggleKey) return;
    if (!this.districtData.length) return;
    this.buildSceneLayers(options);
  }

  /**
   * 收集所有带 uniforms.opacity 的材质，入场时统一淡入。
   *
   * 同时负责它们的 depthWrite：opacity 还是 0 的时候地图看不见，但它照样写深度，
   * 会把自己轮廓范围内的地面光圈、星点整片挡在身后 —— 画面上就是一块和地图形状
   * 一模一样的深色剪影。所以淡入期间关掉深度写入，真的看得见了再打开。
   */
  collectFadeMaterials(): void {
    this.fadeMaterials = [];
    this.introLineMaterials = [];
    if (!this.seriesGroup) return;

    const seen = new Set<THREE.Material>();
    const add = (material: any): void => {
      // skipIntroFade：边缘流光不跟着地图一起淡入，进场时它要先在空场景上跑
      if (material?.uniforms?.opacity && !seen.has(material) && !material.userData?.skipIntroFade) {
        seen.add(material);
        this.fadeMaterials.push(material);
      }
    };

    // 顶面/侧面材质此刻可能还没挂到场景里（ExtrudeGeometry 是延迟一帧建的），
    // 直接按材质数组收，避免侧面材质漏掉后一直是透明的
    this.surfaceMaterials.forEach(add);
    this.shiftMaterials.forEach(add);

    this.seriesGroup.traverse((obj: any) => {
      const materials = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
      materials.forEach(add);
    });

    this.applyDepthWrite(false);
    // 外轮廓描线走的是 material.opacity，进不了上面那套 uniform 淡入，单独收一遍
    this.collectIntroLineMaterials(this.seriesGroup);
  }

  /**
   * 收集「用 material.opacity、而不是 uniforms.opacity」的线状材质（外轮廓描线、围栏墙体）。
   *
   * 不单独管的话，进场那 2.5 秒地图还全透明，整圈轮廓线却已经画在画面上了 ——
   * 也就是反馈里的「刚进来就有整个图的轮廓，而不是一道光在描轮廓」。
   * 收进来后由 setIntroLineOpacity 跟着入场进度压暗。
   *
   * 墙体是异步建的（drawWall 的 Promise），可能在入场跑到一半才加进来，
   * 所以登记时立刻对齐一次当前进度。
   */
  collectIntroLineMaterials(root: THREE.Object3D | null): void {
    if (!root) return;
    const seen = new Set<THREE.Material>(this.introLineMaterials);
    root.traverse((obj: any) => {
      const materials = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
      materials.forEach((m: any) => {
        if (!m?.userData?.introLineFade || seen.has(m)) return;
        seen.add(m);
        this.introLineMaterials.push(m);
        m.opacity = (m.userData.baseOpacity ?? 1) * this.introOpacity;
      });
    });
  }

  /** 外轮廓描线 / 围栏墙体的入场透明度（0~1 倍率） */
  setIntroLineOpacity(scale: number): void {
    this.introLineMaterials.forEach((m: any) => {
      m.opacity = (m.userData?.baseOpacity ?? 1) * scale;
      // 还没真正看清之前先别写深度，否则这些透明线会在地面光圈上划出细缝
      m.depthWrite = scale > 0.06;
    });
  }

  /**
   * 区县标签显隐。
   *
   * demo 是等入场动画跑完才把标签挂上去的：地图还在长厚度的 3.5 秒里，
   * 标签已经漂在地图上方，看着很奇怪。这里用同样的时机控制。
   */
  setDistrictLabelVisible(visible: boolean): void {
    if (!this.seriesGroup) return;
    const show = visible && (this.options?.label.show ?? true);
    this.seriesGroup.traverse((obj: any) => {
      if (obj._isDistrict && obj._type === 'label') {
        obj.visible = show;
        if (obj.element) obj.element.style.display = show ? '' : 'none';
      }
    });
  }

  /**
   * 区县边界线透明度（0~1 倍率）。
   *
   * 入场时地表还是全透明的，边界线却已经画在画面上了 —— 会在蓝色光晕上
   * 浮出一堆细线。所以它跟着厚度生长的进度一起淡入，时机和地表完全同步。
   */
  setDistrictLineOpacity(scale: number): void {
    const cells = this.districtCells;
    if (!cells) return;
    for (let i = 0; i < cells.length; i++) {
      const line: any = (cells[i] as any)?._line;
      const material: any = line?.material;
      if (!material) continue;
      const base = material.userData.baseOpacity ?? 0;
      material.opacity = base * scale;
      line.visible = scale > 0.001;
    }
  }

  applyDepthWrite(enabled: boolean): void {
    this.fadeMaterials.forEach((material: any) => {
      material.depthWrite = enabled;
    });
  }

  /**
   * 入场动画（与 demo 的 timeline 同节奏）：
   *   0 ~ 2.5s   相机从远处斜右方推进到最终机位（circ.out）
   *   2.5 ~ 3.5s 地图从「零厚度」长起来，同时整体淡入
   * 相机位移用球坐标表达（距离 / 方位角 / 极角三个倍率），
   * 这样换机位、换地图都还是同一个观感，不用硬编码坐标。
   */
  playIntro(options: ThreeMapOptions): void {
    if (this.introFrame) cancelAnimationFrame(this.introFrame);
    this.introFrame = null;

    // setCamera 已经把方向换算成「宽度 × 距离比」的最终机位，这里直接取用
    const end = this.camera ? this.camera.position.clone() : new THREE.Vector3();

    if (!options.scene.intro) {
      this.camera?.position.copy(end);
      this.seriesGroup?.scale.set(1, 1, 1);
      this.introOpacity = 1;
      this.fadeMaterials.forEach((material: any) => {
        material.uniforms.opacity.value = 1;
      });
      this.applyDepthWrite(true);
      if (this.conesLayer) this.conesLayer.object.visible = true;
      this.setDistrictLabelVisible(true);
      this.setDistrictLineOpacity(1);
      this.setIntroLineOpacity(1);
      // 不开入场动画时流光就是常态尾长
      this.trailLayer?.setTrailLength?.(options.scene.trailLength);
      this.introDone = true;
      this.emit("intro-end");
      return;
    }

    const start = toSphericalFrom(end, INTRO.distanceRatio, INTRO.azimuthDelta, INTRO.polarRatio);
    this.introDone = false;
    this.introOpacity = 0;
    this.setDistrictLabelVisible(false);
    this.setDistrictLineOpacity(0);
    // 外轮廓描线、围栏墙体也不能一上来就画在画面上，跟着入场压到全透明
    this.setIntroLineOpacity(0);
    this.camera?.position.copy(start);
    // 只压扁 Y（地图厚度方向），XZ 不动，避免入场时贴图被拉伸
    this.seriesGroup?.scale.set(1, 0.0001, 1);
    if (this.conesLayer) this.conesLayer.object.visible = false;

    // 进场那道光是「一笔一笔把轮廓画出来」，不是整圈轮廓一起亮着：
    // 尾长先压到整圈的 1/10（demo 的 GeoTrail 采样就是 100 × 3.3 ≈ 10%），
    // 画面上只有一段短光在跑，跑过的部分不留下痕迹。
    // 等地图开始长出来（2.5s 后）再把它拉回主题里的尾长，两段不跳。
    const trailTail = options.scene.trailLength;
    const introTrailTail = Math.min(trailTail, 0.1);
    this.trailLayer?.setTrailLength?.(introTrailTail);

    const cameraTween = { duration: 2500 };
    const growTween = { delay: 2500, duration: 1000 };

    const easeOutCirc = (x: number): number => Math.sqrt(1 - Math.pow(x - 1, 2));
    const easeOutQuad = (x: number): number => 1 - (1 - x) * (1 - x);

    // 计时不读挂钟，改按「真正画出来的帧」累计：
    //
    // 首帧要现编着色器（辉光 / 镜面 / 挤出体）并上传贴图，主线程常被卡几百毫秒到一秒；
    // 如果按 performance.now() 的差值算，这一卡就把 2.5s 的相机推进整段吃掉 —— 用户看到的是
    // 空场景一动不动，然后地图「啪」一下出现，也就是反馈里的「进场没有过渡」。
    // 所以每帧最多推进 120ms：掉帧时宁可整段放慢，也不跳过任何一段动画
    // （正常 20fps 以上时和真实时间完全一致）。
    let last = performance.now();
    let elapsed = 0;
    // 先让出一帧：把「远处机位 + 全透明地图」这一帧真的画出来，动画起点才看得见
    let warmup = 1;

    const step = (): void => {
      const now = performance.now();
      if (warmup > 0) {
        warmup -= 1;
        last = now;
        this.introFrame = requestAnimationFrame(step);
        return;
      }
      elapsed += Math.min(Math.max(now - last, 0), 120);
      last = now;

      // 相机推进
      const ct = Math.min(1, elapsed / cameraTween.duration);
      const ce = easeOutCirc(ct);
      if (this.camera) {
        this.camera.position.lerpVectors(start, end, ce);
      }

      // 厚度生长 + 淡入
      const gt = Math.min(1, Math.max(0, (elapsed - growTween.delay) / growTween.duration));
      const ge = easeOutQuad(gt);
      if (this.seriesGroup) {
        this.seriesGroup.scale.y = Math.max(0.0001, ge);
      }
      this.introOpacity = ge;
      this.fadeMaterials.forEach((material: any) => {
        material.uniforms.opacity.value = ge;
      });
      this.setDistrictLineOpacity(ge);
      this.setIntroLineOpacity(ge);
      // 地图长出来的同时把尾长从「一段光」拉回主题值，轮廓由「正在被画」过渡到「整圈亮边」
      this.trailLayer?.setTrailLength?.(introTrailTail + (trailTail - introTrailTail) * ge);
      // 淡入过半才恢复写深度，避免切太早闪一下暗块
      this.applyDepthWrite(ge > 0.06);

      if (elapsed < growTween.delay + growTween.duration) {
        this.introFrame = requestAnimationFrame(step);
      } else {
        if (this.seriesGroup) this.seriesGroup.scale.set(1, 1, 1);
        this.introOpacity = 1;
        this.fadeMaterials.forEach((material: any) => {
          material.uniforms.opacity.value = 1;
        });
        this.applyDepthWrite(true);
        if (this.conesLayer) this.conesLayer.object.visible = true;
        this.setDistrictLabelVisible(true);
        this.setDistrictLineOpacity(1);
        this.setIntroLineOpacity(1);
        this.trailLayer?.setTrailLength?.(trailTail);
        this.introDone = true;
        // 地图彻底长完、透明度回满：外面（大屏页面）可以开始第二段进场了
        this.emit("intro-end");
        this.introFrame = null;
      }
    };
    this.introFrame = requestAnimationFrame(step);
  }

  /**
   * 设置基础环境元素（网格、底图）。
   */
  setFoundation(options: ThreeMapOptions): void {
    const grid = options.grid;
    const foundation = options.foundation;
    if (grid.show) {
      const gridIns = drawGrid.call(this, grid);
      gridIns && this.environmentGroup.add(gridIns);
    }
    if (foundation && foundation.show) {
      const foundationIns = drawFoundation.call(this, foundation, options.config);
      foundationIns && this.environmentGroup.add(foundationIns);
      this.foundationIns = [foundationIns];
    }
  }

  /**
   * 注册地图
   */
  registerMap(code = "100000", registerCode: string, config: ThreeMapOptions["config"]): Promise<GeoJsonFeatureCollection> {
    code = code.toString();
    registerCode = registerCode.toString();
    return register(code).then(([boundary, full]) => {
      let center = centerOfMass(boundary.features[0]!).geometry.coordinates;
      let scale = 10;

      if (boundary.features[0]) {
        if (config.autoScale) {
          let box = bbox(boundary.features[0]);
          if (code == "100000") {
            box = bbox(featureCollection(full.features));
          }

          const { innerHeight, innerWidth } = this;
          const latDelta = Math.abs(box[1] - box[3]);
          const latProperty = innerHeight / latDelta;

          const lngDelta = Math.abs(box[0] - box[2]);
          const lngProperty = innerWidth / lngDelta;
          const ratio = 550 / Math.max(innerHeight, innerWidth);
          scale = Math.floor(Math.min(lngProperty, latProperty)) * ratio * (config.autoScaleFactor || 1);
        } else {
          scale = config.scale;
        }
      }

      const projection = geoMercator().center(center).scale(scale).translate([0, 0]);
      this.registerList.set(registerCode, [boundary, full, projection]);
      return full;
    });
  }

  /**
   * 灯光对齐 demo：环境光提亮整体 + 一盏斜上方平行光塑造顶面/侧面的明暗层次。
   * 顶面是贴图材质（MeshStandardMaterial 风格着色），光一多就会把浮雕和轮廓光冲淡，
   * 所以故意只留两盏。
   */
  setLight(): THREE.Light[] {
    const ambient = new THREE.AmbientLight(0xffffff, 2);
    const dir = new THREE.DirectionalLight(0xffffff, 10);
    dir.position.set(0, 50, -50);

    this.scene!.add(ambient);
    this.scene!.add(dir);

    return [ambient, dir];
  }

  /**
   * 初始化透视相机默认位置。
   */
  initCamera(): void {
    this.camera = new THREE.PerspectiveCamera(70, this.innerWidth / this.innerHeight, 0.1, 1000);
    this.camera.position.set(1, 5, 5);
    this.camera.lookAt(0, 0, 0);
    // 第 1 层专供「不该进镜面倒影的细亮线」（边缘流光、轮廓描线）。
    // 主相机要看得见它们；镜面用的虚拟相机保持默认（只看第 0 层），
    // 于是倒影里天然不会有这些线 —— 见 render() 里的说明。
    this.camera.layers.enable(1);
  }

  /**
   * 应用机位：方向取 options.camera（就是观测角度），
   * 距离 = 地图宽 × CAMERA_DISTANCE_RATIO ÷ config.mapSize。
   *
   * 机位一变，飞线/跑光的线宽补偿基准也要跟着变，否则放大后线会被拉粗、缩小后细到看不见。
   * @param force 强制重设（换地图后地图宽变了，即使配置没动也得重算）
   */
  applyCamera(options: ThreeMapOptions, force = false): void {
    const key = `${options.camera.x}|${options.camera.y}|${options.camera.z}|${options.config.mapSize}`;
    if (!force && key === this.lastCameraKey) return;
    this.lastCameraKey = key;

    this.setCamera(options.camera.x, options.camera.y, options.camera.z, options.config.mapSize);
    if (!this.camera) return;

    const prevRefDistance = this.refDistance;
    this.refDistance = this.camera.position.length() * 1.2153;
    if (this.refDistance === prevRefDistance) return;

    // 已建好的飞线/跑光材质把基准量抬在 uniform 里，得一起刷新
    this.scene?.traverse((obj: any) => {
      const uniforms = obj.material?.uniforms;
      if (uniforms?.uRefDistance) uniforms.uRefDistance.value = this.refDistance;
    });
  }

  /**
   * 设置相机位置。
   *
   * options.camera 只当方向用：真正的距离由地图宽度决定（demo: 11.52 / 15.009 = 0.7675），
   * 再除上 mapSize（面板里的「地图尺寸」）做整体缩放。
   * 这样换地图、换容器，构图永远是同一个视角，尺寸只跟着 mapSize 走。
   */
  setCamera(x: number, y: number, z: number, mapSize = 1): void {
    if (!this.camera) return;
    const dir = new THREE.Vector3(x, y, z);
    if (dir.lengthSq() < 1e-6) dir.set(0.1, 0.9, 0.45);
    // mapSize 夹在 0.4~2.5：太小相机贴到地图里，太大地图缩成一个点
    const size = Math.min(2.5, Math.max(0.4, mapSize || 1));
    dir.normalize().multiplyScalar((this.mapWorldWidth * CAMERA_DISTANCE_RATIO) / size);
    this.camera.position.copy(dir);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * 获取当前相机位置。
   */
  getCamera(): THREE.Vector3 | undefined {
    if (this.camera) {
      return this.camera.position;
    }
  }

  /**
   * 初始化 WebGLRenderer 并挂载到容器。
   */
  setRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });

    this.renderer.setSize(this.innerWidth, this.innerHeight);
    this.renderer.shadowMap.enabled = true;
    (this.renderer as any).shadowMapSoft = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setAnimationLoop(this.animate.bind(this));
    this.renderer.setClearAlpha(0);
    this.el.appendChild(this.renderer.domElement);
  }

  /**
   * 初始化 CSS2DRenderer，用于标签层渲染。
   */
  setCssRenderer(): void {
    this.CSS2DRenderer = new CSS2DRenderer();
    this.CSS2DRenderer.setSize(this.innerWidth, this.innerHeight);
    this.CSS2DRenderer.domElement.style.position = "absolute";
    this.CSS2DRenderer.domElement.style.top = "0px";
    this.el.appendChild(this.CSS2DRenderer.domElement);
  }

  /**
   * three.js 动画循环入口。
   */
  animate(): void {
    this.render();
  }

  /**
   * 冻结/解冻 time 型动画（调试用，见 frozen 字段）。
   */
  setFrozen(value: boolean): void {
    this.frozen = value;
  }

  /**
   * 每帧渲染：更新控制器、飞线/散点动画、辉光后处理与交互状态。
   */
  render(): void {
    const { controls, pointer, camera, raycaster, scene, bloomComposer, finalComposer } = this;
    if (!controls || !pointer || !camera || !raycaster || !scene) return;

    const delta = this.clock ? Math.min(this.clock.getDelta(), 0.1) : 0.016;

    controls.update();
    raycaster.setFromCamera(pointer, camera);

    if (!this.frozen) {
      // 飞线流光
      const flightGroup = this.seriesGroup.children.filter((it: any) => it._category === "flight");
      updateMiniFly(flightGroup as any, delta);

      // 场景层（地面光圈自转 / 光柱漂移）
      this.sceneLayers.forEach((layer) => layer.update(delta));

      // 边缘流光：它由面板开关随时重建，没走 sceneLayers，
      // 必须在这里单独推进 time —— 否则那道光只是静静躺在轮廓上，不会「流」。
      this.trailLayer?.update(delta);

      // 散点涟漪
      this.foundationIns.forEach((mesh: any) => {
        mesh && (mesh.rotation.z -= mesh._speed || 0.003);
      });
    }

    // 区县顶面/侧面时间推进 + 悬浮抬升插值（冻结时只停时间，抬升照常）
    districtAnimate.call(this as any, this.frozen ? 0 : delta);

    const scatterGroup = this.seriesGroup.children.filter((it: any) => it._category === "scatter");
    scatterGroup.forEach((group) => {
      group.children.forEach((mesh: any) => {
        const ring = mesh.children[0];
        if (ring) {
          ring._scale += 0.01;
          ring.scale.set(1 * ring._scale, 1 * ring._scale, 1 * ring._scale);
          if (ring._scale <= 2) {
            ring.material.opacity = 2 - ring._scale;
          } else {
            ring._scale = 1;
          }
        }
      });
    });

    // 镜面反射必须在主渲染之前把场景渲到离屏纹理
    if (this.mirrorHandle && this.renderer) {
      // 倒影里排除边缘流光。
      //
      // 地图是悬浮在镜面上方的（seriesGroup.position.y ≈ 地图宽 1.3%），
      // 任何有高度的物体在倒影里都会相对本体向外「扩散」一点 —— 地图本体是一块面，
      // 多点少点看不出来；但流光只有几个像素宽又很亮，倒影里那条线会明显跑到
      // 轮廓之外的空白处，看着就像「流光没沿着地图边缘」（本体其实是贴合的）。
      // 所以只让本体有这道光，倒影里不要。
      const trailObject: THREE.Object3D | undefined = this.trailLayer?.object;
      // 轮廓描线（outLineStyle.show）是同一类东西：细、亮、有高度 → 倒影同样会飘出去
      const hairLines: THREE.Object3D[] = [];
      if (trailObject) hairLines.push(trailObject);
      this.seriesGroup?.children.forEach((child: any) => {
        if (child?._category === "outline") hairLines.push(child);
      });

      const prevVisible = hairLines.map((obj) => obj.visible);
      hairLines.forEach((obj) => (obj.visible = false));
      this.mirrorHandle.render(this.renderer, scene, camera);
      hairLines.forEach((obj, i) => (obj.visible = prevVisible[i]!));
    }

    if (bloomComposer) {
      // 保留旧辉光路径：先只画自发光体求 bloom，再整场渲染 + 叠加
      const { cacheDarkMaterials, cacheMaterials } = this;
      scene.traverse((mesh: any) => {
        if (mesh instanceof THREE.Scene) {
          cacheDarkMaterials.scene = mesh.background;
          mesh.background = null;
        }
        const material = mesh.material;
        // _skipBloomDarken：带自定义 uniform / onBeforeCompile 注入的材质不能这样替换，
        // 换出来的实例缺 uniform，渲染时直接抛错（见 drawMirror 的说明）
        if (material && !mesh._isGlow && material.type != "ShaderMaterial" && mesh._skipBloomDarken !== true) {
          cacheMaterials[mesh.uuid] = material;
          if (!cacheDarkMaterials[material.type]) {
            const Proto = Object.getPrototypeOf(material).constructor;
            cacheDarkMaterials[material.type] = new Proto({ color: 0x000000 });
          }
          mesh.material = cacheDarkMaterials[material.type];
        }
      });
      bloomComposer.render();
      scene.traverse((mesh: any) => {
        if (cacheMaterials[mesh.uuid]) {
          mesh.material = cacheMaterials[mesh.uuid];
          delete cacheMaterials[mesh.uuid];
        }
        if (mesh instanceof THREE.Scene) {
          mesh.background = cacheMaterials.scene;
          delete cacheMaterials.scene;
        }
      });
      finalComposer && finalComposer.render();
    } else if (this.renderer) {
      this.renderer.render(scene, camera);
    }

    this.CSS2DRenderer && this.CSS2DRenderer.render(scene, camera);

    districtRender.call(this as any);
    tooltipRender.call(this as any);
  }

  /**
   * 绘制行政区边界与电子围栏。
   */
  drawDistrictOutline(features: GeoJsonFeatureCollection["features"], options: ThreeMapOptions): void {
    const { outline, drawWall, wallTexture } = drawOutline.call(this as any, features, options, options.config);
    (outline as any)._category = 'outline';
    outline.visible = options.outLineStyle.show !== false;
    this.seriesGroup.add(outline);
    this.mapTextures.push(wallTexture);
    drawWall().then((group) => {
      this.seriesGroup && this.seriesGroup.add(group);
      // 围栏墙体是异步建的，入场跑到一半才加进来：立刻对齐当前进度
      this.collectIntroLineMaterials(group);
    });
  }

  /**
   * 绘制行政区主体（顶面/侧面/标签）并维护缩放缓存模型。
   */
  drawDistrictArea(data: ThreeMapOptions["data"], features: GeoJsonFeatureCollection["features"], options: ThreeMapOptions): void {
    const { meshGroup, advanceMeshGroup, districtData, surfaceMaterials, shiftMaterials, _realShape, _cancelRealShape } = drawDistrict.call(this as any, data, options, features, options.config);
    this._cancelRealShape = _cancelRealShape;
    this.districtData = districtData;
    this.surfaceMaterials = surfaceMaterials;
    this.shiftMaterials = shiftMaterials;

    if (!this.refresh) {
      advanceMeshGroup.scale.set(this.scale, 1, this.scale);
      const scaledBox = new THREE.Box3().setFromObject(advanceMeshGroup);
      advanceMeshGroup.scale.set(1, 1, 1);
      const center = new THREE.Vector3();
      scaledBox.getCenter(center);
      this.seriesGroup.position.sub(center);
      this.seriesGroup.scale.set(this.scale, 1, this.scale);

      this.seriesGroup.add(advanceMeshGroup);
      this.seriesGroup.add(meshGroup);
    } else {
      this.seriesGroup.add(advanceMeshGroup);
      this.seriesGroup.add(meshGroup);
    }

    const mapKey = this.mapKey;
    _realShape().then((group) => {
      this.seriesGroup.remove(advanceMeshGroup);

      if (mapKey != this.mapKey) return false;

      const res = group.children;
      this.seriesGroup.add(group);

      if (this.refresh) {
        const modelBox = new THREE.Box3();
        res.forEach((district) => {
          const itemBox = new THREE.Box3().setFromObject(district);
          modelBox.union(itemBox);
        });
        this.cacheModel!.modelBox = modelBox;
      }
      const modelBox = this.cacheModel!.modelBox!;
      const modelScale: { code: string | number; scale: number }[] = [];
      res.forEach((item: any) => {
        // group 的子节点现在是「区县载体 cell」，真正的 mesh 在 cell 里面
        const district = item._type === 'district' ? item : item.children?.find((c: any) => c?._type === 'district');
        if (!district) return;
        const code = district._privateData?.adcode;
        const model = item.clone();
        model.scale.set(1, 1, 1);
        const currentModel = new THREE.Box3().setFromObject(model);
        const widthA = modelBox.max.x - modelBox.min.x;
        const heightA = modelBox.max.z - modelBox.min.z;
        const widthB = currentModel.max.x - currentModel.min.x;
        const heightB = currentModel.max.z - currentModel.min.z;
        const widthRatio = widthA / widthB;
        const heightRatio = heightA / heightB;
        const scaleVal = (widthRatio + heightRatio) / 2;
        modelScale.push({ code, scale: scaleVal });
      });
      this.cacheModel!.modelScale.push(...modelScale);
    });
  }

  /**
   * 构建 tooltip 实例并挂到当前地图上下文。
   */
  addTooltipLayer(): void {
    const tooltip = addTooltip.call(this as any, this.options!.tooltip);
    if (tooltip) {
      this.tooltip = tooltip;
      this.tooltip._hide();
    } else {
      this.tooltip = null;
    }
  }

  /**
   * 添加 marker 系列图层。
   */
  addMarkerLayer(options: MarkerSeriesOptions): void {
    const config = this.options!.config;
    const markerGroup = drawMarker.call(this as any, options, config);
    (markerGroup as any)._seriesId = this.getSeriesId(options);
    this.seriesGroup.add(markerGroup);
  }

  /**
   * 添加 prism 系列图层。
   */
  addPrismLayer(options: PrismSeriesOptions): void {
    const config = this.options!.config;
    const prismsGroup = drawPrism.call(this as any, options, config);
    (prismsGroup as any)._seriesId = this.getSeriesId(options);
    this.seriesGroup.add(prismsGroup);
  }

  /**
   * 添加 flight 系列图层。
   */
  addLinkLayer(options: FlightSeriesOptions): void {
    const config = this.options!.config;
    const group = drawFlight.call(this as any, options, config);
    (group as any)._seriesId = this.getSeriesId(options);
    this.seriesGroup.add(group);
  }

  /**
   * 添加 cylinder 系列图层。
   */
  addCylinderLayer(options: CylinderSeriesOptions): void {
    const config = this.options!.config;
    const cylinderGroup = drawCylinder.call(this as any, options, config);
    (cylinderGroup as any)._seriesId = this.getSeriesId(options);
    this.seriesGroup.add(cylinderGroup);
  }

  /**
   * 添加 scatter 系列图层。
   */
  addSCatterLayer(options: ScatterSeriesOptions): void {
    const config = this.options!.config;
    const scatterGroup = drawScatter.call(this as any, options, config);
    (scatterGroup as any)._seriesId = this.getSeriesId(options);
    this.seriesGroup.add(scatterGroup);
  }

  /**
   * 销毁地图实例及所有三维资源，释放监听器与 GPU 内存。
   */
  destroyMap(): void {
    if (this.el) {
      this.el.removeEventListener("mousemove", this.onPointerMove);
      this.el.removeEventListener("mousedown", this.onPointerClick);
      this.el.removeEventListener("dblclick", this.onDblClick);
    }

    if (Array.isArray(this.mapTextures)) {
      this.mapTextures.forEach((texture) => texture?.dispose && texture.dispose());
      this.mapTextures = [];
    }

    this.lights.forEach((light) => {
      this.scene!.remove(light);
    });
    this.lights = [];

    // 入场动画帧
    if (this.introFrame) {
      cancelAnimationFrame(this.introFrame);
      this.introFrame = null;
    }

    // 场景层（光圈/光柱/跑光）与镜面离屏资源
    this.sceneLayers.forEach((layer) => layer.dispose());
    this.sceneLayers = [];
    if (this.mirrorHandle) {
      this.mirrorHandle.dispose();
      this.mirrorHandle = null;
    }
    this.conesLayer = null;
    this.fadeMaterials = [];
    this.surfaceMaterials = [];
    this.shiftMaterials = [];
    this.districtCells = [];

    this.clearMap();
    this.cacheModel = null;

    const cleanObject = (object: any): void => {
      if (!object) return;
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((m: THREE.Material) => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    };

    if (this.scene) {
      this.scene.traverse(cleanObject);
      this.scene.clear();
      this.scene = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.renderer) {
      this.el.removeChild(this.renderer.domElement);
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer = null;
    }

    if (this.CSS2DRenderer) {
      this.el.removeChild(this.CSS2DRenderer.domElement);
      this.CSS2DRenderer = null;
    }
    (["bloomComposer", "finalComposer", "axesHelper", "controls"] as const).forEach((key) => {
      const obj = (this as any)[key];
      if (obj && typeof obj.dispose === "function") {
        obj.dispose();
      }
      (this as any)[key] = null;
    });

    this.seriesGroup = null as any;
    this.environmentGroup = null as any;
    this.cacheMaterials = {};
    this.cacheDarkMaterials = {};
    this.clock = null;
    this.raycaster = null;
    this.districtData = [];
    this.el = null as any;
    this.tooltipDom = null as any;
    this.camera = null;
    this.pointer = null;
  }

  /**
   * 清空当前地图图层并回收 mesh/material/texture 资源。
   */
  clearMap(): void {
    this.isClear = true;
    if (this._cancelRealShape) {
      this._cancelRealShape();
      this._cancelRealShape = null;
    }
    const disposeObject = (obj: any): void => {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m: any) => {
            m.map?.dispose();
            m.dispose?.();
          });
        } else {
          obj.material.map?.dispose();
          obj.material.dispose?.();
        }
      }
    };

    const environmentGroup = this.environmentGroup;
    environmentGroup.traverse(disposeObject);
    if (environmentGroup.children.length) {
      environmentGroup.children = [];
    }
    const seriesGroup = this.seriesGroup;
    seriesGroup.traverse((obj: any) => {
      disposeObject(obj);
      if (["label", "marker", "prism", "scatter"].includes(obj._type)) {
        obj.element?.remove();
      }
    });
    if (seriesGroup.children.length) {
      seriesGroup.children = [];
    }

    this.foundationIns = [];
    this.scene!.remove(this.seriesGroup);
    this.scene!.remove(this.environmentGroup);
  }

  /**
   * 响应容器尺寸变化并同步渲染器与相机参数。
   */
  resize(): void {
    const el = this.el;
    this.innerWidth = el.offsetWidth;
    this.innerHeight = el.offsetHeight;
    this.renderer!.setSize(this.innerWidth, this.innerHeight);
    this.CSS2DRenderer!.setSize(this.innerWidth, this.innerHeight);
    this.camera!.aspect = this.innerWidth / this.innerHeight;
    this.camera!.updateProjectionMatrix();
  }

  /**
   * 添加坐标辅助器（默认长度为 0，可按需调试时放大）。
   */
  addHelper(): void {
    const axesHelper = new THREE.AxesHelper(0);
    axesHelper.layers.enableAll();
    this.axesHelper = axesHelper;
    this.scene!.add(axesHelper);
  }

  /**
   * 初始化轨道控制器并绑定相机变更事件。
   */
  setController(): void {
    const controls = new OrbitControls(this.camera!, this.el);
    controls.enableDamping = true;
    controls.maxPolarAngle = 1.2;
    controls.minPolarAngle = 0;
    controls.enablePan = false;
    this.controls = controls;

    this.controls.addEventListener("change", () => {
      const events = this.events["change"];
      events &&
        events.forEach((callback) => {
          callback(this.camera!);
        });
    });
  }

  /**
   * 取消事件监听。
   * @param eventName 传入事件名时仅取消该事件，否则清空全部事件。
   */
  off(eventName?: string): void {
    if (eventName) {
      Reflect.deleteProperty(this.events, eventName);
    } else {
      this.events = {};
    }
  }

  /**
   * 注册事件监听。
   */
  on(eventName: string, cb: (data: any) => void): void {
    if (this.events[eventName]) {
      this.events[eventName].push(cb);
    } else {
      this.events[eventName] = [cb];
    }
  }

  /**
   * 触发事件（目前只有入场动画结束的 intro-end：页面里两侧面板要等它之后再移入）。
   */
  emit(eventName: string, data?: any): void {
    const events = this.events[eventName];
    events && events.forEach((callback) => callback(data));
  }
}
