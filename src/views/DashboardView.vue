<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import ThreeMap from "@/components/ThreeMap/index.vue";
import PanelVolume from "./dashboard/PanelVolume.vue";
import PanelEfficiency from "./dashboard/PanelEfficiency.vue";
import PanelTrend from "./dashboard/PanelTrend.vue";
import PanelTop5 from "./dashboard/PanelTop5.vue";
import PanelELicense from "./dashboard/PanelELicense.vue";
import PanelAffairs from "./dashboard/PanelAffairs.vue";
import PanelUsers from "./dashboard/PanelUsers.vue";
import PanelSupervision from "./dashboard/PanelSupervision.vue";
import PanelVideo from "./dashboard/PanelVideo.vue";
import CountValue from "./dashboard/CountValue.vue";
import headerBg from "@/assets/codesign/header-bg.png";
import kpiBg from "@/assets/codesign/center-kpi-bg.png";
import kpiIconTotal from "@/assets/codesign/kpi-icon-total.png";
import kpiIconMonth from "@/assets/codesign/kpi-icon-month.png";
import kpiIconDaily from "@/assets/codesign/kpi-icon-daily.png";
import kpiIconRate from "@/assets/codesign/kpi-icon-rate.png";
import markerDot from "@/assets/codesign/marker-dot.png";
import cardCityAll from "@/assets/codesign/card-city-all.png";
import cardCityLevel from "@/assets/codesign/card-city-level.png";
import dashboard from "@/data/dashboard.json";

// ==================== 数据 ====================
const header = dashboard.header;
const kpiCards = dashboard.kpiCards;
const yearTotals = dashboard.yearTotals;
const mapMarkers = dashboard.mapMarkers;

const kpiIcons = [kpiIconTotal, kpiIconMonth, kpiIconDaily, kpiIconRate];
const yearCardImgs = [cardCityAll, cardCityLevel];
/** KPI 项距底板左端的 spec 坐标 */
const KPI_LEFTS = [56, 282, 481, 669];
/** 本年办件量卡片距地图区左端的 spec 坐标 */
const YEAR_CARD_LEFTS = [520, 760];

// ==================== 退出大屏 ====================
const router = useRouter();
function exitFullscreen(): void {
  router.push("/overview");
}

// ==================== 1920×1080 等比缩放 ====================
const scale = ref(1);
function fit(): void {
  scale.value = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
}
onMounted(() => {
  fit();
  window.addEventListener("resize", fit);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", fit);
});

// ==================== 顶部实时时间 ====================
const now = ref(new Date());
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date();
  }, 1000);
});
onBeforeUnmount(() => {
  if (timer !== undefined) clearInterval(timer);
});

