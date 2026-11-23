<script setup lang="ts">
import { onMounted, ref } from "vue";
import PanelTitle from "./PanelTitle.vue";
import CountValue from "./CountValue.vue";
import titleImg from "@/assets/codesign/panel-title-efficiency.png";
import gaugeBase1 from "@/assets/codesign/gauge-base-1.png";
import gaugeBase2 from "@/assets/codesign/gauge-base-2.png";
import dashboard from "@/data/dashboard.json";

const data = dashboard.efficiency;
const bases = [gaugeBase1, gaugeBase2];

// 入场扫入：dasharray 从 0 过渡到目标值
const swept = ref(false);
onMounted(() => {
  requestAnimationFrame(() => {
    swept.value = true;
  });
});

/** 半圆刻度坐标：0 在左、100 在右，绕顶部半周 */
function tick(v: number): { x: number; y: number } {
  const a = Math.PI - (v / 100) * Math.PI;
  return { x: 100 + Math.cos(a) * 90, y: 106 - Math.sin(a) * 90 };
}
const TICKS = [0, 20, 40, 60, 80, 100];
</script>

<template>
  <section class="pe">
    <PanelTitle :img="titleImg" :width="442" :enter-left="236" />

    <div class="pe__gauges">
      <div v-for="(gauge, i) in data.gauges" :key="gauge.label" class="pe__gauge">
        <svg viewBox="0 0 200 130">
          <defs>
            <linearGradient :id="`pe-grad-${i}`" x1="0" y1="0" x2="1" y2="0">
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
          <text
            v-for="t in TICKS"
            :key="t"
            :x="tick(t).x"
            :y="tick(t).y"
            text-anchor="middle"
            class="pe__tick"
          >
            {{ t }}
          </text>
          <path
            d="M 25 105 A 75 75 0 0 1 175 105"
            fill="none"
            stroke="rgba(24,52,110,0.6)"
            stroke-width="8"
            stroke-linecap="round"
          />
          <path
            d="M 25 105 A 75 75 0 0 1 175 105"
            fill="none"
            :stroke="`url(#pe-grad-${i})`"
            stroke-width="8"
            stroke-linecap="round"
            pathLength="100"
            :stroke-dasharray="`${swept ? gauge.value : 0} 100`"
            class="pe__arc"
          />
        </svg>
        <span class="pe__value"><CountValue :value="`${gauge.value.toFixed(2)}${gauge.suffix}`" /></span>
        <span class="pe__label">{{ gauge.label }}</span>
        <img class="pe__base" :src="bases[i]" alt="" />
      </div>
    </div>

    <div class="pe__stats">
      <div v-for="stat in data.stats" :key="stat.label" class="pe__stat">
        <span class="pe__stat-label">{{ stat.label }}</span>
        <span class="pe__stat-val"><CountValue :value="stat.value" /></span>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.pe {
  position: relative;
  box-sizing: border-box;
  width: 442px;
  height: 266px;
  flex: none;
  background: linear-gradient(180deg, rgba(12, 32, 74, 0.42), rgba(6, 16, 42, 0.62));
  border: 1px solid rgba(46, 100, 190, 0.32);
  box-shadow: inset 0 0 26px rgba(20, 60, 140, 0.16);

  &__gauges {
    display: flex;
    justify-content: space-around;
    padding: 4px 10px 0;
  }

  &__gauge {
    position: relative;
    width: 200px;
    height: 150px;

    svg {
      width: 100%;
      height: 130px;
      display: block;
    }
  }

  &__tick {
    font-size: 9px;
    fill: rgba(113, 144, 205, 1);
  }

  &__arc {
    transition: stroke-dasharray 1.4s cubic-bezier(0.22, 0.8, 0.3, 1);
    filter: drop-shadow(0 0 4px rgba(0, 140, 255, 0.5));
  }

  &__value {
    position: absolute;
    left: 0;
    right: 0;
    top: 66px;
    text-align: center;
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: rgba(255, 255, 255, 1);
    text-shadow: 0 0 8px rgba(36, 160, 255, 0.5);
  }

  &__label {
    position: absolute;
    left: 0;
    right: 0;
    top: 94px;
    text-align: center;
    font-size: 12px;
    color: rgba(198, 231, 255, 0.8);
  }

  &__base {
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    width: 95px;
    height: 20px;
  }

  &__stats {
    display: flex;
    justify-content: space-around;
    margin: 4px 24px 0;
    padding-top: 10px;
    border-top: 1px solid rgba(46, 100, 190, 0.25);
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  &__stat-label {
    font-size: 12px;
    color: rgba(198, 231, 255, 0.75);
  }

  &__stat-val {
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 18px;
    font-weight: 500;
    color: rgba(255, 255, 255, 1);
  }
}
</style>