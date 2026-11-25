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
// spec：彩色环内径 48、外径 60；环外侧另有约 3.4 宽的暗色轨道（外缘半径 63.4）
const CX = 70;
const CY = 70;
const R_OUT = 60;
const R_IN = 48;

// spec：三段弧为装饰性近等分（不按数据占比），缺口中心位于自 12 点顺时针 18° / 138° / 258°，宽 4.5°
// 每段自暗到亮各自一条渐变：右上偏蓝、右下偏绿、左上偏青
type GradientStop = readonly [offset: number, color: string];

const ARC_DEFS: { from: number; to: number; stops: GradientStop[] }[] = [
  { from: 20.25, to: 135.5, stops: [[0, "#1255aa"], [1, "#139afc"]] },
  { from: 140.5, to: 255.75, stops: [[0, "#208ba2"], [0.82, "#3df6d0"], [1, "#3df6d0"]] },
  { from: 260.25, to: 375.75, stops: [[0, "#277b9e"], [1, "#60dce4"]] },
];

const toRad = (deg: number): number => (deg * Math.PI) / 180;

// 角度自 12 点顺时针计
const polar = (degFromTop: number, r: number): { x: number; y: number } => ({
  x: CX + r * Math.cos(toRad(degFromTop - 90)),
  y: CY + r * Math.sin(toRad(degFromTop - 90)),
});

// 环扇形状：外弧顺时针 → 内弧逆时针，缺口处为直切
const arcPath = (from: number, to: number): string => {
  const o0 = polar(from, R_OUT);
  const o1 = polar(to, R_OUT);
  const i1 = polar(to, R_IN);
  const i0 = polar(from, R_IN);
  const large = to - from > 180 ? 1 : 0;
  return (
    `M${o0.x} ${o0.y} A${R_OUT} ${R_OUT} 0 ${large} 1 ${o1.x} ${o1.y} ` +
    `L${i1.x} ${i1.y} A${R_IN} ${R_IN} 0 ${large} 0 ${i0.x} ${i0.y} Z`
  );
};

const arcs = ARC_DEFS.map((arc, i) => {
  // 渐变轴取弧中点的切线方向，保证颜色沿弧线由暗渐亮
  const mid = toRad((arc.from + arc.to) / 2 - 90);
  const tx = -Math.sin(mid);
  const ty = Math.cos(mid);
  const midR = (R_IN + R_OUT) / 2;
  const project = (deg: number): number => {
    const p = polar(deg, midR);
    return (p.x - CX) * tx + (p.y - CY) * ty;
  };
  const s = project(arc.from);
  const e = project(arc.to);
  return {
    id: `pv-arc-grad-${i}`,
    stops: arc.stops,
    path: arcPath(arc.from, arc.to),
    x1: CX + s * tx,
    y1: CY + s * ty,
    x2: CX + e * tx,
    y2: CY + e * ty,
  };
});

// spec：环内四向小三角，指向圆心；底边半径 36.6、尖端半径 33.1、底宽 3.4
const ARROWS = [
  { dir: "up", points: "68.3,33.4 71.7,33.4 70,36.9", step: -1 },
  { dir: "left", points: "33.4,68.3 33.4,71.7 36.9,70", step: -1 },
  { dir: "right", points: "106.6,68.3 106.6,71.7 103.1,70", step: 1 },
  { dir: "down", points: "68.3,106.6 71.7,106.6 70,103.1", step: 1 },
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
            v-for="arc in arcs"
            :id="arc.id"
            :key="arc.id"
            gradientUnits="userSpaceOnUse"
            :x1="arc.x1"
            :y1="arc.y1"
            :x2="arc.x2"
            :y2="arc.y2"
          >
            <stop
              v-for="([offset, color], idx) in arc.stops"
              :key="idx"
              :offset="offset"
              :stop-color="color"
            />
          </linearGradient>
        </defs>
        <!-- spec：环外侧暗色轨道（彩色环以外只露出约 3.4） -->
        <circle cx="70" cy="70" r="61.7" fill="none" stroke="rgba(122,142,165,0.2)" stroke-width="3.4" />
        <!-- spec：三段彩色弧，缺口处直切 -->
        <path v-for="arc in arcs" :key="arc.id" :d="arc.path" :fill="`url(#${arc.id})`" />
        <!-- spec：内圈半径 39.4，细描边 -->
        <circle cx="70" cy="70" r="39.4" fill="none" stroke="rgba(210,215,220,0.36)" stroke-width="0.9" />
        <polygon
          v-for="a in ARROWS"
          :key="a.dir"
          :points="a.points"
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
    z-index: 100;
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

  &__arrow {
    fill: rgba(164, 179, 208, 1);
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