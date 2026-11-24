<script setup lang="ts">
import { computed, ref } from "vue";
import PanelTitle from "./PanelTitle.vue";
import CountValue from "./CountValue.vue";
import titleImg from "@/assets/codesign/panel-title-supervision.png";
import frameImg from "@/assets/codesign/supervision-icon-frame.png";
import icon12345 from "@/assets/codesign/supervision-icon-12345.png";
import iconSentiment from "@/assets/codesign/supervision-icon-sentiment.png";
import iconComplaint from "@/assets/codesign/supervision-icon-complaint.png";
import iconQuota from "@/assets/codesign/supervision-icon-quota.png";
import dividerImg from "@/assets/codesign/divider-line-supervision.png";
import cardRed from "@/assets/codesign/card-red.png";
import cardYellow from "@/assets/codesign/card-yellow.png";
import cardBlue from "@/assets/codesign/card-blue.png";
import dashboard from "@/data/dashboard.json";

const data = dashboard.supervision;
const active = ref(data.activeTab);
const current = computed(() => data.datasets[active.value] ?? data.datasets[0]!);

const STAT_ICONS = [icon12345, iconSentiment, iconComplaint, iconQuota];
const PLATES = [cardRed, cardYellow, cardBlue];
</script>

<template>
  <section class="ps">
    <PanelTitle :img="titleImg" :width="442" :enter-left="144" :top="-7" />

    <div class="ps__tabs">
      <button
        v-for="(tab, i) in data.tabs"
        :key="tab"
        class="ps__tab"
        :class="{ 'is-active': i === active }"
        @click="active = i"
      >
        {{ tab }}
      </button>
    </div>

    <div class="ps__grid">
      <div v-for="(stat, i) in current.stats" :key="stat.label" class="ps__card">
        <span class="ps__frame">
          <img class="ps__frame-bg" :src="frameImg" alt="" />
          <img class="ps__frame-icon" :src="STAT_ICONS[i] ?? STAT_ICONS[0]!" alt="" />
        </span>
        <span class="ps__card-text">
          <span class="ps__card-label">{{ stat.label }}</span>
          <span class="ps__card-val"><CountValue :value="stat.value" /></span>
        </span>
      </div>
    </div>

    <div class="ps__brands">
      <span class="ps__brands-title">电子监察 · 红黄蓝牌</span>
      <div v-for="(card, i) in current.cards" :key="card.label" class="ps__brand">
        <span class="ps__brand-label">{{ card.label }}</span>
        <span class="ps__plate">
          <img :src="PLATES[i] ?? PLATES[0]!" alt="" :style="{ animationDelay: `${i * 0.5}s` }" />
          <b>{{ card.value }}</b>
        </span>
      </div>
    </div>

    <img class="ps__divider" :src="dividerImg" alt="" />
  </section>
</template>

<style scoped lang="scss">
@use "./panel" as *;

.ps {
  @include db-panel(245px);

  // spec：本年 (1795,606) → 相对 (339,9)
  &__tabs {
    position: absolute;
    top: 9px;
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

  // spec：矩形 7 —— 195×68，列 18/221，行 30/107
  &__grid {
    position: absolute;
    left: 18px;
    top: 30px;
    display: grid;
    grid-template-columns: 195px 195px;
    column-gap: 8px;
    row-gap: 9px;
  }

  &__card {
    display: flex;
    align-items: center;
    height: 68px;
    padding-left: 17px;
    box-sizing: border-box;
    border-radius: 2px;
    background: linear-gradient(180deg, rgba(16, 44, 96, 0.45), rgba(8, 24, 58, 0.55));
    transition: background 0.2s ease;
  }

  // spec：图标 46×46 at 卡片内 (17,11)
  &__frame {
    position: relative;
    width: 46px;
    height: 50px;
    flex: none;
  }

  &__frame-bg {
    position: absolute;
    inset: 0;
    width: 46px;
    height: 50px;
  }

  &__frame-icon {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 46px;
    height: 46px;
    object-fit: contain;
  }

  // spec：标签 (1556,640) → 卡片内 (82,13)；数值 (1555,660) → (81,33)
  &__card-text {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-left: 19px;
    min-width: 0;
  }

  &__card-label {
    font-size: 12px;
    line-height: 14px;
    color: rgba(198, 231, 255, 0.75);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__card-val {
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 18px;
    line-height: 22px;
    font-weight: 700;
    color: rgba(255, 255, 255, 1);
    text-shadow: 0 0 7px rgba(36, 160, 255, 0.45);
  }

  // spec：标题 (1480,793) → 相对 (24,196)
  &__brands {
    position: absolute;
    left: 24px;
    top: 196px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__brands-title {
    margin-right: 6px;
    font-size: 14px;
    line-height: 21px;
    color: rgba(198, 231, 255, 0.9);
    white-space: nowrap;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__brand-label {
    width: 24px;
    font-size: 12px;
    line-height: 18px;
    color: rgba(198, 231, 255, 0.75);
    white-space: nowrap;
  }

  // spec：牌 40×22
  &__plate {
    position: relative;
    width: 40px;
    height: 23px;

    img {
      position: absolute;
      inset: 0;
      width: 40px;
      height: 23px;
      animation: ps-pulse 2.4s ease-in-out infinite;
    }

    b {
      position: absolute;
      left: 0;
      right: 0;
      top: -8px;
      text-align: center;
      font-family: Roboto, "Segoe UI", Arial, sans-serif;
      font-size: 14px;
      line-height: 19px;
      font-weight: 700;
      color: #ffffff;
      text-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
    }
  }

  // spec：分隔条 (1480,816,392×14) → 相对 (24,219)
  &__divider {
    position: absolute;
    left: 24px;
    top: 213px;
    width: 392px;
    height: 14px;
  }
}

@keyframes ps-pulse {
  0%,
  100% {
    opacity: 0.75;
    filter: brightness(1);
  }
  50% {
    opacity: 1;
    filter: brightness(1.35);
  }
}
</style>