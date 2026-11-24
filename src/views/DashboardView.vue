<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
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
import DbHeader from "./dashboard/DbHeader.vue";
import DbKpiBar from "./dashboard/DbKpiBar.vue";
import DbYearCards from "./dashboard/DbYearCards.vue";
import DbMapMarkers from "./dashboard/DbMapMarkers.vue";
import { STAGE } from "./dashboard/constants";
import dashboardTheme from "@/themes/dashboard";

// ==================== 退出大屏 ====================
const router = useRouter();
function exitFullscreen(): void {
  router.push("/overview");
}

// ==================== 1920×1080 等比缩放 ====================
const scale = ref(1);
function fit(): void {
  scale.value = Math.min(
    window.innerWidth / STAGE.width,
    window.innerHeight / STAGE.height,
  );
}
onMounted(() => {
  fit();
  window.addEventListener("resize", fit);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", fit);
});
</script>

<template>
  <div class="dashboard-viewport">
    <div class="dashboard" :style="{ transform: `scale(${scale})` }">
      <DbHeader />

      <main class="db-main">
        <!-- 左列：spec 面板间距 25 / 27 / 28 -->
        <div class="db-col">
          <div class="db-slot" style="animation-delay: 0.05s"><PanelVolume /></div>
          <div class="db-slot" style="animation-delay: 0.15s; margin-top: 25px"><PanelEfficiency /></div>
          <div class="db-slot" style="animation-delay: 0.25s; margin-top: 27px"><PanelTrend /></div>
          <div class="db-slot" style="animation-delay: 0.35s; margin-top: 28px"><PanelTop5 /></div>
        </div>

        <!-- 中列：KPI 条 + 郑州 3D 地图 + 本年办件量卡片 + 电子证照 -->
        <div class="db-center">
          <div class="db-slot" style="animation-delay: 0.1s"><DbKpiBar /></div>

          <div class="db-map">
            <div class="db-map__three">
              <ThreeMap :option="dashboardTheme" :panel="false" :legend="false" area="410100" area-name="郑州" />
            </div>
            <!-- <DbMapMarkers /> -->
            <DbYearCards />
          </div>

          <div class="db-slot" style="animation-delay: 0.45s"><PanelELicense /></div>
        </div>

        <!-- 右列：spec 面板间距 26 / 23 / 27 -->
        <div class="db-col">
          <div class="db-slot" style="animation-delay: 0.1s"><PanelAffairs /></div>
          <div class="db-slot" style="animation-delay: 0.2s; margin-top: 26px"><PanelUsers /></div>
          <div class="db-slot" style="animation-delay: 0.3s; margin-top: 23px"><PanelSupervision /></div>
          <div class="db-slot" style="animation-delay: 0.4s; margin-top: 27px"><PanelVideo /></div>
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

  // 暗角，聚焦中心（压低在面板之下，避免压暗侧列与底部面板）
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 42%, transparent 58%, rgba(2, 6, 18, 0.28) 100%);
    pointer-events: none;
    z-index: 1;
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

// ==================== 三栏 ====================
// spec：首行面板 y=105（header 91 + 14），底边 1048（1080 - 32）
.db-main {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;
  padding: 0 32px 32px 38px;
  min-height: 0;
}

.db-col {
  width: 432px;
  flex: none;
  display: flex;
  flex-direction: column;
  margin-top: 14px;
}

.db-center {
  width: 885px;
  height: 100%;
  flex: none;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

// ==================== 地图区 ====================
.db-map {
  // position: relative;
  // flex: 1;
  // min-height: 0;
  height: 100%;
  &__three {
    position: absolute;
    inset: 0;
    top: -145px;
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
