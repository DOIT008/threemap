<script setup lang="ts">
import { onMounted, ref } from "vue";
import PanelTitle from "./PanelTitle.vue";
import CountValue from "./CountValue.vue";
import titleImg from "@/assets/codesign/panel-title-efficiency.png";
import dashboard from "@/data/dashboard.json";

const data = dashboard.efficiency;

// 入场扫入：dasharray 从 0 过渡到目标值
const swept = ref(false);
onMounted(() => {
  requestAnimationFrame(() => {
    swept.value = true;
  });
});

// spec：两个半圆表盘圆心 (112.5,118.5) / (319.5,118.5)；圆形 5 的 127×63.5 是弧线路径包围盒（不是含描边的可视盒）→ 半径 63.5、线宽 10
const GAUGES = [
  { cx: 112.5, cy: 118.5 },
  { cx: 319.5, cy: 118.5 },
];
const R_ARC = 63.5;
const R_TICK = 80.75;

/** 半圆刻度坐标：0 在左、100 在右，绕顶部半周 */
function tick(i: number, v: number): { x: number; y: number } {
  const g = GAUGES[i]!;
  const a = Math.PI - (v / 100) * Math.PI;
  return { x: g.cx + Math.cos(a) * R_TICK, y: g.cy - Math.sin(a) * R_TICK };
}
const TICKS = [0, 20, 40, 60, 80, 100];

/** spec：圆形 8–11 / 8–11 copy —— 4×4 纯白点，落在环带中心线上（半径 ≈63.7，环带 58.5..68.5） */
const DOTS = [
  { cx: 61, cy: 81 },
  { cx: 93, cy: 58 },
  { cx: 132, cy: 58 },
  { cx: 163, cy: 81 },
  { cx: 268, cy: 81 },
  { cx: 300, cy: 58 },
  { cx: 339, cy: 58 },
  { cx: 370, cy: 81 },
];

/** spec：99.21% (124,416) / 0.52% (336,416) 的居中锚点 */
const VALUE_CENTERS = [114, 321];
/** spec：路径 3 梯形光晕 (66,118) 94.72×16.61、路径 2 亮线 (67,136) 92.94×0.01（描边 3），右表盘整体 +207 */
const DECO_LEFTS = [66, 273];
/** spec：提前办结率 (110,444) / 超时办结率 (317,444) 的居中锚点 */
const LABEL_CENTERS = [113.5, 320.5];
/** spec：底部三项数值居中锚点 */
const STAT_CENTERS = [102, 225, 339];
</script>

<template>
  <section class="pe">
    <PanelTitle :img="titleImg" :width="442" :enter-left="228" :top="-10" />

    <svg class="pe__canvas" viewBox="0 0 432 239">
      <defs>
        <linearGradient :id="`pe-grad-${i}`" v-for="(g, i) in GAUGES" :key="`g-${i}`" x1="0" y1="0" x2="1" y2="0">
          <template v-if="i === 0">
            <stop offset="0" stop-color="#008CFF" />
            <stop offset="1" stop-color="#31D8D8" />
          </template>
          <template v-else>
            <stop offset="0" stop-color="#F78160" />
            <stop offset="1" stop-color="#FFB199" />
          </template>
        </linearGradient>
      </defs>

      <template v-for="(g, i) in GAUGES" :key="`gauge-${i}`">
        <!-- spec：圆形 5 —— 127×63.5 半圆底，10px 描边，opacity .6 -->
        <path
          :d="`M ${g.cx - R_ARC} ${g.cy} A ${R_ARC} ${R_ARC} 0 0 1 ${g.cx + R_ARC} ${g.cy}`"
          fill="none"
          stroke="rgba(33,74,158,0.42)"
          stroke-width="10"
          stroke-linecap="round"
        />
        <path
          :d="`M ${g.cx - R_ARC} ${g.cy} A ${R_ARC} ${R_ARC} 0 0 1 ${g.cx + R_ARC} ${g.cy}`"
          fill="none"
          :stroke="`url(#pe-grad-${i})`"
          stroke-width="10"
          stroke-linecap="round"
          pathLength="100"
          :stroke-dasharray="`${swept ? (data.gauges[i]?.value ?? 0) : 0} 100`"
          class="pe__arc"
        />
        <text
          v-for="t in TICKS"
          :key="`t-${i}-${t}`"
          :x="tick(i, t).x"
          :y="tick(i, t).y"
          text-anchor="middle"
          dominant-baseline="middle"
          class="pe__tick"
        >
          {{ t }}
        </text>
      </template>

      <!-- spec：4×4 纯白点 @ 20/40/60/80，落在进度条环带中心线上 -->
      <circle v-for="(d, i) in DOTS" :key="`dot-${i}`" :cx="d.cx" :cy="d.cy" r="2" class="pe__dot" />
    </svg>

    <!-- spec：路径 3 梯形光晕 + 路径 2 底部亮线 -->
    <div v-for="(g, i) in GAUGES" :key="`deco-${i}`" class="pe__deco" :style="{ left: `${DECO_LEFTS[i]}px` }">
      <span class="pe__deco-glow" />
      <span class="pe__deco-line" />
    </div>

    <span
      v-for="(gauge, i) in data.gauges"
      :key="`v-${gauge.label}`"
      class="pe__value"
      :style="{ left: `${VALUE_CENTERS[i]}px` }"
    >
      <CountValue :value="`${gauge.value.toFixed(2)}${gauge.suffix}`" />
    </span>

    <span
      v-for="(gauge, i) in data.gauges"
      :key="`l-${gauge.label}`"
      class="pe__label"
      :style="{ left: `${LABEL_CENTERS[i]}px` }"
    >
      {{ gauge.label }}
    </span>

    <div class="pe__stats" />
    <!-- 设计稿实测：底部数据区左/右/下三边 1px 抱框（顶部不闭合） -->
    <div class="pe__frame" />

    <div
      v-for="(stat, i) in data.stats"
      :key="stat.label"
      class="pe__stat"
      :style="{ left: `${STAT_CENTERS[i]}px` }"
    >
      <span class="pe__stat-label">{{ stat.label }}</span>
      <span class="pe__stat-val"><CountValue :value="stat.value" /></span>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use "./panel" as *;

