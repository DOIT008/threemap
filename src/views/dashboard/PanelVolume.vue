<script setup lang="ts">
import { computed, ref } from "vue";
import PanelTitle from "./PanelTitle.vue";
import CountValue from "./CountValue.vue";
import titleBar from "@/assets/codesign/panel-title-bar.png";
import tabUnderline from "@/assets/codesign/tab-underline.png";
import listArrow from "@/assets/codesign/icon-arrow-up.png";
import dashboard from "@/data/dashboard.json";

const data = dashboard.volumeOverview;
const active = ref(data.activeTab);
const current = computed(() => data.datasets[active.value] ?? data.datasets[0]!);

function cycle(step: number): void {
  active.value = (active.value + step + data.tabs.length) % data.tabs.length;
}

// ==================== 环形分段 ====================
const R = 58;
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
</script>

<template>
  <section class="pv">
    <PanelTitle :img="titleBar" :width="442" :enter-left="170" with-icon />

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
    <img class="pv__underline" :src="tabUnderline" alt="" />

    <div class="pv__body">
      <div class="pv__ring">
        <svg viewBox="0 0 160 160">
          <defs>
            <linearGradient id="pv-ring-grad" gradientUnits="userSpaceOnUse" x1="20" y1="20" x2="140" y2="140">
              <stop offset="0" stop-color="#3EE6A8" />
              <stop offset="0.5" stop-color="#31D8D8" />
              <stop offset="1" stop-color="#008CFF" />
            </linearGradient>
          </defs>
          <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(70,120,200,0.3)" stroke-width="1" stroke-dasharray="2 6" />
          <circle cx="80" cy="80" :r="R" fill="none" stroke="rgba(24,52,110,0.55)" stroke-width="12" />
          <g transform="rotate(-90 80 80)">
            <circle
              v-for="(seg, i) in segments"
              :key="i"
              cx="80"
              cy="80"
              :r="R"
              fill="none"
              stroke="url(#pv-ring-grad)"
              stroke-width="12"
              :stroke-dasharray="`${seg.dash} ${C}`"
              :stroke-dashoffset="seg.offset"
              class="pv__seg"
            />
          </g>
          <circle cx="80" cy="80" r="46" fill="none" stroke="rgba(70,120,200,0.28)" stroke-width="1" />
        </svg>
        <div class="pv__ring-center">
          <button class="pv__ring-arrow" aria-label="上一个" @click="cycle(-1)">‹</button>
          <span class="pv__ring-text">{{ current.ringText }}</span>
          <button class="pv__ring-arrow" aria-label="下一个" @click="cycle(1)">›</button>
        </div>
      </div>

      <ul class="pv__list">
        <li v-for="item in current.list" :key="item.name" class="pv__row">
          <img class="pv__row-arrow" :src="listArrow" alt="" />
          <span class="pv__row-name">{{ item.name }}</span>
          <span class="pv__row-val"><CountValue :value="item.value" /></span>
          <span class="pv__row-unit">{{ item.unit }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped lang="scss">
.pv {
  position: relative;
  width: 442px;
  height: 232px;
  flex: none;
  background: linear-gradient(180deg, rgba(12, 32, 74, 0.42), rgba(6, 16, 42, 0.62));
  border: 1px solid rgba(46, 100, 190, 0.32);
  box-shadow: inset 0 0 26px rgba(20, 60, 140, 0.16);

  &__tabs {
    position: absolute;
    top: 14px;
    right: 21px;
    display: flex;
    gap: 12px;
    z-index: 2;
  }

  &__tab {
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 12px;
    line-height: 16px;
    color: rgba(161, 183, 217, 1);
    transition: color 0.2s ease;

    & + & {
      position: relative;

      &::before {
        content: "|";
        position: absolute;
        left: -9px;
        color: rgba(113, 144, 205, 0.5);
        font-weight: 400;
      }
    }

    &:hover {
      color: rgba(220, 238, 255, 1);
    }

    &.is-active {
      color: rgba(0, 140, 255, 1);
      font-weight: 700;
      text-shadow: 0 0 8px rgba(0, 140, 255, 0.55);
    }
  }

  &__underline {
    position: absolute;
    top: 33px;
    right: 12px;
    width: 225px;
    height: 20px;
    opacity: 0.85;
    pointer-events: none;
  }

  &__body {
    display: flex;
    align-items: center;
    height: 200px;
    padding: 6px 24px 0 14px;
  }

  &__ring {
    position: relative;
    width: 168px;
    height: 168px;
    flex: none;

    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  }

  &__seg {
    transition: stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease;
  }

  &__ring-center {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  &__ring-text {
    font-size: 18px;
    font-weight: 500;
    color: rgba(255, 255, 255, 1);
    letter-spacing: 2px;
  }

  &__ring-arrow {
    padding: 0 2px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    color: rgba(198, 231, 255, 0.55);
    transition: color 0.2s ease, transform 0.2s ease;

    &:hover {
      color: #ffffff;
      transform: scale(1.3);
    }
  }

  &__list {
    flex: 1;
    margin: 0;
    padding: 0 0 0 18px;
    list-style: none;
  }

  &__row {
    display: flex;
    align-items: center;
    height: 48px;
    border-bottom: 1px solid rgba(46, 100, 190, 0.22);

    &:last-child {
      border-bottom: none;
    }
  }

  &__row-arrow {
    width: 12px;
    height: 12px;
    flex: none;
  }

  &__row-name {
    margin-left: 10px;
    font-size: 14px;
    color: rgba(198, 231, 255, 0.85);
  }

  &__row-val {
    margin-left: auto;
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: rgba(255, 255, 255, 1);
    text-shadow: 0 0 7px rgba(36, 160, 255, 0.45);
  }

  &__row-unit {
    margin-left: 6px;
    font-size: 14px;
    color: rgba(113, 144, 205, 1);
  }
}
</style>