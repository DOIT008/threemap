/*
 * @Editor: zhanghang
 * @Description: 创建 ThreeMap 的默认全局配置选项
 * @Date: 2026-04-07 15:33:26
 * @LastEditors: zhanghang
 * @LastEditTime: 2026-04-09 09:42:58
 */
import type { ThreeMapOptions } from "../types";
import createLabel from "./createLabel";

/**
 * 创建 ThreeMap 的默认全局配置选项
 * @description 此配置是整个 3D 地图的核心配置，包含所有渲染参数、交互控制、样式设置等
 * 主要配置模块：
 *   - config: 基础配置（缩放、旋转控制、拉伸高度等）
 *   - camera: 相机位置
 *   - grid: 坐标网格辅助线
 *   - foundation: 底座旋转动画
 *   - tooltip: 悬停提示框
 *   - mirror: 镜面反射效果
 *   - wall: 边界墙体
 *   - texture: 区域表面纹理
 *   - glow: Bloom 辉光后处理
 *   - itemStyle: 区域颜色和可视化映射
 *   - emphasis: 鼠标悬停高亮
 *   - lineStyle/outLineStyle: 边界线样式
 *   - label: 区域标签
 * @returns {ThreeMapOptions} 完整的地图配置对象
 */
const createDefaultOptions = (): ThreeMapOptions => {
  // 创建默认标签配置（用于地图区域标签）
  const label = createLabel();

  return {
    // ========== 基础配置 ==========
    config: {
      autoScale: true, // 是否自动缩放地图以适应容器
      disableRotate: false, // 是否禁用鼠标旋转控制
      disableZoom: false, // 是否禁用鼠标缩放控制
      autoScaleFactor: 1, // 自动缩放的额外系数（1 = 原始大小）
      scale: 100, // 自动缩放关闭时的投影缩放比例
      depth: 53, // 区域厚度（千分比：53 = 地图宽度的 5.3%，与 demo 的 1.6/30.018 等价）
      mapSize: 1, // 地图尺寸倍率：1 = 默认构图，>1 地图更大（相机拉近）
    },
    // ========== 画布背景配置 ==========
    background: {
      show: false, // 是否绘制背景色：关掉 = 画布透明，露出页面/大屏背景
      color: "#041533", // 背景色（show 打开时生效，雾也用它）
    },
    // ========== 自动旋转配置 ==========
    autoRotate: {
      autoRotate: false, // 是否启用相机自动旋转
      autoRotateSpeed: 2, // 自动旋转速度（度/秒）
    },
    // ========== 相机位置配置 ==========
    // 只当「方向」用：真实距离由地图宽度换算（见 ThreeMap.setCamera）
    camera: {
      x: -0.8, // 相机 X 轴方向
      y: 10.2, // 相机 Y 轴方向（高度）
      z: 5.3, // 相机 Z 轴方向（纵深）
    },
    // ========== 网格辅助线配置 ==========
    grid: {
      show: false, // 是否显示坐标网格（用于调试）
      color: "#2BD9FF", // 网格线颜色
      opacity: 0.2, // 网格线透明度
    },
    // ========== 底座动画配置 ==========
    foundation: {
      show: false, // 是否显示底座
      size: 800, // 底座平面尺寸
      speed: 0.5, // 底座旋转速度（每帧旋转的角度）
      image: "default", // 底座纹理图片（'default' 使用内置纹理）
      isRotate: true, // 是否启用旋转动画
      static: false, // 是否为静态底座（不旋转）
    },
    // ========== Tooltip 提示框配置 ==========
    tooltip: {
      show: true, // 是否启用 tooltip
      content: "", // 静态内容（优先级低于 formatter）
      styleType: "0", // 样式类型标识
      isFormatter: false, // 是否使用自定义 formatter
      formatterHtml: "", // 自定义 HTML（优先级最高）
      // 默认格式化函数：显示名称和数值
      formatter: function (data: any) {
        const name = data.name || "-- ";
        const value = data.value === undefined ? "-- " : data.value;
        return "<span>" + name + "：</span>" + "<span>" + value + "</span>";
      },
      itemStyle: {
        // Tooltip 容器样式
        backgroundColor: "rgba(8, 20, 45, 0.82)", // 半透明深蓝背景
        borderColor: "rgba(72, 204, 255, 0.45)", // 淡蓝色边框
        borderWidth: 0,
        padding: [10, 10, 10, 10], // 内边距 [上, 右, 下, 左]
        color: "#DFF6FF", // 文字颜色
        fontSize: 14,
        minWidth: 80, // 最小宽度
        width: "max-content", // 自适应内容宽度
        borderRadius: 5,
        borderStyle: "solid",
      },
    },
    // ========== 镜面反射配置 ==========
    mirror: {
      show: true, // 是否显示镜面反射效果（在地图下方渲染翻转的副本）
      color: ["#020B1F", "#00D2FF"], // 镜面渐变色：[底部颜色, 顶部颜色]
      opacity: 1, // 倒影浓度：1 = 最实，越小越淡，0 = 倒影消失（不影响地图本体）
    },
    // ========== 边界墙体配置 ==========
    wall: {
      show: false, // 是否显示区域边界的垂直墙体
      height: 40, // 墙体高度
      color: "#4DEBFF", // 墙体颜色（支持 alphaMap 渐变透明）
    },
    // ========== 区域表面纹理配置 ==========
    texture: {
      show: true, // 是否启用纹理贴图
      autoRepeat: false, // 是否自动计算纹理重复（false 时使用手动 repeat 值）
      repeat: { x: 0.0927, y: 0.124 }, // 纹理 UV 重复次数
      offset: { x: 0.5918, y: 0.324 }, // 纹理 UV 偏移量
      image: "default", // 纹理图片（'default' 使用内置纹理）
    },
    // ========== 地图数据配置 ==========
    map: "410100", // 地图区域代码（410100 = 郑州市）
    mapName: "zhengzhou", // 地图名称标识
    // ========== Bloom 辉光后处理配置 ==========
    glow: {
      show: false, // 是否启用 Bloom 效果（demo 没有辉光，开了会把颜色推白）
      threshold: 0, // 发光阈值（亮度低于此值的不会发光）
      strength: 1, // 发光强度
      radius: 0, // 发光扩散半径
    },
    // ========== 区域样式配置 ==========
    itemStyle: {
      range: {
        // 数据可视化映射配置
        show: false, // 是否启用数据映射（影响区域颜色）
        mode: "range", // 映射模式：'range' = 连续渐变 | 'separate' = 分段规则
        rules: [
          // 分段规则数组（mode='separate' 时使用）
          {
            value: 0, // 规则阈值
            color: "#27F4FF", // 对应颜色
            label: ">=0", // 标签文本
          },
        ],
        color: ["#18D7FF", "#2665FF"], // 连续渐变色（mode='range' 时使用）
        min: 0, // 数据最小值
        max: 1000, // 数据最大值
        visualMap: {
          // 可视化图例配置（类似 ECharts visualMap）
          show: false, // 是否显示图例
          left: "2%", // 图例水平位置
          top: "2%", // 图例垂直位置
          maxText: "高", // 最大值文本标签
          minText: "低", // 最小值文本标签
          textStyle: {
            // 图例文字样式
            fontSize: 12,
            color: "#FFF",
            fontStyle: "normal",
            fontWeight: "normal",
            fontFamily: "Microsoft Yahei",
            textDecoration: "",
            textShadow: "",
          },
        },
      },
      topColor: "rgba(42, 233, 255, 0.95)", // 区域顶面颜色（ExtrudeGeometry 上表面）
      sideColor: "rgba(59, 132, 255, 0.92)", // 区域侧面颜色（挤出侧面）
      uColor: "rgba(19, 48, 128, 1)", // Shader 扫光动画的 U 通道颜色
    },
    // ========== 鼠标悬停高亮配置 ==========
    emphasis: {
      // 悬停高亮：区县整块抬厚 1.5 倍 + 顶面按明暗投一层高亮色。
      // demo 的 City.vue 就是这个交互（group.scale.z → 1.5），默认开，
      // 不然鼠标划过地图一点反馈都没有，也分不清自己指到了哪个区县。
      show: true, // 是否启用悬停高亮效果
      topColor: "#73F8FF", // 悬停时的顶面高亮色
      textStyle: {
        // 悬停时的文本样式（用于标签）：
        // 必须比常态更「跳」——常态 13px/淡蓝，悬停放大到 15px 并加强光晕，
        // 否则鼠标指过去文字反而变暗变小，看着像 bug
        fontSize: 15,
        color: "#FFFFFF",
        fontStyle: "normal",
        fontWeight: "bold",
        fontFamily: "Microsoft Yahei",
        textDecoration: "",
        textShadow: "0 0 8px rgba(150, 220, 255, 1), 0 0 18px rgba(80, 170, 255, 0.85)",
      },
    },
    // ========== 边界线样式配置 ==========
    lineStyle: {
      color: "#78CFFF", // 区域内部边界线颜色（如省内市界）
    },
    outLineStyle: {
      // 贴图自带的边界发光已经完整，再叠一条描线会在外沿夹出一条暗带
      show: false, // 是否显示外轮廓描线
      color: "rgba(83, 198, 230, 1)", // 区域外部轮廓线颜色（如省界）
    },
    // ========== 区域标签配置 ==========
    label: {
      ...label, // 继承默认标签配置
      show: true, // 是否显示区域标签
      itemStyle: {
        ...label.itemStyle,
        // 与 demo 的 .map-label 同一套：淡蓝白字 + 双层光晕，入场动画结束后才出现
        textStyle: {
          ...label.itemStyle.textStyle,
          fontSize: 13,
          color: "#d7ebff",
          letterSpacing: "1px",
          textShadow: "0 0 6px rgba(120, 190, 255, 0.9), 0 0 14px rgba(60, 130, 230, 0.6)",
        },
      },
    },
    // ========== 顶面材质（demo 的 ShapeBox 那套）==========
    surface: {
      mapMode: "image", // 'image' 图片贴图 | 'color' 纯色铺色
      mapColor: "#0d2340", // 纯色模式的铺色
      tintColor: "#ffffff", // 图片模式的染色色相，白色 = 不改色
      tintStrength: 0, // 0 = 原图色相，1 = 完全换成 tintColor
      normalMap: true, // 法线贴图浮雕
      edgeGlow: true, // 贴图 alpha 距离场做的轮廓光带
      reliefStrength: 0.45, // 浮雕强度
      glowLevel: 1, // 轮廓光整体倍率
      centerDark: 0.34, // 中心压暗（让四周边缘更跳）
      mapTex: null, // 自定义贴图，null 用内置暗底路网
    },
    // ========== 侧面材质（挤出体立面，与顶面完全独立）==========
    side: {
      bottomColor: "#0a2952", // 底部深蓝
      topColor: "#6fb0d8", // 顶部亮青
      stripeColor: "#d8f0ff", // 顶沿亮线 / 水晶条纹高光
      stripeScale: 3.2, // 条纹密度
      stripeStrength: 0.82, // 条纹强度
      tintColor: "#ffffff", // 染色色相，白色 = 保持冰蓝
      tintStrength: 0, // 0 = 冰蓝，1 = 完全换成 tintColor
      opacity: 1, // 侧面不透明度：1 = 实心（不透出背后），越小越透，底部比顶部先透
    },
    // ========== 场景特效开关 ==========
    scene: {
      groundRing: true, // 地面光圈
      groundRingScale: 1, // 地面光圈缩放：圆环底图 = 地图宽 × 1.066 × 该值，独立于地图尺寸
      beams: true, // 漂浮光柱
      cones: true, // 区县标点（光锥 + 光环）
      trail: true, // 边缘流光（沿外轮廓循环跑的一道光）
      trailSpeed: 10, // 跑一圈的秒数
      trailLength: 0.3, // 尾长占整圈的比例
      trailBrightness: 1, // 亮度倍率
      intro: true, // 入场动画
    },
    // ========== 系列和数据配置 ==========
    seriesName: "map", // 主地图系列名称
    data: [], // 区域数据数组（用于 itemStyle.range 的数据映射）
    series: [], // 附加系列数组（存放 cylinder, flight, marker 等）
  };
};

export default createDefaultOptions;
