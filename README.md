# ThreeMap

一个基于 **Three.js + Vue 3** 的 3D 地理可视化组件，支持行政区域拉伸、多种数据图层叠加、辉光后处理、下钻交互等功能。

[![Vue](https://img.shields.io/badge/Vue-3.x-42b883?logo=vue.js)](https://vuejs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.183-black?logo=three.js)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

---

## 目录

- [ThreeMap](#threemap)
  - [目录](#目录)
  - [功能特性](#功能特性)
  - [预览](#预览)
  - [快速开始](#快速开始)
    - [环境要求](#环境要求)
    - [安装依赖](#安装依赖)
    - [启动开发服务器](#启动开发服务器)
    - [构建生产包](#构建生产包)
  - [组件使用](#组件使用)
    - [核心类 `ThreeMap` 所有功能都包含在该类（自定义集成）](#核心类-threemap--所有功能都包含在该类自定义集成)
  - [调参 → 上线：主题固化](#调参--上线主题固化)
    - [1. 在面板里调好](#1-在面板里调好)
    - [2. 点「导出配置」](#2-点导出配置)
    - [3. 粘进项目，关掉面板](#3-粘进项目关掉面板)
    - [组件 Props](#组件-props)
    - [只写想改的字段](#只写想改的字段)
    - [关于面板的代码体积](#关于面板的代码体积)
    - [业务数据怎么进](#业务数据怎么进)
    - [多路由 = 多套主题](#多路由--多套主题)
    - [主题里的 map 字段](#主题里的-map-字段)
  - [配置项（Options）详解](#配置项options详解)
    - [config — 地图基础配置](#config--地图基础配置)
    - [background — 画布背景](#background--画布背景)
    - [camera — 相机位置](#camera--相机位置)
    - [itemStyle — 区域样式](#itemstyle--区域样式)
    - [label — 区域标注](#label--区域标注)
    - [tooltip — 提示框](#tooltip--提示框)
    - [glow — 辉光后处理](#glow--辉光后处理)
    - [grid — 网格](#grid--网格)
    - [foundation — 底图装饰](#foundation--底图装饰)
    - [mirror — 镜面反射](#mirror--镜面反射)
    - [wall — 电子围栏](#wall--电子围栏)
    - [texture — 地图贴图](#texture--地图贴图)
    - [side — 侧面水晶](#side--侧面水晶)
    - [autoRotate — 自动旋转](#autorotate--自动旋转)
    - [scene — 场景特效](#scene--场景特效)
    - [emphasis — 高亮样式](#emphasis--高亮样式)
    - [lineStyle / outLineStyle — 边线](#linestyle--outlinestyle--边线)
  - [数据（data）格式](#数据data格式)
  - [Series 图层](#series-图层)
    - [marker — 标记点](#marker--标记点)
    - [scatter — 扩散点](#scatter--扩散点)
    - [prism — 棱柱](#prism--棱柱)
    - [cylinder — 圆柱](#cylinder--圆柱)
    - [flight — 飞线](#flight--飞线)
  - [事件 API](#事件-api)
  - [地图注册与下钻](#地图注册与下钻)
  - [目录结构](#目录结构)
  - [开发指南](#开发指南)
    - [推荐 IDE](#推荐-ide)
    - [代码格式化](#代码格式化)
    - [新增图层](#新增图层)
  - [依赖说明](#依赖说明)
  - [浏览器兼容](#浏览器兼容)
  - [License](#license)

---

## 功能特性

| 功能               | 说明                                            |
| ------------------ | ----------------------------------------------- |
| 🗺️ 3D 地图拉伸     | GeoJSON 驱动，顶面/侧面独立配色，可添加贴图纹理 |
| 🌟 辉光后处理      | UnrealBloom 选择性辉光，仅对指定对象生效        |
| 📊 数据可视化映射  | 连续渐变色阶 / 分段规则两种模式                 |
| 📍 Marker 图层     | 自定义 SVG/图片标记，支持自定义大小与偏移       |
| 💫 Scatter 扩散点  | 带呼吸动画的扩散圆环散点图                      |
| 🔵 Cylinder 柱状图 | 渐变圆柱或发光塔模式，支持高度比例映射          |
| 🔺 Prism 棱柱图    | 三角/四角/六角棱柱，支持渐变色                  |
| ✈️ Flight 飞线     | 弧线飞线动画，多色头部粒子效果                  |
| 🔍 下钻交互        | 双击省份/城市可钻入下一级，支持返回             |
| 💡 Tooltip         | 自定义 HTML 模板提示框，hover/click 触发        |
| 🪟 镜面反射        | 可选虚拟镜面水面效果                            |
| 🔲 底图装饰        | 可旋转/静态纹理底盘                             |
| 📐 自适应缩放      | ResizeObserver 自动响应容器尺寸变化             |

---

## 预览

![动态演示](./screenshot/screen.gif)

![界面截图](./screenshot/image.png)

> 3D 拉伸地图 + 辉光边界 + Marker/飞线/柱状图层 + 可视化控制面板

---

## 快速开始

### 环境要求

- Node.js `^20.19.0` 或 `>=22.12.0`
- 现代浏览器（支持 WebGL 2）

### 安装依赖

```sh
npm install
```

### 启动开发服务器

```sh
npm run dev
```

### 构建生产包

```sh
npm run build
```

---

## 组件使用

### 核心类 `ThreeMap` 所有功能都包含在该类（自定义集成）

如需自行控制数据、事件和下钻逻辑，参考`index.vue` , 直接使用底层 `ThreeMap.ts` 类：

```vue
<template>
  <div ref="mapRef" style="width: 100%; height: 600px" />
  <div ref="tooltipRef" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import ThreeMap from '@/components/ThreeMap/ThreeMap'
import createDefaultOptions from '@/components/ThreeMap/options/threeOption'

const mapRef = ref<HTMLDivElement | null>(null)
const tooltipRef = ref<HTMLDivElement | null>(null)
let map: ThreeMap | null = null

onMounted(async () => {
  map = new ThreeMap(mapRef.value!, tooltipRef.value!)
  const options = createDefaultOptions()

  const mapJson = await map.registerMap('100000', '100000', options.config)

  map.on('click', (data: any) => {
    console.log('点击区域:', data.name, data.adcode)
  })
  map.on('dblclick', (data: any) => {
    // 手动实现下钻：调用 registerMap + setOption
    console.log('下钻进入:', data.name)
  })

  map.setOption({ ...options, map: '100000' })
})

onBeforeUnmount(() => {
  map?.destroyMap()
  map = null
})
</script>
```

---

## 调参 → 上线：主题固化

控制面板只用于**开发期调参**，上线时不需要（也不应该）带进项目。流程分三步：

### 1. 在面板里调好

访问 `/?panel=0` 可以随时看到「不上线面板」时的真实效果（等价于 `:panel="false"`）。
调参时建议加 `?freeze=1` 冻结飞线、光柱、光圈等所有时间型动画，画面静止，方便逐项比对改动。

### 2. 点「导出配置」

面板右上角的 **导出配置** 按钮会把当前视觉配置导出成一段 TS 源码：

- 内容只含**渲染配置**：颜色、厚度、相机、材质、特效开关等
- **不含业务数据**：`data`、`series[].data` 都会被清空
- 不含函数：`formatter` 之类无法序列化的成员会被剔除

点击后配置直接进剪贴板；若在 http 非安全上下文（比如局域网 IP 访问）拿不到剪贴板权限，会自动下载成 `map-theme.ts`。

### 3. 粘进项目，关掉面板

把导出的代码存成 `src/components/ThreeMap/options/myTheme.ts`，然后：

```vue
<template>
  <div style="width: 100%; height: 100%">
    <ThreeMap :option="myTheme" :panel="false" area="410100" area-name="郑州" />
  </div>
</template>

<script setup lang="ts">
import ThreeMap from "@/components/ThreeMap/index.vue";
import myTheme from "@/components/ThreeMap/options/myTheme";
</script>
```

导出的文件里 `import` 路径是 `@/components/ThreeMap/options/theme`，如果 `ThreeMap` 目录不在 `@/components` 下，改一下这行路径即可。

### 组件 Props

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `option` | `ThreeMapTheme \| null` | `null` | 面板导出的主题，**深合并**覆盖默认值，只需写想改的字段 |
| `panel` | `boolean` | `true` | 是否渲染调参面板。生产环境传 `false` |
| `legend` | `boolean` | `true` | 是否渲染色阶图例（数据展示用，与面板无关） |
| `area` | `string` | `'410100'` | 初始行政区划代码 |
| `areaName` | `string` | `'郑州'` | 初始地图名称 |

### 只写想改的字段

`option` 是深合并，不必导出整份配置。手写主题时按需覆盖即可：

```ts
import type { ThreeMapTheme } from "@/components/ThreeMap/options/theme";

const myTheme: ThreeMapTheme = {
  config: { depth: 40, mapSize: 1.1 },
  camera: { azimuth: 355, elevation: 62 },
  surface: { normalMap: false, centerDark: 0.5 },
  side: { topColor: "#8fd8ff" },
  scene: { beams: false },
};
```

数组（如 `mirror.color`、`surface` 以外的 `series`）是**整体替换**，不做逐项合并。

### 关于面板的代码体积

`ControlPanel.vue` 通过 `defineAsyncComponent` 按需加载，`:panel="false"` 时这个 chunk 不会被请求，产物里不包含面板代码。

### 业务数据怎么进

主题只负责「长什么样」，数据仍然走 `series`。飞线、柱体、散点等具体数据用 `options.series` 或底层 `ThreeMap` 类自己填，例如：

```ts
// 主题里的 series 只保留样式，data 自己给
const options = mergeOptions(createDefaultOptions(), myTheme);
options.series = [
  { ...createFlight(), seriesName: "flight-1", data: [{ start: "410102", end: "410185" }] },
];
map.setOption(options);
```

### 多路由 = 多套主题

每个路由页面 `import` 自己的主题传进去就行，效果互不影响：

```ts
// src/views/overview/index.vue
import overviewTheme from "@/themes/overview";   // 面板导出的 A 套
// <ThreeMap :option="overviewTheme" :panel="false" />

// src/views/monitor/index.vue
import monitorTheme from "@/themes/monitor";     // 面板导出的 B 套
// <ThreeMap :option="monitorTheme" :panel="false" />
```

**为什么不会串味**：每次挂载都是 `createDefaultOptions()` 重新合并主题，主题之间不叠加、不残留。
实测 A → B → A 连续切换后，画面平均色与原图完全一致。

同理，同一个页面里切换主题也支持（`option` 有变化会自动重绘，底图不变时只重绘、不重建）：

```ts
const theme = computed(() => (isDark.value ? darkTheme : lightTheme));
// <ThreeMap :option="theme" :panel="false" />
```

**两个注意点**：

1. **不要给地图页加 `<keep-alive>`**。每个 `ThreeMap` 实例都带有自己的 `WebGLRenderer` 和渲染上下文，
   浏览器对同时存在的 WebGL 上下文有上限（通常 16 个）；被缓存的页面不会释放，来回切几次就会报警甚至黑屏。
   如果一定要缓存页面状态，用 `include` / `exclude` 把地图页排除掉。
2. **一个页面只挂一个地图实例**。需要「分屏对比两套风格」时用截图或 `v-if` 二选一切换，不要同时挂两个。

### 主题里的 map 字段

导出的主题会带上 `map` / `mapName`（当时调参用的底图）。加载优先级是：

```
主题里的 map  →  props.area  →  默认 410100
```

也就是说主题里写了 `map`，就以主题为准；想复用同一套样式换个行政区，把主题里这两行删掉、改用 `:area="410300"` 即可。

---

## 配置项（Options）详解

所有配置通过 `ThreeMapOptions` 对象传入，可用 `createDefaultOptions()` 获取默认值后按需覆盖。

```ts
import { createDefaultOptions } from '@/components/ThreeMap/options/threeOption'
const options = createDefaultOptions()
```

---

### config — 地图基础配置

```ts
config: {
  autoScale: true,        // 是否根据容器尺寸自动计算地图缩放比例
  autoScaleFactor: 1,     // autoScale 的缩放倍率微调
  scale: 100,             // autoScale=false 时的手动比例
  depth: 35,              // 地图拉伸厚度（Three.js 单位）
  disableRotate: false,   // 禁用轨道旋转
  disableZoom: false,     // 禁用缩放
  mapSize: 1,             // 地图在画面里的尺寸倍率：1 = 默认，>1 更大（等价于把相机拉近）
}
```

`mapSize` 和 `autoScaleFactor` 不是一回事：后者改的是投影比例，而相机距离是按地图宽换算的，
两者同比放大在画面上互相抵消，观感几乎不变；想真正改「地图在画面里的大小」用 `mapSize`。

---

### background — 画布背景

```ts
background: {
  show: false,             // false = 画布透明（默认），页面/大屏背景直接透出
  color: '#041533',        // show=true 时的底色，雾也用它
}
```

`show` 关掉时 `scene.background` 与清屏 alpha 一并归零，雾也停用（否则远处图元会被染成
一片深蓝）；同时地面镜面会切成「按倒影亮度取透明度」，没倒影的地方完全透明，
不会在大屏背景上留下一块深色矩形。调参台里的「透明背景」开关就是这个字段的反向开关，
「导出配置」会把当前值一并写进主题。

---

### camera — 相机位置（观测角度）

主题里直接写角度，和调参台「视角与尺寸」面板上的两个输入框一致：

```ts
camera: {
  azimuth: 351.4,   // 方位角：0 = 从正前方（+Z）看，90 = 从右侧（+X）看
  elevation: 62.3,  // 俯仰角：90 = 正俯视，越小越接近平视
}
```

也可以继续写方向向量的老格式（两种写法二选一，同时存在时角度优先）：

```ts
camera: {
  x: -0.8,  // 只当方向用：与 y、z 一起决定观测角度
  y: 10.2,  // 越高越偏俯视
  z: 5.3,   // 正值从画面正前方看
}
```

这几个数只表示方向，长度不重要：真实机位距离固定为「地图宽 × 0.7675 ÷ config.mapSize」。
角度写法会在合并主题时换算成 x/y/z（`mergeOptions()` 里的 `resolveCameraAngles()`），
所以运行时只有一套数据，面板改出来的值不会被主题里的角度覆盖；反方向，「导出配置」
输出的是角度而不是 x/y/z，导出文件更好读。
俯仰角超过约 88° 会被轨道控制器的 `maxPolarAngle` 回弹，实际可用范围约 22°~88°。

---

### itemStyle — 区域样式

```ts
itemStyle: {
  topColor:  '#0d2a4b',   // 区域顶面颜色
  sideColor: '#0d2d6e',   // 区域侧面颜色
  uColor:    '#0d2a4b',   // 法线贴图混合色

  range: {
    show: false,           // 是否启用数据颜色映射
    mode: 'range',         // 'range' 连续渐变 | 'separate' 分段规则

    // mode='range' 时：按 [min, max] 在两色之间插值
    color: ['#1A3A6B', '#00FFFF'],
    min: 0,
    max: 100,
    visualMap: {
      show: true,
      maxText: '高',
      minText: '低',
      left: '20px',
      top: '50%',
      textStyle: { fontSize: 12, color: '#fff', ... }
    },

    // mode='separate' 时：按 value 阈值匹配规则
    rules: [
      { value: 0,  color: '#1A3A6B', label: '低' },
      { value: 50, color: '#00BFFF', label: '中' },
      { value: 80, color: '#00FFFF', label: '高' },
    ],
  }
}
```

**数据映射逻辑：**

- `mode: 'range'`：`value` 在 `[min, max]` 间线性插值，从 `color[0]` 渐变到 `color[1]`。
- `mode: 'separate'`：从 `rules` 数组中找到 `value >= rule.value` 的最后一条规则取色。

---

### label — 区域标注

```ts
label: {
  show: true,
  name: '',                   // 固定文本（空时显示 feature.properties.name）
  isFormatter: false,         // 是否使用自定义 formatter
  formatter: null,            // (data) => string，返回 HTML 字符串
  formatterHtml: '',          // 静态 HTML 字符串（不含动态数据）
  className: '',              // 额外 CSS 类名
  offset: [0, 0],             // [水平, 垂直] 偏移（像素）
  itemStyle: {
    padding: [2, 6, 2, 6],
    backgroundColor: 'rgba(0,0,0,0)',
    borderRadius: 4,
    borderColor: 'transparent',
    borderWidth: 0,
    textStyle: {
      fontSize: 12,
      color: '#DFF6FF',
      fontWeight: 'normal',
      ...
    }
  }
}
```

---

### tooltip — 提示框

```ts
tooltip: {
  show: true,
  isFormatter: false,
  formatter: (data) => `<span>${data.name}：${data.value}</span>`,
  formatterHtml: '',       // 静态 HTML 优先级高于 formatter
  itemStyle: {
    backgroundColor: 'rgba(8,20,45,0.82)',
    borderColor: 'rgba(72,204,255,0.45)',
    borderWidth: 0,
    borderStyle: 'solid',
    borderRadius: 5,
    padding: [10, 10, 10, 10],
    color: '#DFF6FF',
    fontSize: 14,
    minWidth: 80,
    width: 'max-content',
  }
}
```

---

### glow — 辉光后处理

```ts
glow: {
  show: true,        // 是否启用 UnrealBloom 辉光
  threshold: 0,      // 亮度阈值（0~1）
  strength: 1,       // 辉光强度
  radius: 0,         // 辉光扩散半径
}
```

> 辉光仅对标记了 `_isGlow = true` 的对象生效（包括区域边界、电子围栏等），通过双 Composer + 场景遍历实现选择性辉光。

---

### grid — 网格

```ts
grid: {
  show: false,
  color: '#2BD9FF',
  opacity: 0.2,
}
```

---

### foundation — 底图装饰

```ts
foundation: {
  show: false,
  size: 800,           // 底盘尺寸
  speed: 0.5,          // 旋转速度（isRotate=true 时）
  image: 'default',    // 贴图路径，'default' 使用内置图片
  isRotate: true,      // 是否旋转
  static: false,       // true 时静止显示
}
```

---

### mirror — 镜面反射

```ts
mirror: {
  show: false,
  color: ['#020B1F', '#00D2FF'],   // 渐变底色 [顶色, 底色]
  opacity: 1,                      // 倒影浓度：1 = 最实，越小越淡，0 = 倒影消失
}
```

`opacity` 只调地面倒影的浓度，地图本体（顶面 / 侧面）完全不受影响；
拖面板「倒影透明度」是纯 uniform 改动，不重建离屏反射纹理，所以是实时的。

若 `opacity = 1` 仍能看到背景“穿透”：那不是倒影淡，而是地图本体自己透 ——
侧面的不透明度由 `side.opacity` 控制，把它设成 `1` 才能挡住侧墙背后的一切。

`background.show = false` 时镜面会切成「玻璃地面」：不再铺底色、也不再吃场景光，
倒影直接叠到大屏背景上，并且会贴到地图底面（不再隔一道间隙），
虚拟相机视锥之外与平面远端都会淡出，不会在地图上拖出一块直边的灰底。

这个模式下倒影是**本体的真实镜像**：颜色按 sRGB 解码后原样输出（不和光照/底板色掺和）、
不再做深度衰减、alpha 直接取本体自己的透明度 —— 于是两侧都设 `1` 时，
倒影和真实侧面除了镜像翻转之外看起来是同一堵墙。

---

### wall — 电子围栏

```ts
wall: {
  show: false,
  height: 40,           // 围栏高度
  color: '#4DEBFF',     // 围栏颜色
}
```

---

### texture — 地图贴图

```ts
texture: {
  show: true,
  autoRepeat: false,              // 自动计算重复次数
  repeat: { x: 0.0927, y: 0.124 },
  offset: { x: 0.5918, y: 0.324 },
  image: 'default',               // 贴图 URL 或 'default'
}
```

---

### side — 侧面水晶

挤出体的立面（顶面以下的「水晶墙」），与顶面材质完全独立：

```ts
side: {
  bottomColor: '#0a2952',   // 底部深蓝
  topColor: '#6fb0d8',      // 顶部亮青
  stripeColor: '#d8f0ff',   // 顶沿亮线 / 水晶条纹高光
  stripeScale: 3.2,         // 条纹密度
  stripeStrength: 0.82,     // 条纹强度
  tintColor: '#ffffff',     // 染色色相（白色 = 保持冰蓝）
  tintStrength: 0,          // 染色强度 0~1
  opacity: 1,               // 侧面不透明度：1 = 整面实心，越小越透（底部比顶部先透）
}
```

`opacity` 只管地图侧面，与 `mirror.opacity`（地面倒影）是两个独立参数：
想挡住在侧面背后能看见的倒影，把侧面设成 `1`；调低则按竖向渐变淡出，像悬浮的玻璃。
入场动画的淡入是在它之上再乘一层，所以入场时依然会从透明渐显到你设的值。
面板「侧面水晶 → 侧面透明度」改的就是这个值。

---

### autoRotate — 自动旋转

```ts
autoRotate: {
  autoRotate: false,
  autoRotateSpeed: 2,    // 旋转速度（度/秒）
}
```

---

### emphasis — 高亮样式

```ts
emphasis: {
  show: true,
  topColor: '#1E90FF',     // hover 时顶面颜色
  textStyle: { fontSize: 14, color: '#fff', fontWeight: 'bold', ... }
}
```

---

### scene — 场景特效

```ts
scene: {
  groundRing: true,        // 地面光圈（图片贴片，缓慢自转）
  groundRingScale: 1,      // 地面光圈自己的缩放：1 = 约 1.07 倍地图宽，与地图尺寸互不影响
  beams: true,             // 漂浮光柱
  cones: true,             // 区县标点（光锥 + 光环）
  trail: true,             // 边缘流光：沿城市外轮廓循环跑的一道光
  trailSpeed: 10,          // 跑完整圈所需秒数，越小越快
  trailLength: 0.3,        // 拖尾长度，占整圈的比例（0~1）
  trailBrightness: 1,      // 亮度倍率，1 为默认
  intro: true,             // 入场动画（相机推进 + 厚度生长 + 淡入）
}
```

`trail` 的三个参数只影响边缘流光本身，关掉 `trail` 后它们无效（面板里会置灰）。
默认值照 3D 郑州 demo：10 秒一圈、尾巴占 30%。想让光带更抢眼就调高 `trailBrightness`；
想变成快速扫过的一小段，就把 `trailSpeed` 降到 3~5、`trailLength` 降到 0.1。

> 流光只沿**最长的一圈**轮廓跑。多飞地城市（外轮廓由多个碎环组成）不会每个小环都跑一遍光。

`beams`（漂浮光柱）和 demo 有一处刻意的差异：demo 把 20 根光条随机撒在
`mapWidth × 1.33` 的方框里、并且从地面一路升到 0.66~2 倍地图宽的高空，
结果是又长又直的光带横穿空白背景、和地图完全脱节，很容易被误认成
「没贴边的边缘流光」。这里改成**只撒在城市轮廓以内**、并且只在**地图顶面上方
那层薄空气**里浮动，落点用奇偶规则做多边形内判定（洞也一起算）。

如果就想要 demo 那种满天碎光，把 `setEnvironment` 里的
`region` / `topY` 两个参数去掉即可退回原行为。

### lineStyle / outLineStyle — 边线

```ts
lineStyle: {
  color: '#2BD9FF',      // 省级边界线颜色（辉光对象）
}
outLineStyle: {
  color: '#2BD9FF',      // 轮廓线颜色
}
```

---

## 数据（data）格式

`data` 是顶层地图区域的数据数组，用于颜色映射和 tooltip 显示。

```ts
data: [
  {
    district: '110000', // 行政区 adcode（字符串/数字）或 [lng, lat] 坐标
    name: '北京市', // 可选，覆盖 GeoJSON 中的名称
    value: 85, // 数值（用于色阶映射和 tooltip）
    color: null, // 可选，直接指定该区域颜色（优先级最高）
  },
  // ...
]

```

| 字段       | 类型                             | 说明                          |
| ---------- | -------------------------------- | ----------------------------- |
| `district` | `string \| number \| [lng, lat]` | 行政区 adcode 或经纬度坐标    |
| `name`     | `string`                         | 区域名称                      |
| `value`    | `number`                         | 数值，参与色阶映射            |
| `color`    | `string \| null`                 | 直接指定颜色，覆盖 range 映射 |

郑州市数据请参考`src/data/410100-districts.json`

---

## Series 图层

通过 `series` 数组添加多个图层，每个图层有独立的 `type` 和配置。

```ts
series: [
  { type: 'marker', ... },
  { type: 'scatter', ... },
  { type: 'cylinder', ... },
]
```

---

### marker — 标记点

在指定区域或坐标上放置自定义图标。

```ts
{
  type: 'marker',
  seriesName: '城市标记',
  symbol: '',                         // SVG 字符串或图片 URL
  symbolSize: [30, 30],               // [宽, 高]（像素）
  symbolSizeFormatter: null,          // (data) => [w, h]，动态尺寸
  offset: [0, 0],                     // 偏移量（像素）
  className: '',
  label: { ... },                     // 参见 label 配置
  data: [
    { district: '110000', name: '北京', value: 100 },
    { district: [116.4, 39.9], name: '自定义坐标' },
  ]
}
```

---

### scatter — 扩散点

带呼吸环动画的散点图层。

```ts
{
  type: 'scatter',
  seriesName: '热点',
  spotColor: '#00FFFF',      // 中心点颜色
  spotSize: 0.06,            // 中心点半径（Three.js 单位）
  spotSizeFormatter: null,   // (data) => size，动态大小
  spotSeparate: 0,           // 中心点与地图表面的间距
  ringColor: '#00FFFF',      // 扩散环颜色
  ringRatio: 3,              // 扩散环最大半径倍率
  ringSeparate: 0,           // 扩散环间距
  offset: [0, 0],
  label: { ... },
  data: [...]
}
```

---

### prism — 棱柱

按 `value` 比例映射高度的棱柱图层。

```ts
{
  type: 'prism',
  seriesName: '棱柱图',
  prismType: 3,              // 3=三棱柱 | 4=四棱柱（方形） | 6=六棱柱
  size: 0.15,                // 棱柱底面半径
  maxHeight: 3,              // 最大高度（Three.js 单位）
  minHeight: 0.3,            // 最小高度
  offset: [0, 0],
  className: '',
  label: { ... },
  itemStyle: {
    color: ['#00BFFF', '#00FFFF', '#ffffff'],  // [底色, 顶色, 高亮色]
  },
  data: [...]
}
```

---

### cylinder — 圆柱

渐变色柱状图或发光塔。

```ts
{
  type: 'cylinder',
  seriesName: '柱状图',
  mode: 'cylinder',          // 'cylinder' 渐变柱 | 'tower' 发光塔
  color: ['#00BFFF', '#00FFFF'],  // [底色, 顶色]（cylinder 模式）
  towerColor: '#00FFFF',     // tower 模式颜色
  size: 0.1,                 // 底面半径
  maxHeight: 3,
  minHeight: 0.3,
  separate: 0,               // 柱底与地面的间距
  offset: [0, 0],
  label: { ... },
  data: [...]
}
```

---

### flight — 飞线

两点之间的弧线动画。

```ts
{
  type: 'flight',
  seriesName: '飞线',
  points: 50,                // 飞线粒子数量
  flightLen: 0.2,            // 飞线头部长度比例（0~1）
  speed: 0.003,              // 移动速度
  flightColor: ['#00FFFF', '#0080FF', '#00BFFF'],  // 渐变色数组
  headSize: 0.04,            // 头部粒子大小
  data: [
    { start: '110000', end: '310000' },          // adcode
    { start: [116.4, 39.9], end: [121.5, 31.2] } // 经纬度
  ]
}
```

---

## 事件 API

事件系统由 `ThreeMap` 类提供，`index.vue` 在内部使用 `map.on('dblclick', ...)` 消费了下钻事件。自定义集成时通过 `on()` / `off()` 注册：

| 事件       | 触发时机             | 回调参数                       |
| ---------- | -------------------- | ------------------------------ |
| `click`    | 点击区域/散点/柱体   | `{ name, adcode, value, ... }` |
| `dblclick` | 双击区域（触发下钻） | `{ name, adcode, value, ... }` |
| `change`   | 相机位置改变         | `THREE.Camera` 实例            |

```ts
// 直接使用 ThreeMap 类
const map = new ThreeMap(containerEl, tooltipEl)
map.on('click', (data) => {
  console.log(data.name, data.adcode)
})
map.on('dblclick', (data) => {
  // 手动实现下钻
})
map.off('click') // 移除 click 监听
map.off() // 移除所有监听
```

---

## 地图注册与下钻

```ts
// 注册地图（返回完整 GeoJSON FeatureCollection）
const mapJson = await map.registerMap(
  '100000', // GeoJSON 文件 adcode
  '100000', // 注册名（用于 options.map 引用）
  options.config, // MapConfig
)

// 切换地图后调用 setOption 渲染
map.setOption({
  ...options,
  map: '100000',
})
```

内置的 GeoJSON 文件位于 `src/assets/geoJson/`，以省级 adcode 命名（如 `110000.json` = 北京）。`100000.json` 为中国全图，`100000_bound.json` 为国界边界。

---
## 导出配置

```ts
import type { ThreeMapTheme } from "@/components/ThreeMap/options/theme";

/**
 * 由控制面板导出的地图主题。
 * 用法：<ThreeMap :option="mapTheme" :panel="false" />
 */
const mapTheme: ThreeMapTheme = {
  // ========== 基础配置：自适应、交互开关、厚度与构图 ==========
  config: {
    autoScale: true, // 是否按容器尺寸自动计算投影缩放比例
    disableRotate: false, // 是否禁用鼠标拖拽旋转
    disableZoom: false, // 是否禁用鼠标滚轮缩放
    autoScaleFactor: 1, // autoScale 的投影倍率微调：1 = 原始；不直接改画面里的地图大小
    scale: 100, // autoScale=false 时手动指定的投影缩放比例
    depth: 53, // 挤出厚度，千分比：53 = 地图宽度的 5.3%
    mapSize: 1 // 地图在画面里的尺寸倍率：1 = 默认，>1 更大（等价于相机拉近）
  },
  // ========== 画布背景：关掉时页面背景直接透出 ==========
  background: {
    show: false, // false = 画布透明；true = 绘制底色并启用雾
    color: "#041533" // show=true 时的底色，同时作为雾色
  },
  // ========== 相机自动旋转 ==========
  autoRotate: {
    autoRotate: false, // 是否开启相机自动旋转
    autoRotateSpeed: 2 // 旋转速度（度/秒）
  },
  // ========== 相机视角：主题里写角度，合并时换算成 x/y/z ==========
  camera: {
    azimuth: 351.4, // 方位角（度）：0 = 从 +Z 正面看，90 = 从 +X 右侧看
    elevation: 62.3 // 俯仰角（度）：90 = 正俯视，越小越接近平视；合并时换算回方向向量
  },
  // ========== 调试网格：一般保持关闭 ==========
  grid: {
    show: false, // 是否显示坐标网格（调试用）
    color: "#2BD9FF", // 网格线颜色
    opacity: 0.2 // 网格线透明度
  },
  // ========== 底座圆盘与旋转动画 ==========
  foundation: {
    show: false, // 是否显示底座
    size: 800, // 底盘尺寸
    speed: 0.5, // 旋转速度（isRotate=true 时生效）
    image: "default", // 贴图路径，'default' 使用内置图片
    isRotate: true, // 是否启用旋转动画
    static: false // true = 静止显示
  },
  // ========== 悬停提示框 ==========
  tooltip: {
    show: true, // 是否启用 tooltip
    content: "", // 静态提示内容，优先级低于 formatter / formatterHtml
    styleType: "0", // 样式类型标识，保留字段
    isFormatter: false, // 是否启用自定义格式化
    formatterHtml: "", // 静态 HTML，优先级最高；函数 formatter 无法序列化，导出时被剔除
    itemStyle: {
      backgroundColor: "rgba(8, 20, 45, 0.82)", // 半透明深蓝背景
      borderColor: "rgba(72, 204, 255, 0.45)", // 淡蓝色边框
      borderWidth: 0, // 边框宽度，0 = 无边框
      padding: [
        10, // 上
        10, // 右
        10, // 下
        10 // 左
      ],
      color: "#DFF6FF", // 文字颜色
      fontSize: 14, // 字号
      minWidth: 80, // 最小宽度
      width: "max-content", // 自适应内容宽度
      borderRadius: 5, // 圆角
      borderStyle: "solid" // 边框样式
    }
  },
  // ========== 地面倒影：opacity 只影响倒影，不影响地图本体 ==========
  mirror: {
    show: true, // 是否显示镜面反射
    color: [
      "#020B1F", // 渐变起始色
      "#00D2FF" // 渐变结束色
    ],
    opacity: 1 // 倒影浓度：1 = 最实，0 = 倒影消失
  },
  // ========== 电子围栏（边界墙） ==========
  wall: {
    show: false, // 是否显示围栏
    height: 40, // 围栏高度
    color: "#4DEBFF" // 围栏颜色
  },
  // ========== 顶面纹理贴图 ==========
  texture: {
    show: true, // 是否启用贴图
    autoRepeat: false, // 是否自动计算 UV 重复次数
    repeat: {
      x: 0.0927, // U 方向重复次数
      y: 0.124 // V 方向重复次数
    },
    offset: {
      x: 0.5918, // U 方向偏移
      y: 0.324 // V 方向偏移
    },
    image: "default" // 贴图 URL，'default' 使用内置暗底路网
  },
  // ========== 底图：优先级高于 props.area，换地区可删掉这两行 ==========
  map: "410100", // 行政区划代码（410100 = 郑州）
  mapName: "郑州", // 地图名称标识，通常随 map 一起删掉即可
  // ========== Bloom 辉光后处理：默认关闭，开启会把亮色推白 ==========
  glow: {
    show: false, // 是否启用 UnrealBloom 辉光（仅对标记对象生效）
    threshold: 0, // 亮度阈值（0~1），低于阈值的像素不发光
    strength: 1, // 辉光强度
    radius: 0 // 辉光扩散半径
  },
  // ========== 区域样式与数据映射 ==========
  itemStyle: {
    range: {
      show: false, // 是否启用数据颜色映射
      mode: "range", // 'range' = 连续渐变 | 'separate' = 分段规则
      rules: [
        {
          value: 0, // 阈值：数据值 >= 0 命中此规则
          color: "#27F4FF", // 命中后的颜色
          label: ">=0" // 图例/提示文案
        }
      ], // mode='separate' 时使用；数组整体替换，不做逐项合并
      color: [
        "#18D7FF", // 渐变起始色（低值）
        "#2665FF" // 渐变结束色（高值）
      ], // mode='range' 时使用
      min: 0, // 数据最小值，用于插值
      max: 1000, // 数据最大值，用于插值
      visualMap: {
        show: false, // 是否显示色阶图例
        left: "2%", // 图例水平位置
        top: "2%", // 图例垂直位置
        maxText: "高", // 最大值文案
        minText: "低", // 最小值文案
        textStyle: {
          fontSize: 12, // 图例字号
          color: "#FFF", // 图例文字颜色
          fontStyle: "normal", // 字体风格
          fontWeight: "normal", // 字重
          fontFamily: "Microsoft Yahei", // 字体
          textDecoration: "", // 文本装饰
          textShadow: "" // 文字阴影
        }
      }
    },
    topColor: "rgba(42, 233, 255, 0.95)", // 区域顶面颜色
    sideColor: "rgba(59, 132, 255, 0.92)", // 区域侧面颜色
    uColor: "rgba(19, 48, 128, 1)" // 法线贴图混合色（shader 扫光 U 通道）
  },
  // ========== 鼠标悬停高亮：默认比常态更醒目 ==========
  emphasis: {
    show: true, // 是否启用 hover 高亮
    topColor: "#73F8FF", // hover 时的顶面颜色
    textStyle: {
      fontSize: 15, // hover 时字号
      color: "#FFFFFF", // hover 时文字颜色
      fontStyle: "normal", // 字体风格
      fontWeight: "bold", // 字重加粗
      fontFamily: "Microsoft Yahei", // 字体
      textDecoration: "", // 文本装饰
      textShadow: "0 0 8px rgba(150, 220, 255, 1), 0 0 18px rgba(80, 170, 255, 0.85)" // 双层光晕
    }
  },
  // ========== 边界线 ==========
  lineStyle: {
    color: "#78CFFF" // 区域内部边界线颜色（辉光对象）
  },
  outLineStyle: {
    show: false, // 是否显示外轮廓描线；贴图自带边界光时建议关闭
    color: "rgba(83, 198, 230, 1)" // 外轮廓线颜色
  },
  // ========== 区域标签 ==========
  label: {
    show: true, // 是否显示标签（入场动画结束后出现）
    name: "{b}", // 标签模板：{a}=系列名，{b}=数据名称，{c}=数值，{d}=adcode
    isFormatter: false, // 是否使用自定义 formatter / formatterHtml
    formatter: null, // 函数无法序列化，导出时为 null；动态内容请用 isFormatter + formatterHtml
    formatterHtml: "", // 静态 HTML，优先级高于 formatter
    className: "", // 额外 CSS 类名
    offset: [
      0, // 水平偏移（像素）
      0 // 垂直偏移（像素）
    ],
    itemStyle: {
      padding: [
        0, // 上
        0, // 右
        0, // 下
        0 // 左
      ],
      backgroundColor: "rgba(50,50,50,0)", // 标签背景色，0 透明度 = 无底色
      borderRadius: 5, // 圆角
      borderColor: "rgba(255,255,255,0)", // 边框色，0 透明度 = 无边框
      borderWidth: 0, // 边框宽度
      textStyle: {
        fontSize: 13, // 字号
        color: "#d7ebff", // 淡蓝白文字
        fontStyle: "normal", // 字体风格
        fontWeight: "normal", // 字重
        fontFamily: "Microsoft Yahei", // 字体
        textDecoration: "", // 文本装饰
        textShadow: "0 0 6px rgba(120, 190, 255, 0.9), 0 0 14px rgba(60, 130, 230, 0.6)", // 双层光晕
        letterSpacing: "1px" // 字间距
      }
    }
  },
  // ========== 顶面材质：图片/纯色 × 法线浮雕 + 轮廓光 + 中心压暗 ==========
  surface: {
    mapMode: "image", // 'image' = 图片贴图 | 'color' = 纯色铺色
    mapColor: "#0d2340", // mapMode='color' 时的铺色
    tintColor: "#ffffff", // 图片模式染色色相，白色 = 不改色
    tintStrength: 0, // 染色强度 0~1，0 = 原图色相
    normalMap: true, // 是否启用法线贴图浮雕
    edgeGlow: true, // 是否启用轮廓光带（基于贴图 alpha）
    reliefStrength: 0.45, // 浮雕强度
    glowLevel: 1, // 轮廓光整体倍率
    centerDark: 0.34, // 中心压暗，让四周边缘更跳
    mapTex: null // 自定义贴图；null = 使用内置暗底路网
  },
  // ========== 侧面水晶：挤出体立面，与顶面完全独立 ==========
  side: {
    bottomColor: "#0a2952", // 底部深蓝
    topColor: "#6fb0d8", // 顶部亮青
    stripeColor: "#d8f0ff", // 顶沿亮线 / 水晶条纹高光
    stripeScale: 3.2, // 条纹密度
    stripeStrength: 0.82, // 条纹强度
    tintColor: "#ffffff", // 染色色相，白色 = 保持冰蓝
    tintStrength: 0, // 染色强度 0~1
    opacity: 1 // 侧面不透明度：1 = 实心，越小越透（底部比顶部先透）
  },
  // ========== 场景特效开关 ==========
  scene: {
    groundRing: true, // 地面光圈（图片贴片，缓慢自转）
    groundRingScale: 1, // 光圈自身缩放：1 ≈ 1.07 倍地图宽，与 mapSize 互不影响
    beams: true, // 漂浮光柱（只撒在城市轮廓内的薄空气层）
    cones: true, // 区县标点（光锥 + 光环）
    trail: true, // 边缘流光：沿城市外轮廓循环跑的一道光
    trailSpeed: 10, // 跑完整圈所需秒数，越小越快
    trailLength: 0.3, // 拖尾长度，占整圈的比例（0~1）
    trailBrightness: 1, // 流光亮度倍率，1 = 默认
    intro: true // 入场动画（相机推进 + 厚度生长 + 淡入）
  },
  seriesName: "map", // 主地图系列名称，一般保持默认
  // ========== 附加系列：这里只保留样式，data 导出时被清空 ==========
  series: [
    {
      type: "flight", // 图层类型：flight = 飞线
      seriesName: "flight-1", // 系列名称，用于区分多个 series
      points: 72, // 每条弧线的采样段数
      flightLen: 50, // 飞行流光的长度（粒子数量），决定可见窗口大小
      speed: 10, // 飞行速度，每帧移动的索引步长，越大越快
      flightColor: [
        "#5ea8f0", // 尾段颜色
        "#e6f6ff" // 头部高光
      ],
      headSize: 1, // 头部粒子放大系数，用于强调飞行方向
      data: [] // 导出时清空；自行填充 { start, end }，支持 adcode 或 [lng, lat]
    }
  ]
};

export default mapTheme;

```
导出配置的文件请放在`src/themes/`文件夹下，在页面中进行引用即可，例如：
```vue
<script setup lang="ts">
import ThreeMap from "@/components/ThreeMap/index.vue";
import monitorTheme from "@/themes/monitor"; //主题文件
</script>

<template>
  <ThreeMap :option="monitorTheme" :panel="false" />
</template>

```

## 目录结构

```
src/
├── assets/
│   ├── geoJson/              # 全国省市 GeoJSON 文件
│   │   ├── 100000.json       # 中国全图
│   │   ├── 100000_bound.json # 国界边界
│   │   ├── 110000.json       # 北京
│   │   └── ...               # 其他省份
│   └── images/               # 内置纹理图片
│
└── components/ThreeMap/
    ├── index.vue             # Vue 组件入口（含面板、视觉映射、下钻）
    ├── ThreeMap.ts           # 核心类（场景管理、渲染循环、事件系统）
    ├── ControlPanel.vue      # 可视化控制面板
    ├── types.ts              # 全量 TypeScript 类型定义
    │
    ├── options/              # 默认配置工厂
    │   ├── threeOption.ts    # createDefaultOptions()
    │   ├── createLabel.ts
    │   ├── createMarker.ts
    │   ├── createPrism.ts
    │   ├── createCylinder.ts
    │   ├── createFlight.ts
    │   └── createScatter.ts
    │
    └── utils/                # 渲染工具函数
        ├── drawDistrict.ts   # 行政区拉伸 + 贴图 + 标注
        ├── drawOutLine.ts    # 边界线 + 电子围栏
        ├── drawGlow.ts       # UnrealBloom 辉光后处理
        ├── drawPlane.ts      # 镜面 / 渐变底板
        ├── drawGrid.ts       # 网格
        ├── drawFoundation.ts # 底图装饰
        ├── drawMarker.ts     # Marker 图层
        ├── drawScatter.ts    # Scatter 散点图层
        ├── drawPrism.ts      # Prism 棱柱图层
        ├── drawCylinder.ts   # Cylinder 圆柱图层
        ├── drawFlight.ts     # Flight 飞线图层
        ├── drawLabel.ts      # CSS2D 标注渲染
        ├── addTooltip.ts     # Tooltip 逻辑
        ├── helpers.ts        # 通用工具函数
        └── register.ts       # GeoJSON 加载 + 边界计算
```

---

## 开发指南

### 推荐 IDE

[VS Code](https://code.visualstudio.com/) + [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) 扩展（禁用 Vetur）。

### 代码格式化

```sh
npm run format   # 使用 oxfmt 格式化 src/ 目录
```

### 新增图层

1. 在 `utils/` 新建 `drawXxx.ts`，导出形如 `drawXxx(this: ThreeMapContext, options, config)` 的函数。
2. 在 `options/` 新建 `createXxx.ts`，返回对应类型的默认配置。
3. 在 `types.ts` 补充 `XxxSeriesOptions` 接口并加入 `SeriesOptions` 联合类型。
4. 在 `ThreeMap.ts` 的 `setOption()` 的 switch 分支中注册新类型。

---

## 依赖说明

| 依赖         | 版本   | 用途                           |
| ------------ | ------ | ------------------------------ |
| `three`      | ^0.183 | 3D 渲染引擎                    |
| `d3-geo`     | ^3.1   | 地理投影（墨卡托）             |
| `@turf/turf` | ^7.3   | GeoJSON 边界计算（union/bbox） |
| `tinycolor2` | ^1.6   | 颜色解析与转换                 |
| `vue`        | ^3.5   | UI 框架                        |

---

## 浏览器兼容

| 浏览器        | 最低版本 |
| ------------- | -------- |
| Chrome / Edge | 90+      |
| Firefox       | 90+      |
| Safari        | 15+      |

> 需要 WebGL 2 支持。不支持 IE。

---

## License

[MIT](./LICENSE)
