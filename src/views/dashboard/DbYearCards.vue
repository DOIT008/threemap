<script setup lang="ts">
import cardCityAll from "@/assets/codesign/card-city-all.png";
import cardCityLevel from "@/assets/codesign/card-city-level.png";
import CountValue from "./CountValue.vue";
import dashboard from "@/data/dashboard.json";

const yearTotals = dashboard.yearTotals;
const yearCardImgs = [cardCityAll, cardCityLevel];
</script>

<template>
  <div class="db-year">
    <div
      v-for="(card, i) in yearTotals"
      :key="card.label"
      class="db-year-card"
      :class="`is-${card.glow}`"
    >
      <img class="db-year-card__bg" :src="yearCardImgs[i]" alt="" />
      <div class="db-year-card__text">
        <span class="db-year-card__val"><CountValue :value="card.value" /></span>
        <span class="db-year-card__label">{{ card.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// spec：圆环左边缘画布 x=955/1195 → 相对地图区（x=520.5）434.5；卡高 66，底边距地图区底 25
.db-year {
  position: absolute;
  left: 434.5px;
  bottom: 190px;
  display: flex;
  gap: 12px;
  z-index: 2;
  pointer-events: none;
}

.db-year-card {
  position: relative;
  flex: none;
  width: 228px;
  height: 66px;

  &__bg {
    display: block;
    width: 228px;
    height: 66px;
    animation: db-card-glow 3s ease-in-out infinite;
  }

  // spec：数值 (1027,779)、标签 (1027,810) → 相对卡片左上角 (955,778) 为 (72,1) / (72,32)
  &__text {
    position: absolute;
    left: 72px;
    top: 1px;
    display: flex;
    flex-direction: column;
  }

  &__val {
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 22px;
    font-weight: 700;
    line-height: 26px;
    color: rgba(255, 255, 255, 1);
    white-space: nowrap;
  }

  &__label {
    // 数值行高 26（779..805）→ 标签 810，间距 5
    margin-top: 5px;
    font-size: 14px;
    line-height: 17px;
    white-space: nowrap;
  }

  &.is-orange .db-year-card__val {
    text-shadow: 0 0 7px rgba(247, 129, 96, 0.5);
  }

  &.is-orange .db-year-card__label {
    color: rgba(255, 231, 217, 1);
  }

  &.is-blue .db-year-card__val {
    text-shadow: 0 0 7px rgba(36, 160, 255, 0.5);
  }

  &.is-blue .db-year-card__label {
    color: rgba(199, 220, 255, 1);
  }
}

@keyframes db-card-glow {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.18);
  }
}
</style>
