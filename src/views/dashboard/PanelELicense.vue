<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import PanelTitle from "./PanelTitle.vue";
import CountValue from "./CountValue.vue";
import titleImg from "@/assets/codesign/panel-title-elicense.png";
import cardTypeBg from "@/assets/codesign/elicense-card-type-bg.png";
import cardTotalBg from "@/assets/codesign/elicense-card-total-bg.png";
import dashboard from "@/data/dashboard.json";

const data = dashboard.eLicense;
const cardBgs = [cardTypeBg, cardTotalBg];

// ==================== 柱图坐标 ====================
const Y0 = 112;
const PLOT_H = 87;
const BAR_W = 22;

function cx(i: number): number {
  return 78 + i * 74;
}
function barH(v: number): number {
  return Math.max((v / data.yMax) * PLOT_H, 2);
}

const yTicks = computed(() => {
  const out: { v: number; y: number }[] = [];
  for (let v = 0; v <= data.yMax; v += data.yStep) out.push({ v, y: Y0 - (v / data.yMax) * PLOT_H });
  return out;
});

const grown = ref(false);
onMounted(() => {
  requestAnimationFrame(() => {
    grown.value = true;
  });
});
</script>

<template>
  <section class="pl">
    <PanelTitle :img="titleImg" :width="895" :enter-left="150" />

    <div class="pl__body">
      <div class="pl__cards">
        <div v-for="(card, i) in data.cards" :key="card.label" class="pl__card">
          <img class="pl__card-bg" :src="cardBgs[i]" alt="" />
          <span class="pl__card-val"><CountValue :value="card.value" /></span>
          <span class="pl__card-label">{{ card.label }}</span>
        </div>
      </div>

      <svg class="pl__chart" viewBox="0 0 645 130">
        <defs>
          <linearGradient id="pl-bar-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#2EA0FF" />
            <stop offset="1" stop-color="rgba(10,43,102,0.35)" />
          </linearGradient>
        </defs>
        <text x="36" y="10" text-anchor="end" class="pl__unit">{{ data.unit }}</text>
        <g v-for="t in yTicks" :key="t.v">
          <line x1="44" x2="630" :y1="t.y" :y2="t.y" stroke="rgba(70,110,180,0.2)" stroke-dasharray="3 4" />
          <text x="36" :y="t.y + 4" text-anchor="end" class="pl__axis">{{ t.v }}</text>
        </g>
        <g v-for="(bar, i) in data.bars" :key="bar.name" class="pl__bar-group">
          <rect
            :x="cx(i) - BAR_W / 2"
            :y="Y0 - barH(bar.value)"
            :width="BAR_W"
            :height="barH(bar.value)"
            fill="url(#pl-bar-grad)"
            class="pl__bar"
            :class="{ 'is-on': grown }"
            :style="{ transitionDelay: `${i * 0.08}s` }"
          />
          <text :x="cx(i)" :y="Y0 - barH(bar.value) - 6" text-anchor="middle" class="pl__bar-val">
            {{ bar.value }}
          </text>
          <text :x="cx(i)" :y="126" text-anchor="middle" class="pl__axis">{{ bar.name }}</text>
        </g>
      </svg>
    </div>
  </section>
</template>

<style scoped lang="scss">
.pl {
  position: relative;
  box-sizing: border-box;
  width: 895px;
  height: 192px;
  flex: none;
  background: linear-gradient(180deg, rgba(12, 32, 74, 0.42), rgba(6, 16, 42, 0.62));
  border: 1px solid rgba(46, 100, 190, 0.32);
  box-shadow: inset 0 0 26px rgba(20, 60, 140, 0.16);

  &__body {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 8px 20px 0 24px;
  }

  &__cards {
    display: flex;
    gap: 12px;
    flex: none;
  }

  &__card {
    position: relative;
    width: 104px;
    height: 118px;
  }

  &__card-bg {
    position: absolute;
    inset: 0;
    width: 104px;
    height: 118px;
  }

  &__card-val {
    position: absolute;
    left: 0;
    right: 0;
    top: 62px;
    text-align: center;
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: rgba(255, 255, 255, 1);
    text-shadow: 0 0 7px rgba(36, 160, 255, 0.5);
  }

  &__card-label {
    position: absolute;
    left: 0;
    right: 0;
    top: 92px;
    text-align: center;
    font-size: 12px;
    color: rgba(198, 231, 255, 0.8);
  }

  &__chart {
    flex: 1;
    height: 130px;
    display: block;
  }

  &__unit {
    font-size: 12px;
    fill: rgba(198, 231, 255, 0.7);
  }

  &__axis {
    font-size: 12px;
    fill: rgba(113, 144, 205, 1);
  }

  &__bar {
    transform: scaleY(0);
    transform-box: fill-box;
    transform-origin: bottom;
    transition: transform 0.9s cubic-bezier(0.22, 0.8, 0.3, 1), filter 0.2s ease;

    &.is-on {
      transform: scaleY(1);
    }
  }

  &__bar-group:hover &__bar {
    filter: brightness(1.4) drop-shadow(0 0 6px rgba(46, 160, 255, 0.7));
  }

  &__bar-val {
    font-size: 12px;
    fill: rgba(230, 247, 255, 1);
  }
}
</style>