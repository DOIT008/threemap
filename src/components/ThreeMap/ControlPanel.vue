<script setup lang="ts">
import { ref, computed } from "vue";
import type { ThreeMapOptions } from "./types";

type SeriesType = "marker" | "flight" | "prism" | "scatter" | "cylinder";

const props = defineProps<{
  options: ThreeMapOptions;
  seriesTypeOptions: { name: SeriesType; value: string }[];
}>();

const emit = defineEmits<{
  apply: [];
  "add-series": [type: SeriesType];
  "remove-series": [index: number];
  "regenerate-series": [index: number];
  "generate-data": [];
  export: [];
}>();

const panelOpen = ref(true);
const basePanelOpen = ref(true);
const seriesPanelOpen = ref(true);
const rangePanelOpen = ref(false);
const surfacePanelOpen = ref(false);
const sidePanelOpen = ref(false);
const scenePanelOpen = ref(false);
const viewPanelOpen = ref(false);
const newSeriesType = ref<SeriesType>("marker");

const lineColorHex = computed({
  get: () => colorToHex(props.options.lineStyle.color),
  set: (hex: string) => {
    props.options.lineStyle.color = hex;
    emitApply();
  },
});

const outLineColorHex = computed({
  get: () => colorToHex(props.options.outLineStyle.color),
  set: (hex: string) => updateColorByHex("outLineColor", hex),
});

const wallColorHex = computed({
  get: () => colorToHex(props.options.wall.color),
  set: (hex: string) => updateColorByHex("wallColor", hex),
});

const surfaceMapColorHex = computed({
  get: () => colorToHex(props.options.surface.mapColor),
  set: (hex: string) => {
    props.options.surface.mapColor = hex;
    emitApply();
  },
});

const bgColorHex = computed({
  get: () => colorToHex(props.options.background.color),
  set: (hex: string) => {
    props.options.background.color = hex;
    emitApply();
  },
});

/**
 * 面板上的开关是「透明背景」，比「是否铺底色」更贴合使用场景；
 * 存进 options 的仍然是 background.show（show=false 即透明）。
 */
const bgTransparent = computed({
  get: () => !props.options.background.show,
  set: (value: boolean) => {
    props.options.background.show = !value;
    emitApply();
  },
});

const surfaceTintHex = computed({
  get: () => colorToHex(props.options.surface.tintColor),
  set: (hex: string) => {
    props.options.surface.tintColor = hex;
    emitApply();
  },
});

const sideBottomHex = computed({
  get: () => colorToHex(props.options.side.bottomColor),
  set: (hex: string) => {
    props.options.side.bottomColor = hex;
    emitApply();
  },
});

const sideTopHex = computed({
  get: () => colorToHex(props.options.side.topColor),
  set: (hex: string) => {
    props.options.side.topColor = hex;
    emitApply();
  },
});

const sideStripeHex = computed({
  get: () => colorToHex(props.options.side.stripeColor),
  set: (hex: string) => {
    props.options.side.stripeColor = hex;
    emitApply();
  },
});

const sideTintHex = computed({
  get: () => colorToHex(props.options.side.tintColor),
  set: (hex: string) => {
    props.options.side.tintColor = hex;
    emitApply();
  },
});

const emphasisTopColorHex = computed({
  get: () => colorToHex(props.options.emphasis.topColor),
  set: (hex: string) => updateColorByHex("emphasisTopColor", hex),
});

/**
 * 色阶是「按数值给每个区县上色」，只有纯色铺色模式才落得下颜色。
 * 图片贴图模式下每个区县采样的都是同一张路网图，色阶改了也看不见 ——
 * 所以打开色阶时顺手把纹理来源切到纯色，不然点了开关像是坏了。
 */
function onRangeShowChange(): void {
  if (props.options.itemStyle.range.show && props.options.surface.mapMode === "image") {
    props.options.surface.mapMode = "color";
  }
  emitApply();
}

function emitApply(): void {
  emit("apply");
}

function addSeriesFromPanel(): void {
  emit("add-series", newSeriesType.value);
}

function removeSeries(index: number): void {
  emit("remove-series", index);
}

