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
import dashboard from "@/data/dashboard.json";

const data = dashboard.affairsBase;
const active = ref(data.activeTab);
const items = computed(() => (data.datasets[active.value] ?? data.datasets[0]!).items);

const BASES = [base1, base2, base3];
const GLOWS = [glow1, glow2, glow3, glow4, glow5];

/** spec：底座 110×54，列 18/163/308（列距 145、列间 35），行 38/119（行距 81） */
</script>

<template>
  <section class="pa">
    <PanelTitle :img="titleImg" :width="442" :enter-left="188" :top="-12" />

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
      <div v-for="(item, i) in items" :key="item.label" class="pa__item">
        <span class="pa__label">{{ item.label }}</span>
        <span class="pa__value"><CountValue :value="item.value" /></span>
        <div class="pa__stage">
          <img class="pa__glow" :src="GLOWS[i] ?? GLOWS[0]!" alt="" />
          <img class="pa__base" :src="BASES[i % 3] ?? BASES[0]!" alt="" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use "./panel" as *;

.pa {
  @include db-panel(205px);

  // spec：全市 (1771,109) / 市本级 (1827,109)
  &__tabs {
    position: absolute;
    top: 4px;
    right: 19px;
    display: flex;
    gap: 28px;
    z-index: 3;
  }

  &__tab {
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    line-height: 21px;
    color: rgba(161, 183, 217, 1);
    transition: color 0.2s ease;

    & + & {
      position: relative;

      &::before {
        content: "";
        position: absolute;
        left: -18px;
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

  // spec：首行标签 (1485,143) → 相对面板 (18,38)，1 行 3 列，列间 35
  &__body {
    position: absolute;
    left: 18px;
    top: 38px;
    width: 400px;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    column-gap: 35px;
  }

  // 底座 110×54 在标签下 45px，单卡高 97；spec 行距 81 → 行间回卷 16px
  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 110px;

    &:nth-child(-n + 3) {
      margin-bottom: 2px;
    }
  }

  &__label {
    font-size: 14px;
    line-height: 18px;
    color: rgba(198, 231, 255, 0.75);
    white-space: nowrap;
  }

  &__value {
    margin-top: 3px;
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 20px;
    font-weight: 500;
    line-height: 24px;
    color: rgba(255, 255, 255, 1);
    text-shadow: 0 0 8px rgba(36, 160, 255, 0.45);
  }

  // spec：底座 y=60 → 相对标签顶部 +22
  &__stage {
    position: relative;
    width: 110px;
    height: 54px;
    margin-top: -20px;
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
    height: 54px;
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