.pe {
  @include db-panel(239px);

  &__canvas {
    position: absolute;
    left: 0;
    top: 0;
    width: 432px;
    height: 239px;
    display: block;
  }

  &__tick {
    font-size: 11px;
    fill: rgba(113, 144, 205, 1);
  }

  &__arc {
    transition: stroke-dasharray 1.4s cubic-bezier(0.22, 0.8, 0.3, 1);
    filter: drop-shadow(0 0 4px rgba(0, 140, 255, 0.5));
  }

  &__dot {
    fill: rgba(255, 255, 255, 1);
  }

  // spec：路径 3 —— 梯形光晕 (66,118) 94.72×16.61，竖向渐变底亮顶透，opacity .5 + 背景模糊
  // 顶边宽度按设计稿像素边缘测得（斜率 ≈1.15px/行）→ 75.6，左右各收 9.56 / 85.16
  &__deco {
    position: absolute;
    top: 118px;
    width: 94.72px;
    height: 16.61px;
    pointer-events: none;

    &-glow {
      position: absolute;
      inset: 0;
      clip-path: polygon(9.56px 0, 85.16px 0, 100% 100%, 0 100%);
      background: linear-gradient(0deg, rgba(28, 58, 176, 1) 0%, rgba(0, 32, 72, 0) 100%);
      opacity: 0.5;
      backdrop-filter: blur(6.34px);
    }

    // spec：路径 2 —— (67,136) 92.94 宽、3px 描边，横向渐变中亮向两端透明
    &-line {
      position: absolute;
      left: 1px;
      top: 16.5px;
      width: 92.94px;
      height: 3px;
      background: linear-gradient(
        90deg,
        rgba(72, 152, 254, 0) 0%,
        rgba(72, 152, 254, 1) 49%,
        rgba(72, 152, 254, 0) 100%
      );
    }
  }

  // spec：数值框 y=81，高 22，18px
  &__value {
    position: absolute;
    top: 81px;
    transform: translateX(-50%);
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 18px;
    font-weight: 700;
    line-height: 22px;
    color: rgba(255, 255, 255, 1);
    white-space: nowrap;
    text-shadow: 0 0 8px rgba(36, 160, 255, 0.5);
  }

  // spec：名称框 y=109，高 24.92
  &__label {
    position: absolute;
    top: 109px;
    transform: translateX(-50%);
    font-size: 12px;
    line-height: 24.92px;
    color: rgba(198, 231, 255, 0.8);
    white-space: nowrap;
  }

  // spec：矩形 1 —— (60,495,394×62) 竖向渐变底板
  &__stats {
    position: absolute;
    left: 22px;
    top: 160px;
    width: 394px;
    height: 62px;
    border-radius: 1px;
    background: linear-gradient(0deg, rgba(9, 32, 117, 1) 0%, rgba(9, 32, 117, 0) 100%);
  }

  // 设计稿实测：矩形 1 的左/右/下三边 1px 抱框（顶部不闭合）
  // 竖线自 y=179 起由透明渐显到 #0F77FB（y≈214 之后为纯色），横线 #0F77FB→#1EB9FE(中心)→#0F77FB
  &__frame {
    position: absolute;
    left: 22px;
    top: 179px;
    width: 394px;
    height: 43px;
    pointer-events: none;
    $side: linear-gradient(180deg, rgba(15, 119, 251, 0) 0%, rgba(15, 119, 251, 1) 92%);
    background:
      $side left top / 1px 100% no-repeat,
      $side right top / 1px 100% no-repeat,
      linear-gradient(90deg, rgba(15, 119, 251, 1) 0%, rgba(30, 185, 254, 1) 50%, rgba(15, 119, 251, 1) 100%)
        left bottom / 100% 1px no-repeat;
  }

  &__stat {
    position: absolute;
    top: 164px;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
  }

  &__stat-label {
    font-size: 12px;
    line-height: 18px;
    color: rgba(198, 231, 255, 0.75);
  }

  &__stat-val {
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 18px;
    font-weight: 500;
    line-height: 22px;
    color: rgba(255, 255, 255, 1);
  }
}
</style>