function regenerateSeriesData(index: number): void {
  emit("regenerate-series", index);
}

/**
 * 机位面板：options.camera 存的是方向向量，面板上换成更好理解的观测角度。
 * 方位角 0° = 从正前方（+Z）看，俯仰角 90° = 正俯视。
 * 俯仰角受轨道控制器 maxPolarAngle 限制（约 21°~90°），这里夹到 22°~88° 防止被回弹。
 */
const CAMERA_ELEVATION_RANGE: [number, number] = [22, 88];

const cameraAngles = computed(() => {
  const { x, y, z } = props.options.camera;
  return {
    azimuth: ((Math.atan2(x, z) * 180) / Math.PI + 360) % 360,
    elevation: (Math.atan2(y, Math.hypot(x, z)) * 180) / Math.PI,
  };
});

const cameraAzimuth = computed(() => Math.round(cameraAngles.value.azimuth));
const cameraElevation = computed(() => Math.round(cameraAngles.value.elevation));

/** 把面板上的角度反算回 direction 向量：长度无所谓，setCamera 会归一化 */
function onCameraAngleChange(kind: "azimuth" | "elevation", event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;

  const [minElevation, maxElevation] = CAMERA_ELEVATION_RANGE;
  const azimuth = kind === "azimuth" ? value : cameraAngles.value.azimuth;
  const rawElevation = kind === "elevation" ? value : cameraAngles.value.elevation;
  const elevation = Math.min(maxElevation, Math.max(minElevation, rawElevation));

  const az = (azimuth * Math.PI) / 180;
  const el = (elevation * Math.PI) / 180;
  const cosEl = Math.cos(el);
  props.options.camera.x = Math.sin(az) * cosEl;
  props.options.camera.y = Math.sin(el);
  props.options.camera.z = Math.cos(az) * cosEl;
  emitApply();
}

function updateRangeColor(index: 0 | 1, hex: string): void {
  props.options.itemStyle.range.color[index] = hex;
  emitApply();
}

function updateRuleColor(index: number, hex: string): void {
  props.options.itemStyle.range.rules[index]!.color = hex;
  emitApply();
}

function addRule(): void {
  props.options.itemStyle.range.rules.push({ value: 0, color: "#27F4FF", label: ">=0" });
  emitApply();
}

function removeRule(index: number): void {
  props.options.itemStyle.range.rules.splice(index, 1);
  emitApply();
}

function generateData(): void {
  emit("generate-data");
}

function colorToHex(color: string): string {
  const parsed = parseColor(color);
  if (!parsed) return "#ffffff";
  return `#${toHex(parsed.r)}${toHex(parsed.g)}${toHex(parsed.b)}`;
}

function toHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, "0");
}

function parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
  const value = color.trim();
  if (value.startsWith("#")) {
    const hex = value.slice(1);
    if (hex.length === 3) {
      const rHex = hex.slice(0, 1);
      const gHex = hex.slice(1, 2);
      const bHex = hex.slice(2, 3);
      const r = parseInt(rHex + rHex, 16);
      const g = parseInt(gHex + gHex, 16);
      const b = parseInt(bHex + bHex, 16);
      return { r, g, b, a: 1 };
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b, a: 1 };
    }
    return null;
  }

  const match = value.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return null;
  const items = match[1]!.split(",").map((it) => it.trim());
  if (items.length < 3) return null;
  const r = Number(items[0]);
  const g = Number(items[1]);
  const b = Number(items[2]);
  const a = items[3] !== undefined ? Number(items[3]) : 1;
  if ([r, g, b, a].some((v) => Number.isNaN(v))) return null;
  return { r, g, b, a };
}

