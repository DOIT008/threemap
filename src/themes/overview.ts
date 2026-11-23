import type { ThreeMapTheme } from "@/components/ThreeMap/options/theme";

/**
 * 概览页主题：默认暗底路网风，只把厚度调厚一点。
 * 这份文件的内容等价于「控制面板调好后点导出配置」拿到的结果，
 * 实际项目里直接粘面板导出的那份即可。
 */
const overviewTheme: ThreeMapTheme = {
  config: {
    depth: 60,
  },
  scene: {
    groundRing: true,
    beams: true,
    cones: true,
    trail: true,
    intro: true,
  },
};

export default overviewTheme;
