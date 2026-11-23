import type { ThreeMapTheme } from "@/components/ThreeMap/options/theme";

/**
 * 监测页主题：紫色水晶质感，关掉漂浮光柱与轮廓跑光，让画面更安静。
 * 底图仍然是郑州 —— 主题只换风格，不换城市。
 */
const monitorTheme: ThreeMapTheme = {
  config: {
    depth: 46,
  },
  surface: {
    tintColor: "#b45cff",
    tintStrength: 0.55,
    reliefStrength: 0.6,
    centerDark: 0.3,
  },
  side: {
    bottomColor: "#2a0a3d",
    topColor: "#c56fd8",
    stripeColor: "#ffd6f2",
    stripeScale: 3.6,
    stripeStrength: 0.9,
  },
  emphasis: {
    topColor: "#ffb0f0",
  },
  lineStyle: {
    color: "#b98eff",
  },
  scene: {
    groundRing: true,
    beams: false,
    cones: true,
    trail: false,
    intro: true,
  },
};

export default monitorTheme;