function updateColorByHex(target: "topColor" | "sideColor" | "uColor" | "outLineColor" | "wallColor" | "emphasisTopColor", hex: string): void {
  const parsed = parseColor(hex);
  if (!parsed) return;
  const alphaSource =
    target === "topColor"
      ? props.options.itemStyle.topColor
      : target === "sideColor"
        ? props.options.itemStyle.sideColor
        : target === "uColor"
          ? props.options.itemStyle.uColor
          : target === "outLineColor"
            ? props.options.outLineStyle.color
            : target === "wallColor"
              ? props.options.wall.color
              : props.options.emphasis.topColor;

  const alpha = parseColor(alphaSource)?.a ?? 1;
  const rgba = `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha})`;

  if (target === "topColor") {
    props.options.itemStyle.topColor = rgba;
  } else if (target === "sideColor") {
    props.options.itemStyle.sideColor = rgba;
  } else if (target === "uColor") {
    props.options.itemStyle.uColor = rgba;
  } else if (target === "outLineColor") {
    props.options.outLineStyle.color = rgba;
  } else if (target === "wallColor") {
    props.options.wall.color = rgba;
  } else {
    props.options.emphasis.topColor = rgba;
  }

  emitApply();
}
</script>

<template>
  <div class="three-control-panel">
    <div class="three-control-header">
      <span>控制面板</span>
      <div class="three-control-actions">
        <button class="three-btn" title="把当前视觉配置导出为 TS 主题文件，项目里直接传给 <ThreeMap :option>" @click="emit('export')">导出配置</button>
        <button class="three-btn" @click="panelOpen = !panelOpen">{{ panelOpen ? "收起" : "展开" }}</button>
      </div>
    </div>
    <div v-if="panelOpen" class="three-control-body">
      <div class="panel-group">
        <button class="panel-group-header" @click="basePanelOpen = !basePanelOpen">
          <span>基础设置</span>
          <span>{{ basePanelOpen ? "-" : "+" }}</span>
        </button>
        <div v-if="basePanelOpen" class="panel-group-body">
          <div class="panel-item">
            <span class="panel-label">区域边线:</span>
            <div class="color-input-group">
              <input type="color" v-model="lineColorHex" />
            </div>
          </div>
          <div class="panel-item">
            <span class="panel-label">边界颜色:</span>
            <div class="color-input-group">
              <input type="color" v-model="outLineColorHex" />
            </div>
          </div>
          <div class="panel-item toggle">
            <span class="panel-label">轮廓描线:</span>
            <input type="checkbox" v-model="props.options.outLineStyle.show" @change="emitApply" />
          </div>
          <div class="panel-item toggle">
            <span class="panel-label">边缘流光:</span>
            <input type="checkbox" v-model="props.options.scene.trail" @change="emitApply" />
          </div>
          <div class="panel-item" :class="{ 'is-disabled': !props.options.scene.trail }">
            <span class="panel-label">流光速度:</span>
            <input
              class="number-input"
              type="number"
              min="1"
              max="60"
              step="1"
              title="跑完整圈所需秒数，越小越快"
              :disabled="!props.options.scene.trail"
              v-model.number="props.options.scene.trailSpeed"
              @change="emitApply"
            />
          </div>
          <div class="panel-item" :class="{ 'is-disabled': !props.options.scene.trail }">
            <span class="panel-label">流光尾长:</span>
            <input
              class="number-input"
              type="number"
              min="0.03"
              max="1"
              step="0.05"
              title="拖尾占整圈的比例，越大尾巴越长"
              :disabled="!props.options.scene.trail"
              v-model.number="props.options.scene.trailLength"
              @change="emitApply"
            />
          </div>
          <div class="panel-item" :class="{ 'is-disabled': !props.options.scene.trail }">
            <span class="panel-label">流光亮度:</span>
            <input
              class="number-input"
              type="number"
              min="0.1"
              max="4"
              step="0.1"
              title="亮度倍率，1 为默认"
              :disabled="!props.options.scene.trail"
              v-model.number="props.options.scene.trailBrightness"
              @change="emitApply"
            />
          </div>
          <div class="panel-item">
            <span class="panel-label">地图深度:</span>
            <input class="number-input" type="number" v-model.number="props.options.config.depth" @change="emitApply" />
          </div>
          <div class="panel-item toggle">
            <span class="panel-label">透明背景:</span>
            <input
              type="checkbox"
              title="打开后画布不铺底色，页面/大屏背景直接透出；关掉则用下面的颜色铺底"
              v-model="bgTransparent"
            />
          </div>
          <div v-if="!bgTransparent" class="panel-item">
            <span class="panel-label">背景颜色:</span>
            <div class="color-input-group">
              <input type="color" v-model="bgColorHex" />
            </div>
          </div>
          <div class="panel-item toggle">
            <span class="panel-label">开启镜面:</span>
            <input type="checkbox" v-model="props.options.mirror.show" @change="emitApply" />
          </div>
          <div v-if="props.options.mirror.show" class="panel-item">
            <span class="panel-label">倒影透明度:</span>
            <input
              class="number-input"
              type="number"
              min="0"
              max="1"
              step="0.05"
              title="1 = 倒影最实；越小倒影越淡；0 = 倒影完全消失（地图本体不受影响）"
              v-model.number="props.options.mirror.opacity"
              @change="emitApply"
            />
          </div>
          <div class="panel-item toggle">
            <span class="panel-label">地区名称:</span>
            <input type="checkbox" v-model="props.options.label.show" @change="emitApply" />
          </div>
          <div class="panel-item toggle">
            <span class="panel-label">悬浮效果:</span>
            <input type="checkbox" v-model="props.options.emphasis.show" @change="emitApply" />
          </div>
          <div v-if="props.options.emphasis.show" class="panel-item">
            <span class="panel-label">悬浮颜色:</span>
            <div class="color-input-group">
              <input type="color" v-model="emphasisTopColorHex" />
            </div>
          </div>
          <div class="panel-item toggle">
            <span class="panel-label">开启旋转:</span>
            <input type="checkbox" v-model="props.options.autoRotate.autoRotate" @change="emitApply" />
          </div>
          <div class="panel-item toggle">
            <span class="panel-label">开启网格:</span>
            <input type="checkbox" v-model="props.options.grid.show" @change="emitApply" />
          </div>
          <div class="panel-item toggle">
            <span class="panel-label">开启底图:</span>
            <input type="checkbox" v-model="props.options.foundation.show" @change="emitApply" />
          </div>
          <div class="panel-item toggle">
            <span class="panel-label">电子围栏:</span>
            <input type="checkbox" v-model="props.options.wall.show" @change="emitApply" />
          </div>
          <div v-if="props.options.wall.show" class="panel-item">
            <span class="panel-label">围栏高度:</span>
            <input class="number-input" type="number" v-model.number="props.options.wall.height" @change="emitApply" />
          </div>
          <div v-if="props.options.wall.show" class="panel-item">
            <span class="panel-label">围栏颜色:</span>
            <div class="color-input-group">
              <input type="color" v-model="wallColorHex" />
            </div>
          </div>
        </div>
      </div>

      <div class="panel-group">
        <button class="panel-group-header" @click="surfacePanelOpen = !surfacePanelOpen">
          <span>顶面材质</span>
          <span>{{ surfacePanelOpen ? "-" : "+" }}</span>
        </button>
        <div v-if="surfacePanelOpen" class="panel-group-body">
          <div class="panel-item">
            <span class="panel-label">纹理来源:</span>
            <select class="range-select" v-model="props.options.surface.mapMode" @change="emitApply">
              <option value="image">图片贴图</option>
              <option value="color">纯色铺色</option>
            </select>
          </div>
          <div v-if="props.options.surface.mapMode === 'color'" class="panel-item">
            <span class="panel-label">纯色铺色:</span>
            <div class="color-input-group">
              <input type="color" v-model="surfaceMapColorHex" />
            </div>
          </div>
          <div v-if="props.options.surface.mapMode === 'image'" class="panel-item">
            <span class="panel-label">染色色相:</span>
            <div class="color-input-group">
              <input type="color" v-model="surfaceTintHex" />
            </div>
          </div>
          <div v-if="props.options.surface.mapMode === 'image'" class="panel-item">
            <span class="panel-label">染色强度:</span>
            <input class="number-input" type="number" min="0" max="1" step="0.05" v-model.number="props.options.surface.tintStrength" @change="emitApply" />
          </div>
          <div class="panel-item toggle">
            <span class="panel-label">法线浮雕:</span>
            <input type="checkbox" v-model="props.options.surface.normalMap" @change="emitApply" />
          </div>
          <div class="panel-item">
            <span class="panel-label">浮雕强度:</span>
            <input class="number-input" type="number" min="0" max="2" step="0.05" v-model.number="props.options.surface.reliefStrength" @change="emitApply" />
          </div>
          <div class="panel-item toggle">
            <span class="panel-label">轮廓光:</span>
            <input type="checkbox" v-model="props.options.surface.edgeGlow" @change="emitApply" />
          </div>
          <div class="panel-item">
            <span class="panel-label">光带强度:</span>
            <input class="number-input" type="number" min="0" max="2" step="0.1" v-model.number="props.options.surface.glowLevel" @change="emitApply" />
          </div>
          <div class="panel-item">
            <span class="panel-label">中心压暗:</span>
            <input class="number-input" type="number" min="0" max="1" step="0.02" v-model.number="props.options.surface.centerDark" @change="emitApply" />
          </div>
        </div>
      </div>

      <div class="panel-group">
        <button class="panel-group-header" @click="sidePanelOpen = !sidePanelOpen">
          <span>侧面水晶</span>
          <span>{{ sidePanelOpen ? "-" : "+" }}</span>
        </button>
        <div v-if="sidePanelOpen" class="panel-group-body">
          <div class="panel-item">
            <span class="panel-label">底部颜色:</span>
            <div class="color-input-group">
              <input type="color" v-model="sideBottomHex" />
            </div>
          </div>
          <div class="panel-item">
            <span class="panel-label">顶部颜色:</span>
            <div class="color-input-group">
              <input type="color" v-model="sideTopHex" />
            </div>
          </div>
          <div class="panel-item">
            <span class="panel-label">条纹高光:</span>
            <div class="color-input-group">
              <input type="color" v-model="sideStripeHex" />
            </div>
          </div>
          <div class="panel-item">
            <span class="panel-label">条纹密度:</span>
            <input class="number-input" type="number" min="0" max="20" step="0.2" v-model.number="props.options.side.stripeScale" @change="emitApply" />
          </div>
          <div class="panel-item">
            <span class="panel-label">条纹强度:</span>
            <input class="number-input" type="number" min="0" max="1" step="0.02" v-model.number="props.options.side.stripeStrength" @change="emitApply" />
          </div>
          <div class="panel-item">
            <span class="panel-label">染色色相:</span>
            <div class="color-input-group">
              <input type="color" v-model="sideTintHex" />
            </div>
          </div>
          <div class="panel-item">
            <span class="panel-label">染色强度:</span>
            <input class="number-input" type="number" min="0" max="1" step="0.05" v-model.number="props.options.side.tintStrength" @change="emitApply" />
          </div>
          <div class="panel-item">
            <span class="panel-label">侧面透明度:</span>
            <input
              class="number-input"
              type="number"
              min="0"
              max="1"
              step="0.05"
              title="1 = 整面实心，不会透出背后的墙；越小越透，底部比顶部先透；0 = 侧面完全消失"
              v-model.number="props.options.side.opacity"
              @change="emitApply"
            />
          </div>
        </div>
      </div>

      <div class="panel-group">
        <button class="panel-group-header" @click="viewPanelOpen = !viewPanelOpen">
          <span>视角与尺寸</span>
          <span>{{ viewPanelOpen ? "-" : "+" }}</span>
        </button>
        <div v-if="viewPanelOpen" class="panel-group-body">
          <div class="panel-item">
            <span class="panel-label">方位角:</span>
            <input
              class="number-input"
              type="number"
              min="0"
              max="360"
              step="1"
              title="绕竖轴转：0° 从正前方看，90° 从右侧看"
              :value="cameraAzimuth"
              @change="onCameraAngleChange('azimuth', $event)"
            />
          </div>
          <div class="panel-item">
            <span class="panel-label">俯仰角:</span>
            <input
              class="number-input"
              type="number"
              min="22"
              max="88"
              step="1"
              title="22° 接近平视，88° 接近正俯视（受轨道控制器 maxPolarAngle 限制）"
              :value="cameraElevation"
              @change="onCameraAngleChange('elevation', $event)"
            />
          </div>
          <div class="panel-item">
            <span class="panel-label">地图尺寸:</span>
            <input
              class="number-input"
              type="number"
              min="0.4"
              max="2.5"
              step="0.05"
              title="地图在画面里的缩放倍率：1 为默认，越大越近"
              v-model.number="props.options.config.mapSize"
              @change="emitApply"
            />
          </div>
        </div>
      </div>

      <div class="panel-group">
        <button class="panel-group-header" @click="scenePanelOpen = !scenePanelOpen">
          <span>场景特效</span>
          <span>{{ scenePanelOpen ? "-" : "+" }}</span>
        </button>
        <div v-if="scenePanelOpen" class="panel-group-body">
          <div class="panel-item toggle">
            <span class="panel-label">地面光圈:</span>
            <input type="checkbox" v-model="props.options.scene.groundRing" @change="emitApply" />
          </div>
          <div class="panel-item" :class="{ 'is-disabled': !props.options.scene.groundRing }">
            <span class="panel-label">光圈缩放:</span>
            <input
              class="number-input"
              type="number"
              min="0.3"
              max="3"
              step="0.05"
              title="装饰圆环底图的独立缩放：1 = 默认（约 1.07 倍地图宽），与地图尺寸互不影响"
              :disabled="!props.options.scene.groundRing"
              v-model.number="props.options.scene.groundRingScale"
              @change="emitApply"
            />
          </div>
          <div class="panel-item toggle">
            <span class="panel-label">漂浮光柱:</span>
            <input type="checkbox" v-model="props.options.scene.beams" @change="emitApply" />
          </div>
          <div class="panel-item toggle">
            <span class="panel-label">区县标点:</span>
            <input type="checkbox" v-model="props.options.scene.cones" @change="emitApply" />
          </div>
          <div class="panel-item toggle">
            <span class="panel-label">入场动画:</span>
            <input type="checkbox" v-model="props.options.scene.intro" @change="emitApply" />
          </div>
          <div class="panel-item toggle">
            <span class="panel-label">环境辉光:</span>
            <input type="checkbox" v-model="props.options.glow.show" @change="emitApply" />
          </div>
        </div>
      </div>

      <div class="panel-group">
        <button class="panel-group-header" @click="rangePanelOpen = !rangePanelOpen">
          <span>色阶图</span>
          <span>{{ rangePanelOpen ? "-" : "+" }}</span>
        </button>
        <div v-if="rangePanelOpen" class="panel-group-body">
          <div class="panel-item toggle">
            <span class="panel-label">显示色阶:</span>
            <input type="checkbox" v-model="props.options.itemStyle.range.show" @change="onRangeShowChange" />
          </div>
          <div class="panel-item">
            <span class="panel-label">映射模式:</span>
            <select class="range-select" v-model="props.options.itemStyle.range.mode" @change="emitApply">
              <option value="range">连续渐变</option>
              <option value="separate">分段规则</option>
            </select>
          </div>
          <template v-if="props.options.itemStyle.range.mode === 'range'">
            <div class="panel-item">
              <span class="panel-label">渐变起色:</span>
              <div class="color-input-group">
                <input type="color" :value="props.options.itemStyle.range.color[0]" @input="updateRangeColor(0, ($event.target as HTMLInputElement).value)" />
              </div>
            </div>
            <div class="panel-item">
              <span class="panel-label">渐变终色:</span>
              <div class="color-input-group">
                <input type="color" :value="props.options.itemStyle.range.color[1]" @input="updateRangeColor(1, ($event.target as HTMLInputElement).value)" />
              </div>
            </div>
            <div class="panel-item">
              <span class="panel-label">最小值:</span>
              <input class="number-input" type="number" v-model.number="props.options.itemStyle.range.min" @change="emitApply" />
            </div>
            <div class="panel-item">
              <span class="panel-label">最大值:</span>
              <input class="number-input" type="number" v-model.number="props.options.itemStyle.range.max" @change="emitApply" />
            </div>
            <div class="panel-item">
              <span class="panel-label">高值标签:</span>
              <input class="text-input" type="text" v-model="props.options.itemStyle.range.visualMap.maxText" @change="emitApply" />
            </div>
            <div class="panel-item">
              <span class="panel-label">低值标签:</span>
              <input class="text-input" type="text" v-model="props.options.itemStyle.range.visualMap.minText" @change="emitApply" />
            </div>
          </template>
          <template v-else-if="props.options.itemStyle.range.mode === 'separate'">
            <div class="range-rules">
              <div class="range-rule-item" v-for="(rule, ri) in props.options.itemStyle.range.rules" :key="ri">
                <input class="number-input" type="number" v-model.number="rule.value" @change="emitApply" placeholder="阈值" />
                <input type="color" :value="rule.color" @input="updateRuleColor(ri, ($event.target as HTMLInputElement).value)" />
                <input class="text-input" type="text" v-model="rule.label" @change="emitApply" placeholder="标签" />
                <button class="three-btn danger" @click="removeRule(ri)">-</button>
              </div>
            </div>
            <button class="three-btn" @click="addRule">+ 新增规则</button>
          </template>
          <button class="three-btn full-btn" @click="generateData">生成数据</button>
        </div>
      </div>

      <div class="panel-group">
        <button class="panel-group-header" @click="seriesPanelOpen = !seriesPanelOpen">
          <span>Series 设置</span>
          <span>{{ seriesPanelOpen ? "-" : "+" }}</span>
        </button>
        <div v-if="seriesPanelOpen" class="panel-group-body">
          <div class="three-control-row">
            <label>新增 series</label>
            <div class="three-inline">
              <select v-model="newSeriesType">
                <option v-for="(option, index) in props.seriesTypeOptions" :key="index" :value="option.name">{{ option.value }}</option>
              </select>
              <button class="three-btn" @click="addSeriesFromPanel">添加</button>
            </div>
          </div>
          <div class="three-series-list">
            <div class="three-series-item" v-for="(item, index) in props.options.series" :key="index">
              <div class="three-series-top">
                <span>{{ props.seriesTypeOptions.find((option) => option.name === item.type)?.value }}</span>
                <button class="three-btn danger" @click="removeSeries(index)">移除</button>
              </div>
              <div class="three-control-row">
                <label>seriesName</label>
                <input v-model="item.seriesName" @change="emitApply" />
              </div>
              <div v-if="item.type === 'flight'" class="series-core-grid">
                <label>速度 <input type="number" step="0.1" v-model.number="(item as any).speed" @change="emitApply" /></label>
                <label>头部大小 <input type="number" step="0.1" v-model.number="(item as any).headSize" @change="emitApply" /></label>
                <label>线条长度 <input type="number" v-model.number="(item as any).flightLen" @change="emitApply" /></label>
                <label>粒子数 <input type="number" v-model.number="(item as any).points" @change="emitApply" /></label>
              </div>
              <div v-else-if="item.type === 'marker'" class="series-core-grid">
                <label>宽 <input type="number" v-model.number="(item as any).symbolSize[0]" @change="emitApply" /></label>
                <label>高 <input type="number" v-model.number="(item as any).symbolSize[1]" @change="emitApply" /></label>
                <label>偏移X <input type="number" step="0.1" v-model.number="(item as any).offset[0]" @change="emitApply" /></label>
                <label>偏移Y <input type="number" step="0.1" v-model.number="(item as any).offset[1]" @change="emitApply" /></label>
              </div>
              <div v-else-if="item.type === 'prism'" class="series-core-grid">
                <label>大小 <input type="number" v-model.number="(item as any).size" @change="emitApply" /></label>
                <label>最大高 <input type="number" v-model.number="(item as any).maxHeight" @change="emitApply" /></label>
                <label>最小高 <input type="number" v-model.number="(item as any).minHeight" @change="emitApply" /></label>
                <label>
                  棱柱类型
                  <select v-model.number="(item as any).prismType" @change="emitApply">
                    <option :value="3">棱柱</option>
                    <option :value="2">圆柱</option>
                    <option :value="1">平面柱</option>
                  </select>
                </label>
              </div>
              <div v-else-if="item.type === 'scatter'" class="series-core-grid">
                <label>点大小 <input type="number" step="0.1" v-model.number="(item as any).spotSize" @change="emitApply" /></label>
                <label>点间距 <input type="number" v-model.number="(item as any).spotSeparate" @change="emitApply" /></label>
                <label>环比例 <input type="number" step="0.1" v-model.number="(item as any).ringRatio" @change="emitApply" /></label>
                <label>环间距 <input type="number" v-model.number="(item as any).ringSeparate" @change="emitApply" /></label>
              </div>
              <div v-else-if="item.type === 'cylinder'" class="series-core-grid">
                <label>
                  类型
                  <select v-model="(item as any).mode" @change="emitApply">
                    <option value="cylinder">圆柱</option>
                    <option value="tower">尖塔</option>
                  </select>
                </label>
                <label>大小 <input type="number" v-model.number="(item as any).size" @change="emitApply" /></label>
                <label>最大高 <input type="number" v-model.number="(item as any).maxHeight" @change="emitApply" /></label>
                <label>最小高 <input type="number" v-model.number="(item as any).minHeight" @change="emitApply" /></label>
                <label>间隔 <input type="number" v-model.number="(item as any).separate" @change="emitApply" /></label>
              </div>
              <button class="three-btn" @click="regenerateSeriesData(index)">重生数据</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.three-control-panel {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 300px;
  max-height: calc(100% - 24px);
  overflow: auto;
  z-index: 1000;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  backdrop-filter: blur(6px);
}

