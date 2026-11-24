<script setup lang="ts">
import { computed, ref } from "vue";
import PanelTitle from "./PanelTitle.vue";
import CountValue from "./CountValue.vue";
import titleBar from "@/assets/codesign/panel-title-bar.png";
import dashboard from "@/data/dashboard.json";

const data = dashboard.volumeOverview;
const active = ref(data.activeTab);
const current = computed(() => data.datasets[active.value] ?? data.datasets[0]!);

function cycle(step: number): void {
  active.value = (active.value + step + data.tabs.length) % data.tabs.length;
}

// ==================== 环形分段 ====================
// spec：彩色环直径 118.7（r 59.35），线宽 11
const R = 54;
const C = 2 * Math.PI * R;
const GAP = 4;

const segments = computed(() => {
  const values = current.value.list.map((it) => Number(it.value.replace(/,/g, "")));
  const total = values.reduce((a, b) => a + b, 0) || 1;
  let start = 0;
  return values.map((v) => {
    const len = (v / total) * C;
    const seg = { dash: Math.max(len - GAP, 0.6), offset: -(start + GAP / 2) };
    start += len;
    return seg;
  });
});

// spec：环内四向箭头 4.375×4.375 实心方块（rgba(108,128,151,1) + 0.47px border），位于半径 38.58 的圆周
const ARROWS = [
  { dir: "up", x: 68.53, y: 28.56, step: -1 },
  { dir: "left", x: 34.99, y: 67.14, step: -1 },
  { dir: "right", x: 110.82, y: 67.14, step: 1 },
  { dir: "down", x: 68.53, y: 105.06, step: 1 },
];
</script>

