<script setup lang="ts">
import kpiBg from "@/assets/codesign/center-kpi-bg.png";
import kpiIconTotal from "@/assets/codesign/kpi-icon-total.png";
import kpiIconMonth from "@/assets/codesign/kpi-icon-month.png";
import kpiIconDaily from "@/assets/codesign/kpi-icon-daily.png";
import kpiIconRate from "@/assets/codesign/kpi-icon-rate.png";
import CountValue from "./CountValue.vue";
import { KPI_ITEM_WIDTHS } from "./constants";
import dashboard from "@/data/dashboard.json";

const kpiCards = dashboard.kpiCards;
const kpiIcons = [kpiIconTotal, kpiIconMonth, kpiIconDaily, kpiIconRate];
</script>

<template>
  <div class="db-kpi">
    <img class="db-kpi__bg" :src="kpiBg" alt="" />
    <div class="db-kpi__list">
      <div
        v-for="(kpi, i) in kpiCards"
        :key="kpi.label"
        class="db-kpi__item"
        :style="{ width: `${KPI_ITEM_WIDTHS[i]}px` }"
      >
        <img class="db-kpi__icon" :src="kpiIcons[i]" alt="" />
        <div class="db-kpi__text">
          <span class="db-kpi__label">{{ kpi.label }}</span>
          <span class="db-kpi__val"><CountValue :value="kpi.value" /></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.db-kpi {
  position: relative;
  width: 905px;
  height: 187px;
  flex: none;
  margin: 0px auto 0;

  &__bg {
    position: absolute;
    inset: 0;
    width: 905px;
    height: 187px;
  }

  // spec：图标左边缘 54/280/479/667，整行 y=70
  &__list {
    position: absolute;
    left: 54px;
    top: 70px;
    display: flex;
    align-items: center;
  }

  &__item {
    flex: none;
    display: flex;
    align-items: center;
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-3px);

      .db-kpi__icon {
        filter: drop-shadow(0 0 10px rgba(0, 160, 255, 0.8));
      }
    }
  }

  &__icon {
    width: 46px;
    height: 46px;
    flex: none;
    transition: filter 0.2s ease;
  }

  &__text {
    margin-left: 19px;
    display: flex;
    flex-direction: column;
  }

  &__label {
    font-size: 14px;
    line-height: 17px;
    color: rgba(198, 231, 255, 1);
    white-space: nowrap;
  }

  &__val {
    margin-top: 6px;
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 22px;
    font-weight: 700;
    line-height: 26px;
    color: rgba(255, 255, 255, 1);
    text-shadow: 0 0 7px rgba(36, 160, 255, 0.5);
    white-space: nowrap;
  }
}
</style>