.three-control-header {
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.three-control-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.three-control-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}

.panel-item.toggle {
  justify-content: space-between;
}

/* 关联参数置灰：边缘流光关掉时，速度/尾长/亮度一起失效，
   但仍然占位 —— 面板高度不跳动，画布也就不会跟着重排 */
.panel-item.is-disabled {
  opacity: 0.42;
}

.panel-item.is-disabled .number-input {
  cursor: not-allowed;
}

.panel-label {
  min-width: 90px;
  color: rgba(255, 255, 255, 0.95);
}

.color-input-group {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
}

.color-input-group input[type="color"] {
  width: 46px;
  min-width: 46px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 4px;
  background: transparent;
}

.number-input {
  width: 80px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-radius: 4px;
  padding: 4px 6px;
}

.panel-group {
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  overflow: hidden;
}

.panel-group-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border: none;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
}

.panel-group-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(0, 0, 0, 0.18);
}

.three-control-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.three-control-row input,
.three-control-row select {
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-radius: 4px;
  padding: 4px 6px;
  outline: none;
}

.three-inline {
  display: flex;
  gap: 6px;
}

.three-inline select {
  flex: 1;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-radius: 4px;
  padding: 4px 6px;
}

.three-btn {
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 4px;
  padding: 3px 8px;
  cursor: pointer;
}

