<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent, onMounted, onBeforeUnmount } from "vue";
import ThreeMap from "./ThreeMap";
import createDefaultOptions from "./options/threeOption";
import { mergeOptions, extractTheme, themeToTS, type ThreeMapTheme } from "./options/theme";
import createMarker from "./options/createMarker";
import createFlight from "./options/createFlight";
import createPrism from "./options/createPrism";
import createScatter from "./options/createScatter";
import createCylinder from "./options/createCylinder";
import type { ThreeMapOptions, GeoJsonFeatureCollection } from "./types";

/**
 * 控制面板是开发期调参工具，异步加载：
 * :panel="false" 时这块代码连 chunk 都不会被请求，产物里也就不会带面板。
 */
const ControlPanel = defineAsyncComponent(() => import("./ControlPanel.vue"));

// ==================== Props ====================
/**
 * 组件的对外参数。
 * - option：面板调好后导出的主题，深合并覆盖默认值。不传就是内置的郑州默认效果。
 * - panel：是否渲染调参面板。项目里上线时传 false，面板只是开发期工具。
 * - legend：是否渲染色阶图例（数据映射的图例，属于数据展示，可单独控制）。
 * - area / areaName：初始地图行政区划代码与名称。
 */
const props = withDefaults(
  defineProps<{
    option?: ThreeMapTheme | null;
    panel?: boolean;
    legend?: boolean;
    area?: string;
    areaName?: string;
  }>(),
  {
    option: null,
    panel: true,
    legend: true,
    area: "410100",
    areaName: "郑州",
  },
);

// ==================== Types ====================
interface AreaProp {
  area: string;
  name: string;
}

interface MapListItem {
  name: string;
  value: string;
  mapJson: GeoJsonFeatureCollection;
}

type SeriesType = "marker" | "flight" | "prism" | "scatter" | "cylinder";

const areaRef = ref<AreaProp>({ area: props.area, name: props.areaName });
const threeOptionsRef = ref<ThreeMapOptions>(mergeOptions(createDefaultOptions(), props.option));


// ==================== Refs ====================
const mapRef = ref<HTMLDivElement | null>(null);
const tooltipRef = ref<HTMLDivElement | null>(null);

let map: ThreeMap | null = null;
const mapList = ref<MapListItem[]>([]);
const isInHole = ref(false);
const loading = ref(true);
const currentMapJson = ref<GeoJsonFeatureCollection | null>(null);
const seriesTypeOptions: { name: SeriesType; value: string }[] = [
  {
    name: "marker",
    value: "地标",
  },
  {
    name: "flight",
    value: "飞行线",
  },
  {
    name: "prism",
    value: "2d柱体",
  },
  {
    name: "scatter",
    value: "散点",
  },
  {
    name: "cylinder",
    value: "3d柱状",
  },
];

// ==================== Computed ====================
const showBack = computed(() => mapList.value.length > 1);

const range = computed(() => (threeOptionsRef.value as any).itemStyle.range);

const getVisualMapColumnStyle = computed(() => {
  const r = range.value;
  if (r.color && r.color.length) {
    const gradientValue = r.color.map((item: string, index: number) => `${item} ${(index / r.color.length) * 100}%`).join();
    return {
      "background-color": r.color[0],
      "background-image": `linear-gradient(to top, ${gradientValue})`,
    };
  }
  return {};
});

// ==================== Methods ====================

/**
 * 将 visualMap 规则颜色转换为内联样式。
 */
function getVisualMapColorStyle(color: { color: string }) {
  return { backgroundColor: color.color };
}

/**
 * 返回上一级地图层级并重新渲染。
 */
function backMapFn(): void {
  mapList.value.pop();
  const o = mapList.value[mapList.value.length - 1]!;
  const code = o.value;
  const mapName = o.name;
  (threeOptionsRef.value as any).map = code;
  (threeOptionsRef.value as any).mapName = mapName;
  currentMapJson.value = o.mapJson;
  isInHole.value = true;
  reset();
}

/**
 * 从 GeoJSON 要素中随机抽取指定数量，避免每次生成数据都固定同一批区域。
 */
function getRandomFeatures(mapJson: GeoJsonFeatureCollection, count = 10): GeoJsonFeatureCollection["features"] {
  const source = [...mapJson.features];
  for (let i = source.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [source[i], source[j]] = [source[j]!, source[i]!];
  }
  return source.slice(0, Math.min(count, source.length));
}

/**
 * 根据系列类型生成演示数据。
 * - flight: 生成随机起终点连线
 * - other: 生成带 value 的区域数据
 */