<template>
  <section class="pv">
    <PanelTitle :img="titleBar" :width="442" :enter-left="162" :top="-12" />

    <div class="pv__tabs">
      <button
        v-for="(tab, i) in data.tabs"
        :key="tab"
        class="pv__tab"
        :class="{ 'is-active': i === active }"
        @click="active = i"
      >
        {{ tab }}
      </button>
    </div>

    <div class="pv__ring">
      <svg viewBox="0 0 140 140">
        <defs>
          <linearGradient
            id="pv-ring-grad"
            gradientUnits="userSpaceOnUse"
            x1="20"
            y1="20"
            x2="120"
            y2="120"
          >
            <stop offset="0" stop-color="#3EE6A8" />
            <stop offset="0.5" stop-color="#31D8D8" />
            <stop offset="1" stop-color="#008CFF" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r="69.5" fill="none" stroke="rgba(70,120,200,0.18)" stroke-width="1" stroke-dasharray="2 6" />
        <circle cx="70" cy="70" :r="R" fill="none" stroke="rgba(24,52,110,0.55)" stroke-width="11" />
        <g transform="rotate(-90 70 70)">
          <circle
            v-for="(seg, i) in segments"
            :key="i"
            cx="70"
            cy="70"
            :r="R"
            fill="none"
            stroke="url(#pv-ring-grad)"
            stroke-width="11"
            :stroke-dasharray="`${seg.dash} ${C}`"
            :stroke-dashoffset="seg.offset"
            class="pv__seg"
          />
        </g>
        <!-- spec：内圈 87.5，圆心 (70.72,69.33) -->
        <circle cx="70.72" cy="69.33" r="43.75" fill="none" stroke="rgba(70,120,200,0.28)" stroke-width="1" />
        <rect
          v-for="a in ARROWS"
          :key="a.dir"
          :x="a.x"
          :y="a.y"
          width="4.375"
          height="4.375"
          class="pv__arrow"
          @click="cycle(a.step)"
        />
      </svg>
      <span class="pv__ring-text">{{ current.ringText }}</span>
    </div>

    <ul class="pv__list">
      <li v-for="item in current.list" :key="item.name" class="pv__row">
        <span class="pv__row-arrow" aria-hidden="true" />
        <span class="pv__row-name">{{ item.name }}</span>
        <span class="pv__row-val"><CountValue :value="item.value" /></span>
        <span class="pv__row-unit">{{ item.unit }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
@use "./panel" as *;

.pv {
  @include db-panel(205px);

  // spec：累计 (309,109) / 本年 (365,109) / 本月 (421,109)，宽 28，间距 28
  &__tabs {
    position: absolute;
    top: 7px;
    left: 271px;
    display: flex;
    gap: 28px;
  }

  &__tab {
    width: 28px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    line-height: 21px;
    color: rgba(161, 183, 217, 1);
    text-align: right;
    transition: color 0.2s ease;

    & + & {
      position: relative;

      // spec：分隔竖线 1×10，y=115
      &::before {
        content: "";
        position: absolute;
        left: -14px;
        top: 6px;
        width: 1px;
        height: 10px;
        background: rgba(113, 144, 205, 0.5);
      }
    }

    &:hover {
      color: rgba(220, 238, 255, 1);
    }

    &.is-active {
      color: rgba(0, 140, 255, 1);
      text-shadow: 0 0 8px rgba(0, 140, 255, 0.55);
    }
  }

  // spec：椭圆形 (58,148,140×140)
  &__ring {
    position: absolute;
    left: 20px;
    top: 43px;
    width: 140px;
    height: 140px;

    svg {
      display: block;
      width: 140px;
      height: 140px;
    }
  }

  &__seg {
    transition: stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease;
  }

  &__arrow {
    fill: rgba(108, 128, 151, 1);
    stroke: rgba(208, 222, 238, 1);
    stroke-width: 0.47;
    cursor: pointer;
    transition: fill 0.2s ease;

    &:hover {
      fill: #ffffff;
    }
  }

  // spec：累计 (110,207,36×22)，18px
  &__ring-text {
    position: absolute;
    left: 52px;
    top: 59px;
    width: 36px;
    height: 22px;
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 18px;
    font-weight: 500;
    line-height: 22px;
    color: rgba(255, 255, 255, 1);
    text-align: center;
  }

  // spec：列表 x=218(相对 180) y=150(相对 45)，宽 224.97，行距 52.5
  &__list {
    position: absolute;
    left: 180px;
    top: 45px;
    width: 224.97px;
    margin: 0;
    padding: 0 15.97px 0 0;
    list-style: none;
    box-sizing: border-box;
  }

  &__row {
    position: relative;
    display: flex;
    align-items: flex-start;
    height: 52.5px;

    // spec：Vector 357 —— 224.97×14.93 行背景光条，切图 @3x 1158×42（1x 386×14）
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 26.5px;
      width: 100%;
      height: 9px;
      background: url("@/assets/codesign/divider-line-users.png") no-repeat center / 100% 100%;
      pointer-events: none;
    }

    // spec：首行填充更亮（rgba(28,58,176,0.5) vs 其余 rgba(0,63,140,0.5)），同一张切图提亮
    &:first-child::before {
      filter: brightness(1.45);
    }

    // spec：Vector 358 —— 底部 1px 细线
    &::after {
      content: "";
      position: absolute;
      left: 0;
      top: 35.5px;
      width: 100%;
      height: 1px;
      // background: rgba(120, 180, 255, 0.12);
    }
  }

  // spec：三角形 2/3 —— 16×26 双向箭头
  &__row-arrow {
    flex: none;
    margin-top: 2.6px;
    width: 16px;
    height: 26px;
    background: url("@/assets/codesign/icon-arrow-up.png") no-repeat center / 16px 26px;
  }

  &__row-name {
    margin-left: 24px;
    font-size: 14px;
    line-height: 21px;
    color: rgba(198, 231, 255, 0.8);
    white-space: nowrap;
  }

  &__row-val {
    margin-left: auto;
    margin-top: 1px;
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 18px;
    font-weight: 700;
    line-height: 22px;
    color: rgba(255, 255, 255, 1);
    white-space: nowrap;
  }

  &__row-unit {
    margin-left: 7px;
    font-size: 14px;
    line-height: 21px;
    color: rgba(113, 144, 205, 1);
  }
}
</style>