.three-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.three-btn.danger {
  border-color: rgba(255, 100, 100, 0.6);
  color: #ffd0d0;
}

.three-series-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.three-series-item {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(9, 30, 62, 0.9);
  color: #e8f1ff;
}

.three-series-item .three-control-row label,
.three-series-item .series-core-grid label,
.three-series-item .three-series-top span {
  color: #e8f1ff;
}

.three-series-item .three-control-row input,
.three-series-item .series-core-grid input,
.three-series-item .three-control-row select {
  background: rgba(15, 49, 99, 0.95);
  color: #f2f7ff;
  border-color: rgba(160, 193, 240, 0.45);
}

.three-series-item input::placeholder {
  color: rgba(226, 237, 255, 0.7);
}

.three-inline select option {
  background: #0b2a55;
  color: #f2f7ff;
}

.series-core-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.series-core-grid label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.series-core-grid input {
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-radius: 4px;
  padding: 4px 6px;
}

.three-series-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.range-select {
  flex: 1;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-radius: 4px;
  padding: 4px 6px;
  outline: none;
}

.range-select option {
  background: #0b2a55;
  color: #f2f7ff;
}

.text-input {
  flex: 1;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-radius: 4px;
  padding: 4px 6px;
  outline: none;
  min-width: 0;
}

.range-rules {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.range-rule-item {
  display: grid;
  grid-template-columns: 60px 36px 1fr 28px;
  gap: 4px;
  align-items: center;
}

.range-rule-item input[type="color"] {
  width: 32px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
}

.full-btn {
  width: 100%;
  text-align: center;
  padding: 5px 0;
  margin-top: 2px;
}
</style>