function createdDataRandom(mapJson: GeoJsonFeatureCollection, type: string): any[] {
  // 每次生成的数据量与地图区域数量一致
  const features = getRandomFeatures(mapJson,mapJson.features.length);
  if (type === "flight") {
    if (mapJson.features.length < 2) return [];
    // 和 demo 一致：从第一个区县（中心城区）放射到其余每一个区县
    const center = mapJson.features[0]!.properties.adcode as string;
    const line: { start: string; end: string }[] = [];
    mapJson.features.forEach((it) => {
      const code = it.properties.adcode as string;
      if (code !== center) line.push({ start: center, end: code });
    });
    return line;
  } else {
    const res: any[] = [];
    features.forEach((it) => {
      res.push({
        district: it.properties.adcode,
        name: it.properties.name,
        value: Math.floor(100 + 900 * Math.random()),
      });
    });
    return res;
  }
}

/**
 * 统一重设地图事件并调用 setOption 触发渲染。
 */
function reset(): void {
  if (!map || !threeOptionsRef.value) return;

  try {
    map.off("click");
    map.off("dblclick");
    map.off("change");
  } catch (error) {
    console.log(error);
  }
  // 下钻事件
  map.on("dblclick", (data: any) => {
    if (data.adcode) {
      handleInChangeMap(data.adcode + "", data.name);
    }
  });

  const options = threeOptionsRef.value;

  const refresh = !isInHole.value;
  map.setOption(options, refresh);
}

/**
 * 进入下一级地图（双击区域）并刷新系列数据。
 */
function handleInChangeMap(code: string, mapName: string): void {
  if (map) {
    isInHole.value = true;
    map.registerMap(code, code, threeOptionsRef.value.config).then((mapJson) => {
      currentMapJson.value = mapJson;

      mapList.value.push({
        name: mapName,
        value: code,
        mapJson: mapJson,
      });

      (threeOptionsRef.value as any).map = code;
      (threeOptionsRef.value as any).mapName = mapName || code;

      threeOptionsRef.value.series.forEach((it: any) => {
        // 下钻清空数据，避免数据与区域不匹配导致的显示问题，用户可以选择重新生成数据或手动调整。
        it.data = [];
      });
      reset();
    });
  }
}

/**
 * 加载指定行政区划代码的地图并渲染。首次进入和外部切换主题里的 map 都走这里。
 */
function loadMap(code: string, name: string): void {
  if (!map) return;

  loading.value = true;
  isInHole.value = false;
  mapList.value = [];

  (threeOptionsRef.value as any).map = code;
  (threeOptionsRef.value as any).mapName = name;

  // demo 的地图自带一组「中心放射」飞线，默认就给一条，进页面即是同款观感
  if (!threeOptionsRef.value.series.length) {
    const flight = createFlight();
    flight.seriesName = "flight-1";
    threeOptionsRef.value.series.push(flight);
  }

  map
    .registerMap(code, code, threeOptionsRef.value.config)
    .then((mapJson) => {
      currentMapJson.value = mapJson;

      mapList.value.push({
        name,
        value: code,
        mapJson: mapJson,
      });

      threeOptionsRef.value.series.forEach((it: any) => {
        if (!it.data || !it.data.length) {
          it.data = createdDataRandom(mapJson, it.type);
        }
      });

      init();
      loading.value = false;
    })
    .catch((err: unknown) => {
      console.error("地图加载失败:", err);
      loading.value = false;
    });
}

/**
 * 组件内部初始化入口。
 */
function init(): void {
  reset();
}

/**
 * 依据系列类型创建默认系列配置对象。
 */
function createSeriesByType(type: SeriesType): any {
  if (type === "marker") return createMarker();
  if (type === "flight") return createFlight();
  if (type === "prism") return createPrism();
  if (type === "scatter") return createScatter();
  return createCylinder();
}

/**
 * 面板配置变更后强制全量刷新，保证环境层与系列层都生效。
 */
function applyPanelChanges(): void {
  // isInHole.value = false;
  reset();
}

/**
 * 新增一个指定类型的系列，并在当前地图上生成初始数据。
 */
function addSeries(type: SeriesType): void {
  const series = createSeriesByType(type);
  series.seriesName = `${series.type}-${threeOptionsRef.value.series.length + 1}`;
  if (currentMapJson.value) {
    series.data = createdDataRandom(currentMapJson.value, series.type);
  }
  threeOptionsRef.value.series.push(series);
  applyPanelChanges();
}

/**
 * 删除指定索引的系列。
 */
function removeSeries(index: number): void {
  threeOptionsRef.value.series.splice(index, 1);
  applyPanelChanges();
}

/**
 * 为地图所有区域生成随机数据并写入 options.data。
 */
