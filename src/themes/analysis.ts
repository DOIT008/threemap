import type { ThreeMapTheme } from "@/components/ThreeMap/options/theme";

/**
 * 分析页主题：纯色极简风 —— 丢弃路网贴图、关掉法线浮雕与所有氛围特效，
 * 只留一个干净的色块 + 轮廓光，适合叠棱柱 / 柱状等强数据图层。
 *
 * 注意 series 显式给空数组：主题里一旦出现 series 字段，组件就不再补默认飞线，
 * 这样这一页才能真的只留底图。
 */
const analysisTheme: ThreeMapTheme = {
  config: {
    depth: 34,
  },
  surface: {
    mapMode: "color",
    mapColor: "#0b3a45",
    normalMap: false,
    edgeGlow: true,
    glowLevel: 1.1,
    centerDark: 0.12,
  },
  side: {
    bottomColor: "#062a33",
    topColor: "#35c2c8",
    stripeColor: "#b8f6f8",
    stripeScale: 2.4,
    stripeStrength: 0.6,
  },
  emphasis: {
    topColor: "#7ff0ff",
  },
  lineStyle: {
    color: "#57d8dd",
  },
  scene: {
    groundRing: false,
    beams: false,
    cones: false,
    trail: true,
    intro: true,
  },
  series: [],
};

export default analysisTheme;
