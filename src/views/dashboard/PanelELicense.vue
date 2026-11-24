<script setup lang="ts">
import PanelTitle from "./PanelTitle.vue";
import CountValue from "./CountValue.vue";
import titleImg from "@/assets/codesign/panel-title-elicense.png";
import cardTypeBg from "@/assets/codesign/elicense-card-type-bg.png";
import cardTotalBg from "@/assets/codesign/elicense-card-total-bg.png";
import dashboard from "@/data/dashboard.json";

const data = dashboard.eLicense;
const CARD_BGS = [cardTypeBg, cardTotalBg];

/** spec：两张卡片 (538/656, 913)，103×117 → 面板内 left 18、卡间 15；数值 1286 在卡内 y=54、4832.6万 在 y=55 */
const CARD_VAL_TOP = [54, 55];

/** spec：柱高（16 宽，居中于槽，底对齐 140） */
const BAR_HEIGHTS = [65, 47, 43, 40, 38, 25, 23, 16];
/** spec：柱顶数值标签的面板坐标，减去槽位 top 56 得到槽内偏移 */
const VALUE_TOPS = [3, 20, 22, 24, 29, 42, 44, 51];
/** spec：Y 轴标签（右端统一 276） */
const Y_LABELS = [
  { text: "600", top: 47 },
  { text: "400", top: 75 },
  { text: "200", top: 103 },
  { text: "0", top: 134.46 },
  { text: "万张", top: 24 },
];
/** spec：200/400/600 虚线，单位为图表内坐标（0 线 140.52 单独实线） */
const GRID_LINES = [56.15, 84.27, 112.4];
</script>

<template>
  <section class="pe">
    <PanelTitle :img="titleImg" :width="895" :enter-left="142" :top="-2" />

    <!-- 证照类型 / 签发总量卡片（整卡切图 103×117） -->
    <div class="pe__cards">
      <div v-for="(card, i) in data.cards" :key="card.label" class="pe__card">
        <img class="pe__card-bg" :src="CARD_BGS[i]" alt="" />
        <span class="pe__card-val" :style="{ top: `${CARD_VAL_TOP[i]}px` }">
          <CountValue :value="card.value" />
        </span>
        <span class="pe__card-label">{{ card.label }}</span>
      </div>
    </div>

    <!-- Y 轴刻度 -->
    <span v-for="t in Y_LABELS" :key="t.text" class="pe__y" :style="{ top: `${t.top}px` }">{{ t.text }}</span>

    <!-- 柱图区：spec (810,925) → 面板内 (290,56)，575 宽 -->
    <div class="pe__chart">
      <span v-for="y in GRID_LINES" :key="y" class="pe__grid" :style="{ top: `${y}px` }" />
      <span class="pe__baseline" />

      <div class="pe__slots">
        <div v-for="(bar, i) in data.bars" :key="bar.name" class="pe__slot">
          <span class="pe__bar" :style="{ height: `${BAR_HEIGHTS[i]}px` }" />
          <span class="pe__bar-val" :style="{ top: `${VALUE_TOPS[i]}px` }">{{ bar.value }}</span>
          <span class="pe__cat">{{ bar.name }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use "./panel" as *;

.pe {
  @include db-panel(179px, 885px);

  // spec：两张卡 (538/656,913) 103×117，步进 118 → 卡间 15；面板内 left 18、top 44
  &__cards {
    position: absolute;
    left: 18px;
    top: 44px;
    display: flex;
    gap: 15px;
  }

  // spec：103×117，圆角 17/7/7/7，0.78px 渐变描边
  &__card {
    position: relative;
    flex: none;
    width: 103px;
    height: 117px;
    border-radius: 17px 7px 7px 7px;
    background:
      radial-gradient(33% 33% at 116.1% 122.8%, rgba(0, 161, 255, 0.2) 0%, rgba(0, 74, 255, 0) 100%),
      linear-gradient(180deg, rgba(3, 129, 255, 0.1) 0%, rgba(0, 113, 255, 0.2) 100%);

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 1;
      padding: 0.78px;
      border-radius: inherit;
      background: linear-gradient(0deg, rgba(58, 127, 255, 1) 0%, rgba(58, 127, 255, 0.2) 100%);
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      mask-composite: exclude;
      pointer-events: none;
    }
  }

  &__card-bg {
    position: absolute;
    inset: 0;
    width: 103px;
    height: 117px;
  }

  &__card-val {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 1;
    text-align: center;
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 18px;
    line-height: 22px;
    font-weight: 700;
    color: rgba(255, 255, 255, 1);
    text-shadow: 0 0 7px rgba(36, 160, 255, 0.5);
  }

  // spec：证照类型 (558,999,12px)
  &__card-label {
    position: absolute;
    left: 0;
    right: 0;
    top: 86px;
    z-index: 1;
    text-align: center;
    font-size: 12px;
    line-height: 12px;
    color: rgba(198, 231, 255, 0.8);
  }

  // spec：Y 轴文字右端 276
  &__y {
    position: absolute;
    right: 609px;
    width: 40px;
    text-align: right;
    font-size: 12px;
    line-height: 18px;
    color: rgba(198, 231, 255, 0.8);
    white-space: nowrap;
  }

  // spec：(810,0) 起 575 宽
  &__chart {
    position: absolute;
    left: 290px;
    top: 0;
    width: 575px;
    height: 150px;
  }

  &__grid {
    position: absolute;
    left: 0;
    width: 575px;
    height: 0;
    border-top: 1px dashed rgba(172, 224, 255, 0.2);
    pointer-events: none;
  }

  // spec：x 轴横线 y=140.52，rgba(172,224,255,0.5)
  &__baseline {
    position: absolute;
    left: 0;
    top: 140.52px;
    width: 575px;
    height: 0.63px;
    background: rgba(172, 224, 255, 0.5);
    pointer-events: none;
  }

  // spec：8 个槽 (810,925) 56×84，步进 74 → 槽间 18；图表内 left 0、top 56
  &__slots {
    position: absolute;
    left: 0;
    top: 56px;
    display: flex;
    gap: 18px;
  }

  // spec：槽 56×84
  &__slot {
    position: relative;
    flex: none;
    width: 56px;
    height: 84px;
    box-sizing: border-box;
    border: 1px solid rgba(151, 151, 151, 0.1);
    background: rgba(65, 97, 156, 0.1);
  }

  // spec：柱 16 宽，底对齐，180deg 渐变 + 顶部高亮
  &__bar {
    position: absolute;
    left: 20px;
    bottom: 0;
    width: 16px;
    box-sizing: border-box;
    border: 0.5px solid rgba(151, 151, 151, 1);
    background: linear-gradient(180deg, rgba(0, 58, 255, 0) 0%, rgba(21, 154, 255, 1) 100%);
    box-shadow: inset 0 3px 0 0 rgba(21, 154, 255, 1);
    transition: filter 0.2s ease;
  }

  &__slot:hover &__bar {
    filter: brightness(1.35) drop-shadow(0 0 6px rgba(46, 160, 255, 0.7));
  }

  // spec：36×17，Roboto 500，14px
  &__bar-val {
    position: absolute;
    left: 10px;
    width: 36px;
    text-align: center;
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 14px;
    line-height: 17px;
    font-weight: 500;
    color: rgba(255, 255, 255, 1);
    white-space: nowrap;
  }

  // spec：类目 y=146，居中于槽
  &__cat {
    position: absolute;
    left: 50%;
    top: 90px;
    transform: translateX(-50%);
    font-size: 12px;
    line-height: 18px;
    color: rgba(198, 231, 255, 0.8);
    white-space: nowrap;
  }
}
</style>