const WEEKS = ["日", "一", "二", "三", "四", "五", "六"];
function pad(n: number): string {
  return String(n).padStart(2, "0");
}
const timeText = computed(() => {
  const d = now.value;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 星期${
    WEEKS[d.getDay()]
  } ${pad(d.getHours())}:${pad(d.getMinutes())}`;
});
</script>

<template>
  <div class="dashboard-viewport">
    <div class="dashboard" :style="{ transform: `scale(${scale})` }">
      <!-- 顶部标题栏：主标题已烘焙在 header-bg 切图中 -->
      <header class="db-header">
        <img class="db-header__bg" :src="headerBg" alt="" />
        <span class="db-header__org">{{ header.org }} · {{ header.updateText }}</span>
        <span class="db-header__time">{{ timeText }}</span>
      </header>

      <main class="db-main">
        <!-- 左列 -->
        <div class="db-col">
          <div class="db-slot" style="animation-delay: 0.05s"><PanelVolume /></div>
          <div class="db-slot" style="animation-delay: 0.15s"><PanelEfficiency /></div>
          <div class="db-slot" style="animation-delay: 0.25s"><PanelTrend /></div>
          <div class="db-slot" style="animation-delay: 0.35s"><PanelTop5 /></div>
        </div>

        <!-- 中列：KPI 条 + 郑州 3D 地图 + 本年办件量卡片 + 电子证照 -->
        <div class="db-center">
          <div class="db-kpi db-slot" style="animation-delay: 0.1s">
            <img class="db-kpi__bg" :src="kpiBg" alt="" />
            <div
              v-for="(kpi, i) in kpiCards"
              :key="kpi.label"
              class="db-kpi__item"
              :style="{ left: `${KPI_LEFTS[i]}px` }"
            >
              <img class="db-kpi__icon" :src="kpiIcons[i]" alt="" />
              <div class="db-kpi__text">
                <span class="db-kpi__label">{{ kpi.label }}</span>
                <span class="db-kpi__val"><CountValue :value="kpi.value" /></span>
              </div>
            </div>
          </div>

          <div class="db-map">
            <div class="db-map__three">
              <ThreeMap :panel="false" :legend="false" area="410100" area-name="郑州" />
            </div>
            <div
              v-for="(marker, i) in mapMarkers"
              :key="`${marker.name}-${marker.x}-${marker.y}`"
              class="db-map__marker"
              :style="{ left: `${marker.x - 470}px`, top: `${marker.y - 317 - 46}px`, animationDelay: `${i * 0.6}s` }"
            >
              <span class="db-map__plate">{{ marker.name }}</span>
              <img class="db-map__chevron" :src="markerDot" alt="" />
            </div>
            <div
              v-for="(card, i) in yearTotals"
              :key="card.label"
              class="db-year-card"
              :class="`is-${card.glow}`"
              :style="{ left: `${YEAR_CARD_LEFTS[i]}px` }"
            >
              <img class="db-year-card__bg" :src="yearCardImgs[i]" alt="" />
              <div class="db-year-card__text">
                <span class="db-year-card__val"><CountValue :value="card.value" /></span>
                <span class="db-year-card__label">{{ card.label }}</span>
              </div>
            </div>
          </div>

          <div class="db-slot" style="animation-delay: 0.45s"><PanelELicense /></div>
        </div>

        <!-- 右列 -->
        <div class="db-col">
          <div class="db-slot" style="animation-delay: 0.1s"><PanelAffairs /></div>
          <div class="db-slot" style="animation-delay: 0.2s"><PanelUsers /></div>
          <div class="db-slot" style="animation-delay: 0.3s"><PanelSupervision /></div>
          <div class="db-slot" style="animation-delay: 0.4s"><PanelVideo /></div>
        </div>
      </main>

      <button class="db-exit" title="退出大屏" @click="exitFullscreen">✕ 退出</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard-viewport {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: #040a1c;
  overflow: hidden;
}

.dashboard {
  position: relative;
  width: 1920px;
  height: 1080px;
  flex: none;
  display: flex;
  flex-direction: column;
  background: url("@/assets/codesign/bg-full.png") no-repeat center / 100% 100%;
  transform-origin: center center;

  // 暗角，聚焦中心
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 42%, transparent 55%, rgba(2, 6, 18, 0.5) 100%);
    pointer-events: none;
    z-index: 5;
  }

  // 缓慢横向扫光
  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    width: 220px;
    background: linear-gradient(90deg, transparent, rgba(90, 170, 255, 0.05), transparent);
    animation: db-sweep 10s linear infinite;
    pointer-events: none;
    z-index: 6;
  }
}

@keyframes db-sweep {
  0% {
    left: -240px;
  }
  100% {
    left: 1920px;
  }
}

// ==================== 面板入场 ====================
.db-slot {
  animation: db-in 0.7s cubic-bezier(0.22, 0.8, 0.3, 1) both;
}

@keyframes db-in {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ==================== 顶部 ====================
.db-header {
  position: relative;
  height: 91px;
  flex: none;

  &__bg {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 91px;
  }

  &__org {
    position: absolute;
    left: 34px;
    top: 28px;
    font-size: 16px;
    line-height: 24px;
    color: rgba(219, 231, 255, 0.7);
  }

  &__time {
    position: absolute;
    right: 50px;
    top: 28px;
    font-family: LCDMono2, Consolas, monospace;
    font-size: 20px;
    font-weight: 700;
    line-height: 21px;
    color: rgba(230, 247, 255, 1);
    letter-spacing: 1px;
    text-shadow: 0 0 10px rgba(80, 180, 255, 0.45);
  }
}

// ==================== 三栏 ====================
.db-main {
  flex: 1;
  display: flex;
  justify-content: space-between;
  padding: 0 28px 23px;
  min-height: 0;
}

.db-col {
  width: 442px;
  flex: none;
  display: flex;
  flex-direction: column;
}

.db-center {
  width: 976px;
  flex: none;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

// ==================== KPI 条 ====================
.db-kpi {
  position: relative;
  width: 905px;
  height: 187px;
  flex: none;
  margin: 39px auto 0;

  &__bg {
    position: absolute;
    inset: 0;
    width: 905px;
    height: 187px;
  }

  &__item {
    position: absolute;
    top: 40px;
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

// ==================== 地图区 ====================
.db-map {
  position: relative;
  flex: 1;
  min-height: 0;

  &__three {
    position: absolute;
    inset: 0;
  }

  &__marker {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateX(-50%);
    z-index: 2;
    pointer-events: none;
    animation: db-marker-float 3s ease-in-out infinite;
  }

  &__plate {
    padding: 5px 16px;
    border: 1px solid rgba(247, 129, 96, 0.9);
    background: linear-gradient(180deg, rgba(140, 50, 25, 0.85), rgba(70, 25, 12, 0.92));
    box-shadow: 0 0 14px rgba(247, 129, 96, 0.45), inset 0 0 10px rgba(247, 129, 96, 0.25);
    font-size: 16px;
    line-height: 24px;
    color: rgba(255, 255, 255, 1);
    white-space: nowrap;
    letter-spacing: 2px;
  }

  &__chevron {
    width: 34px;
    height: 35px;
    margin-top: -4px;
    filter: drop-shadow(0 0 6px rgba(247, 129, 96, 0.6));
  }
}

@keyframes db-marker-float {
  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-5px);
  }
}

// ==================== 本年办件量卡片 ====================
.db-year-card {
  position: absolute;
  bottom: 38px;
  width: 228px;
  height: 66px;
  z-index: 2;
  pointer-events: none;

  &__bg {
    display: block;
    width: 228px;
    height: 66px;
    animation: db-card-glow 3s ease-in-out infinite;
  }

  &__text {
    position: absolute;
    left: 74px;
    top: 10px;
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
    margin-top: 2px;
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

// ==================== 退出控件 ====================
.db-exit {
  position: absolute;
  right: 14px;
  bottom: 10px;
  z-index: 10;
  padding: 3px 10px;
  border: 1px solid rgba(80, 160, 255, 0.35);
  border-radius: 3px;
  background: rgba(8, 22, 50, 0.6);
  color: rgba(160, 200, 240, 0.55);
  font-size: 12px;
  cursor: pointer;
  opacity: 0.35;
  transition: opacity 0.2s ease, color 0.2s ease, border-color 0.2s ease;

  &:hover {
    opacity: 1;
    color: #ffffff;
    border-color: rgba(0, 170, 255, 0.8);
  }
}
</style>