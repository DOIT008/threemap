<script setup lang="ts">
import { computed, ref } from "vue";
import PanelTitle from "./PanelTitle.vue";
import CountValue from "./CountValue.vue";
import titleImg from "@/assets/codesign/panel-title-affairs.png";
import base1 from "@/assets/codesign/affairs-base-1.png";
import base2 from "@/assets/codesign/affairs-base-2.png";
import base3 from "@/assets/codesign/affairs-base-3.png";
import glow1 from "@/assets/codesign/affairs-base-1-glow.png";
import glow2 from "@/assets/codesign/affairs-base-2-glow.png";
import glow3 from "@/assets/codesign/affairs-base-3-glow.png";
import glow4 from "@/assets/codesign/affairs-base-4-glow.png";
import glow5 from "@/assets/codesign/affairs-base-5-glow.png";
import icon1 from "@/assets/codesign/affairs-base-1-icon.png";
import icon2 from "@/assets/codesign/affairs-base-2-icon.png";
import icon3 from "@/assets/codesign/affairs-base-3-icon.png";
import icon4 from "@/assets/codesign/affairs-base-4-icon.png";
import icon5 from "@/assets/codesign/affairs-base-5-icon.png";
import dashboard from "@/data/dashboard.json";

const data = dashboard.affairsBase;
const active = ref(data.activeTab);
const items = computed(() => (data.datasets[active.value] ?? data.datasets[0]!).items);

const BASES = [base1, base2, base3];
const GLOWS = [glow1, glow2, glow3, glow4, glow5];
const ICONS = [icon1, icon2, icon3, icon4, icon5];
</script>

<template>
  <section class="pa">
    <PanelTitle :img="titleImg" :width="442" :enter-left="196" />

    <div class="pa__tabs">
      <button
        v-for="(tab, i) in data.tabs"
        :key="tab"
        class="pa__tab"
        :class="{ 'is-active': i === active }"
        @click="active = i"
      >
        {{ tab }}
      </button>
    </div>

    <div class="pa__body">
      <div class="pa__row pa__row--top">
        <div v-for="(item, i) in items.slice(0, 3)" :key="item.label" class="pa__item">
          <span class="pa__label">{{ item.label }}</span>
          <span class="pa__value"><CountValue :value="item.value" /></span>
          <div class="pa__stage" :style="{ animationDelay: `${i * 0.4}s` }">
            <img class="pa__glow" :src="GLOWS[i] ?? GLOWS[0]!" alt="" />
            <img class="pa__base" :src="BASES[i % 3] ?? BASES[0]!" alt="" />
            <img class="pa__icon" :src="ICONS[i] ?? ICONS[0]!" alt="" />
          </div>
        </div>
      </div>
      <div class="pa__row pa__row--bottom">
        <div v-for="(item, j) in items.slice(3)" :key="item.label" class="pa__item">
          <span class="pa__label">{{ item.label }}</span>
          <span class="pa__value"><CountValue :value="item.value" /></span>
          <div class="pa__stage" :style="{ animationDelay: `${(j + 3) * 0.4}s` }">
            <img class="pa__glow" :src="GLOWS[j + 3] ?? GLOWS[0]!" alt="" />
            <img class="pa__base" :src="BASES[(j + 3) % 3] ?? BASES[0]!" alt="" />
            <img class="pa__icon" :src="ICONS[j + 3] ?? ICONS[0]!" alt="" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.pa {
  position: relative;
  box-sizing: border-box;
  width: 442px;
  height: 231px;
  flex: none;
  background: linear-gradient(180deg, rgba(12, 32, 74, 0.42), rgba(6, 16, 42, 0.62));
  border: 1px solid rgba(46, 100, 190, 0.32);
  box-shadow: inset 0 0 26px rgba(20, 60, 140, 0.16);

  &__tabs {
    position: absolute;
    top: 16px;
    right: 19px;
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

  &__body {
    padding: 8px 39px 0;
  }

  &__row {
    display: flex;
    justify-content: space-between;

    &--bottom {
      justify-content: center;
      gap: 49px;
      margin-top: 2px;
    }
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 110px;
  }

  &__label {
    font-size: 12px;
    line-height: 14px;
    color: rgba(198, 231, 255, 0.75);
    white-space: nowrap;
  }

  &__value {
    margin-top: 2px;
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 20px;
    font-weight: 500;
    line-height: 22px;
    color: rgba(255, 255, 255, 1);
    text-shadow: 0 0 8px rgba(36, 160, 255, 0.45);
  }

  &__stage {
    position: relative;
    width: 110px;
    height: 59px;
    margin-top: -8px;
    animation: pa-float 3.2s ease-in-out infinite;
  }

  &__glow {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 110px;
    height: 45px;
    animation: pa-pulse 2.6s ease-in-out infinite;
  }

  &__base {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 110px;
    height: 59px;
  }

  &__icon {
    position: absolute;
    left: 50%;
    bottom: 26px;
    transform: translateX(-50%);
    width: 40px;
    height: 30px;
    object-fit: contain;
  }
}

@keyframes pa-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes pa-pulse {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}
</style>