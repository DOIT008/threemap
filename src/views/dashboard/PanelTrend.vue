<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import PanelTitle from "./PanelTitle.vue";
import titleImg from "@/assets/codesign/panel-title-trend.png";
import dotOrange from "@/assets/codesign/dot-orange.png";
import dotCyan from "@/assets/codesign/dot-cyan.png";
import dashboard from "@/data/dashboard.json";

const data = dashboard.trend;
const dots = [dotOrange, dotCyan];

// ==================== 坐标系 ====================
const X0 = 64;
const X1 = 426;
const Y0 = 140;
const Y_TOP = 28;
const N = data.dates.length;

function px(i: number): number {
  return X0 + (i * (X1 - X0)) / (N - 1);
}
function py(v: number): number {
  return Y0 - (v / data.yMax) * (Y0 - Y_TOP);
}

const gridLines = computed(() => {
  const out: { v: number; y: number }[] = [];
  for (let v = 0; v <= data.yMax; v += data.yStep) out.push({ v, y: py(v) });
  return out;
});

const lines = computed(() =>
  data.series.map((s) => s.data.map((v, i) => `${px(i)},${py(v)}`).join(" ")),
);
const areas = computed(() =>
  data.series.map(
    (s) => `M ${px(0)} ${Y0} L ${s.data.map((v, i) => `${px(i)} ${py(v)}`).join(" L ")} L ${px(N - 1)} ${Y0} Z`,
  ),
);

// ==================== 入场描线 ====================
const drawn = ref(false);
onMounted(() => {
  requestAnimationFrame(() => {
    drawn.value = true;
  });
});

// ==================== 悬停十字提示 ====================
const hoverI = ref<number | null>(null);
function onMove(evt: MouseEvent): void {
  const rect = (evt.currentTarget as SVGSVGElement).getBoundingClientRect();
  const x = ((evt.clientX - rect.left) / rect.width) * 442;
  const i = Math.round(((x - X0) / (X1 - X0)) * (N - 1));
  hoverI.value = Math.max(0, Math.min(N - 1, i));
}
const tipLeft = computed(() => {
  if (hoverI.value === null) return 0;
  return Math.max(8, Math.min(px(hoverI.value) - 62, 318));
});
</script>

<template>
  <section class="pt">
    <PanelTitle :img="titleImg" :width="442" :enter-left="285" />
    <span class="pt__unit">{{ data.unit }}</span>
    <div class="pt__legend">
      <span v-for="(name, i) in data.legend" :key="name" class="pt__legend-item">
        <img :src="dots[i]" alt="" />{{ name }}
      </span>
    </div>

    <div class="pt__chart">
      <svg viewBox="0 0 442 170" @mousemove="onMove" @mouseleave="hoverI = null">
        <defs>
          <linearGradient v-for="(s, i) in data.series" :id="`pt-area-${i}`" :key="s.name" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" :stop-color="s.color" stop-opacity="0.3" />
            <stop offset="1" :stop-color="s.color" stop-opacity="0" />
          </linearGradient>
        </defs>

        <g v-for="g in gridLines" :key="g.v">
          <line :x1="X0" :x2="X1" :y1="g.y" :y2="g.y" stroke="rgba(70,110,180,0.25)" stroke-dasharray="3 4" />
          <text :x="X0 - 8" :y="g.y + 4" text-anchor="end" class="pt__axis">{{ g.v }}</text>
        </g>
        <text v-for="(d, i) in data.dates" :key="d" :x="px(i)" :y="158" text-anchor="middle" class="pt__axis">
          {{ d }}
        </text>

        <path
          v-for="(a, i) in areas"
          :key="`a-${i}`"
          :d="a"
          :fill="`url(#pt-area-${i})`"
          class="pt__area"
          :class="{ 'is-on': drawn }"
        />
        <polyline
          v-for="(l, i) in lines"
          :key="`l-${i}`"
          :points="l"
          fill="none"
          :stroke="data.series[i]?.color"
          stroke-width="2"
          stroke-linejoin="round"
          pathLength="1"
          stroke-dasharray="1"
          :stroke-dashoffset="drawn ? 0 : 1"
          class="pt__line"
        />
        <template v-for="(s, i) in data.series" :key="`p-${i}`">
          <circle
            v-for="(v, j) in s.data"
            :key="j"
            :cx="px(j)"
            :cy="py(v)"
            :r="hoverI === j ? 4 : 2.5"
            :fill="s.color"
            class="pt__dot"
            :class="{ 'is-on': drawn }"
          />
        </template>

        <g v-if="hoverI !== null">
          <line :x1="px(hoverI)" :x2="px(hoverI)" :y1="Y_TOP" :y2="Y0" stroke="rgba(120,200,255,0.5)" stroke-dasharray="3 3" />
        </g>
      </svg>

      <div v-if="hoverI !== null" class="pt__tip" :style="{ left: `${tipLeft}px` }">
        <span class="pt__tip-date">{{ data.dates[hoverI] }}</span>
        <span v-for="s in data.series" :key="s.name" class="pt__tip-row">
          <i :style="{ background: s.color }" />{{ s.name }}
          <b>{{ s.data[hoverI]?.toLocaleString() }}</b>
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.pt {
  position: relative;
  width: 442px;
  height: 236px;
  flex: none;
  background: linear-gradient(180deg, rgba(12, 32, 74, 0.42), rgba(6, 16, 42, 0.62));
  border: 1px solid rgba(46, 100, 190, 0.32);
  box-shadow: inset 0 0 26px rgba(20, 60, 140, 0.16);

  &__unit {
    position: absolute;
    left: 31px;
    top: 38px;
    font-size: 12px;
    color: rgba(198, 231, 255, 0.7);
  }

  &__legend {
    position: absolute;
    right: 24px;
    top: 38px;
    display: flex;
    gap: 16px;
  }

  &__legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: rgba(198, 231, 255, 0.85);

    img {
      width: 8px;
      height: 8px;
    }
  }

  &__chart {
    position: relative;
    margin-top: 30px;

    svg {
      display: block;
      width: 442px;
      height: 170px;
      cursor: crosshair;
    }
  }

  &__axis {
    font-size: 12px;
    fill: rgba(113, 144, 205, 1);
  }

  &__line {
    transition: stroke-dashoffset 1.8s ease;
    filter: drop-shadow(0 0 3px rgba(0, 140, 255, 0.35));
  }

  &__area {
    opacity: 0;
    transition: opacity 1.2s ease 0.6s;

    &.is-on {
      opacity: 1;
    }
  }

  &__dot {
    opacity: 0;
    transition: opacity 0.6s ease 1.2s, r 0.15s ease;

    &.is-on {
      opacity: 1;
    }
  }

  &__tip {
    position: absolute;
    top: 26px;
    min-width: 124px;
    padding: 6px 10px;
    background: rgba(8, 20, 45, 0.92);
    border: 1px solid rgba(72, 204, 255, 0.45);
    border-radius: 4px;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
    z-index: 3;
  }

  &__tip-date {
    font-size: 12px;
    font-weight: 700;
    color: rgba(230, 247, 255, 1);
  }

  &__tip-row {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: rgba(198, 231, 255, 0.85);

    i {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }

    b {
      margin-left: auto;
      font-family: Roboto, "Segoe UI", Arial, sans-serif;
      color: #ffffff;
    }
  }
}
</style>