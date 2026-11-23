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
    <PanelTitle :img="titleImg" :width="442" :enter-left="152" />

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

    <img class="ps__divider" :src="dividerImg" alt="" />

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
  </section>
</template>

<style scoped lang="scss">
.ps {
  position: relative;
  box-sizing: border-box;
  width: 442px;
  height: 270px;
  flex: none;
  background: linear-gradient(180deg, rgba(12, 32, 74, 0.42), rgba(6, 16, 42, 0.62));
  border: 1px solid rgba(46, 100, 190, 0.32);
  box-shadow: inset 0 0 26px rgba(20, 60, 140, 0.16);

  &__tabs {
    position: absolute;
    top: 16px;
    right: 33px;
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

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 10px 24px 0;
  }

  &__card {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 62px;
    padding: 0 10px;
    background: linear-gradient(180deg, rgba(16, 44, 96, 0.45), rgba(8, 24, 58, 0.55));
    border: 1px solid rgba(46, 100, 190, 0.4);
    border-radius: 3px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      border-color: rgba(0, 160, 255, 0.7);
      box-shadow: 0 0 12px rgba(0, 120, 255, 0.25);
    }
  }

  &__frame {
    position: relative;
    width: 47px;
    height: 50px;
    flex: none;
  }

  &__frame-bg {
    position: absolute;
    inset: 0;
    width: 47px;
    height: 50px;
  }

  &__frame-icon {
    position: absolute;
    left: 50%;
    top: 45%;
    transform: translate(-50%, -50%);
    width: 24px;
    height: 24px;
    object-fit: contain;
  }

  &__card-text {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }

  &__card-label {
    font-size: 12px;
    color: rgba(198, 231, 255, 0.75);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__card-val {
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: rgba(255, 255, 255, 1);
    text-shadow: 0 0 7px rgba(36, 160, 255, 0.45);
  }

  &__divider {
    display: block;
    width: 392px;
    height: 14px;
    margin: 8px auto 0;
  }

  &__brands {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 4px 28px 0;
  }

  &__brands-title {
    font-size: 14px;
    color: rgba(198, 231, 255, 0.9);
    white-space: nowrap;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__brand-label {
    font-size: 12px;
    color: rgba(198, 231, 255, 0.75);
  }

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
      inset: 0;
      display: grid;
      place-items: center;
      font-family: Roboto, "Segoe UI", Arial, sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
      text-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
    }
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