function generateMapData(): void {
  if (!currentMapJson.value) return;
  const { min, max } = threeOptionsRef.value.itemStyle.range;
  threeOptionsRef.value.data = currentMapJson.value.features.map((feature) => ({
    district: feature.properties.adcode,
    name: feature.properties.name,
    value: Math.floor(min + (max - min) * Math.random()),
  }));
  applyPanelChanges();
}

/**
 * 重新生成指定系列的数据并刷新显示。
 */
function regenerateSeriesData(index: number): void {
  if (!currentMapJson.value) return;
  const target: any = threeOptionsRef.value.series[index];
  if (!target) return;
  target.data = createdDataRandom(currentMapJson.value, target.type);
  applyPanelChanges();
}

// ==================== 主题导出 ====================
const exportTip = ref("");
let exportTipTimer: ReturnType<typeof setTimeout> | null = null;

/** 面板右下角的一次性提示 */
function showExportTip(text: string): void {
  exportTip.value = text;
  if (exportTipTimer) clearTimeout(exportTipTimer);
  exportTipTimer = setTimeout(() => {
    exportTip.value = "";
  }, 2600);
}

/** 无剪贴板权限时的兜底：直接存成文件 */
function downloadText(text: string, filename: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * 把面板里调好的视觉配置导出成 TS 源码。
 * 优先写剪贴板；http 局域网等非安全上下文拿不到 clipboard 权限时退化成下载文件。
 */
async function handleExportTheme(): Promise<void> {
  const code = themeToTS(extractTheme(threeOptionsRef.value));
  try {
    await navigator.clipboard.writeText(code);
    showExportTip("配置已复制到剪贴板，粘进项目即可");
  } catch (error) {
    console.warn("剪贴板不可用，改为下载文件:", error);
    downloadText(code, "map-theme.ts");
    showExportTip("已下载 map-theme.ts");
  }
}

// ==================== Lifecycle ====================
// 外部换主题：整份 options 重算，map 变了要重新加载底图，其余直接重绘
watch(
  () => props.option,
  (next) => {
    const prevCode = threeOptionsRef.value.map;
    threeOptionsRef.value = mergeOptions(createDefaultOptions(), next);
    if (!map) return;

    const nextCode = threeOptionsRef.value.map;
    if (nextCode !== prevCode) {
      loadMap(nextCode, threeOptionsRef.value.mapName || props.areaName);
    } else {
      reset();
    }
  },
);

onMounted(() => {
  map = new ThreeMap(mapRef.value!, tooltipRef.value!);

  // 调试开关：URL 带 ?freeze=1 时冻结所有 time 型动画（飞线流光、光柱漂移、
  // 光圈自转、顶点流光、侧面条纹），画面完全静止。
  // 逐项核对配置面板是否生效时需要稳定的基准画面，否则动画相位差
  // 会淹没掉「改颜色只影响几 % 像素」这类弱信号。正常访问不受影响。
  if (new URLSearchParams(window.location.search).has("freeze")) {
    map.setFrozen(true);
  }

  loadMap(areaRef.value.area, areaRef.value.name);
});

onBeforeUnmount(() => {
  if (exportTipTimer) clearTimeout(exportTipTimer);
  map && map.destroyMap();
  map = null;
});
</script>

<template>
  <div class="dv-three-map">
    <div v-if="loading" class="dv-three-loading">加载中...</div>
    <div ref="mapRef" class="dv-three-map-canvas"></div>
    <div ref="tooltipRef" class="dv-three-tooltip"></div>

    <ControlPanel
      v-if="panel"
      :options="threeOptionsRef"
      :series-type-options="seriesTypeOptions"
      @apply="applyPanelChanges"
      @add-series="addSeries"
      @remove-series="removeSeries"
      @regenerate-series="regenerateSeriesData"
      @generate-data="generateMapData"
      @export="handleExportTheme"
    />

    <!-- 视觉映射 -->
    <div class="three-visual-wrap" v-if="range.show && legend">
      <div class="three-visual">
        <div class="three-visual-gradient" v-if="range.mode === 'range'">
          <div class="gradient" :style="getVisualMapColumnStyle"></div>
          <div class="high">
            <div>{{ range.visualMap.maxText }}</div>
            <div>{{ range.max }}</div>
          </div>
          <div class="low">
            <div>{{ range.visualMap.minText }}</div>
            <div>{{ range.min }}</div>
          </div>
        </div>
        <div class="three-visual-color-group" v-else-if="range.mode === 'separate'">
          <div class="three-visual-color" v-for="(color, colorIndex) in range.rules" :key="colorIndex">
            <div class="color" :style="getVisualMapColorStyle(color)"></div>
            <div class="name">{{ color.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 返回按钮 -->
    <div class="back-three-map" @click="backMapFn" v-if="showBack">
      <span style="margin-right: 4px">返回上一级 </span>
    </div>

    <!-- 导出提示 -->
    <div v-if="exportTip" class="three-export-tip">{{ exportTip }}</div>
  </div>
</template>

<style>
/* ==================== 容器 ==================== */
.dv-three-map {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

.dv-three-map-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 0;
}

.dv-three-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 14px;
  z-index: 10;
}

/* ==================== Tooltip ==================== */
.dv-three-tooltip {
  position: absolute;
  display: none;
  pointer-events: none;
  z-index: 100;
}

/* ==================== 视觉映射 ==================== */
.three-visual-wrap {
  position: absolute;
  z-index: 10;
  left: 16px;
  bottom: 16px;
}

.three-visual-wrap .three-visual {
  color: #fff;
  font-size: 12px;
}

.three-visual-wrap .three-visual .three-visual-name {
  text-align: center;
}

.three-visual-wrap .three-visual .three-visual-gradient {
  position: relative;
  margin: 20px;
}

.three-visual-wrap .three-visual .three-visual-gradient .gradient {
  width: 24px;
  height: 150px;
}

.three-visual-wrap .three-visual .three-visual-gradient .high {
  position: absolute;
  letter-spacing: 0;
  line-height: 1.1;
  right: 0;
  top: 0;
  transform: translate(110%, -50%);
}

.three-visual-wrap .three-visual .three-visual-gradient .low {
  position: absolute;
  line-height: 1.1;
  letter-spacing: 0;
  right: 0;
  bottom: 2px;
  transform: translate(110%, 50%);
}

.three-visual-wrap .three-visual .three-visual-color-group {
  padding: 20px;
}

.three-visual-wrap .three-visual .three-visual-color {
  display: flex;
  align-items: center;
  margin: 0 10px 10px 0;
}

.three-visual-wrap .three-visual .three-visual-color .color {
  width: 20px;
  height: 16px;
  margin-right: 6px;
}

/* ==================== 返回按钮 ==================== */
.back-three-map {
  position: absolute;
  cursor: pointer;
  z-index: 10;
  color: #fff;
  font-size: 20px;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  user-select: none;
  display: flex;
  align-items: center;
}

.back-three-map:hover {
  background: rgba(0, 0, 0, 0.5);
}

/* ==================== 导出提示 ==================== */
.three-export-tip {
  position: absolute;
  z-index: 1001;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  border-radius: 6px;
  background: rgba(8, 32, 60, 0.92);
  border: 1px solid rgba(72, 204, 255, 0.5);
  color: #b7e9ff;
  font-size: 13px;
  letter-spacing: 0.5px;
  pointer-events: none;
}

/* ==================== Canvas Label / Marker / Prism ==================== */
.dv-three-map-canvas .three-point-tag {
  position: relative;
}

.dv-three-map-canvas .three-point-tag .three-label-name {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -100%);
  width: max-content;
  box-sizing: border-box;
}

.dv-three-map-canvas .three-prism-tag .three-label-name {
  position: absolute;
  top: -50%;
  left: 50%;
  width: max-content;
  box-sizing: border-box;
  transform: translate(-50%, -100%);
}

.dv-three-map-canvas .three-prism-tag .three-prism-perceive {
  perspective: 1000px;
  transform: translateY(-50%);
}

.dv-three-map-canvas .three-prism-tag .three-prism-perceive .prism {
  position: relative;
  transform-style: preserve-3d;
  transform: rotateX(-20deg) rotateY(-30deg);
}

.dv-three-map-canvas .three-prism-tag .three-prism-perceive .prism > div {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(0, 128, 255, 0.7);
}

.dv-three-map-canvas .three-prism-tag .three-plat-perceive {
  transform: translateY(-50%);
}

.dv-three-map-canvas .three-prism-tag .three-cylinder-perceive {
  position: relative;
  transform: translateY(-50%);
}

.dv-three-map-canvas .three-prism-tag .three-cylinder-perceive > div {
  position: absolute;
  left: 0;
  border-radius: 50%;
}

.dv-three-map-canvas .three-prism-tag .three-cylinder-perceive > div.top-cy {
  top: 0;
  transform: translateY(-50%);
}

.dv-three-map-canvas .three-prism-tag .three-cylinder-perceive > div.bottom-cy {
  bottom: 0;
  transform: translateY(50%);
}

.dv-three-map-canvas .three-district-label {
  color: #fff;
  font-size: 12px;
}
</style>
