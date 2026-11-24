<script setup lang="ts">
import PanelTitle from "./PanelTitle.vue";
import titleImg from "@/assets/codesign/panel-title-video.png";
import offlineBg from "@/assets/codesign/video-offline-bg.png";
import dashboard from "@/data/dashboard.json";

const data = dashboard.videos;
</script>

<template>
  <section class="pvv">
    <PanelTitle :img="titleImg" :width="442" :enter-left="229" :top="-9" />

    <div class="pvv__list">
      <div v-for="(video, i) in data.list" :key="video.name" class="pvv__block">
        <!-- 在线：风格化大厅画面 -->
        <template v-if="video.status === 'live'">
          <svg class="pvv__scene" viewBox="0 0 126 121" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient :id="`pvv-wall-${i}`" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#173a72" />
                <stop offset="1" stop-color="#0c2450" />
              </linearGradient>
              <linearGradient :id="`pvv-floor-${i}`" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#1a4480" />
                <stop offset="1" stop-color="#0a1f47" />
              </linearGradient>
            </defs>
            <rect width="126" height="78" :fill="`url(#pvv-wall-${i})`" />
            <rect y="78" width="126" height="43" :fill="`url(#pvv-floor-${i})`" />
            <!-- 顶部灯带 -->
            <rect x="10" y="9" width="30" height="3" rx="1.5" fill="#9fd4ff" opacity="0.5" />
            <rect x="50" y="9" width="30" height="3" rx="1.5" fill="#9fd4ff" opacity="0.42" />
            <rect x="90" y="9" width="26" height="3" rx="1.5" fill="#9fd4ff" opacity="0.46" />
            <!-- 服务窗口 -->
            <rect x="8" y="40" width="26" height="20" rx="2" fill="#2a5da6" opacity="0.8" />
            <rect x="50" y="40" width="26" height="20" rx="2" fill="#2a5da6" opacity="0.7" />
            <rect x="92" y="40" width="26" height="20" rx="2" fill="#2a5da6" opacity="0.75" />
            <!-- 柜台 -->
            <rect x="4" y="66" width="118" height="10" rx="2" fill="#3570bd" opacity="0.85" />
            <rect x="4" y="66" width="118" height="2" fill="#8fcbff" opacity="0.6" />
            <!-- 办事群众剪影 -->
            <g fill="#0a2450" opacity="0.9">
              <circle cx="30" cy="84" r="4" />
              <rect x="25" y="88" width="10" height="16" rx="4" />
              <circle cx="66" cy="86" r="4" />
              <rect x="61" y="90" width="10" height="16" rx="4" />
              <circle cx="98" cy="83" r="4" />
              <rect x="93" y="87" width="10" height="16" rx="4" />
            </g>
            <rect x="20" y="106" width="86" height="3" rx="1.5" fill="#4f8fdd" opacity="0.3" />
          </svg>
          <span class="pvv__scanline" />
        </template>

        <!-- 离线：官方切图（含四角标）+ 32×24 无信号图标 -->
        <template v-else>
          <img class="pvv__offline" :src="offlineBg" alt="" />
          <span class="pvv__wifi" aria-hidden="true" />
        </template>

        <!-- spec：四个角标 5×4、1.5px rgba(102,255,255,1) -->
        <template v-if="video.status === 'live'">
          <span class="pvv__corner is-tl" />
          <span class="pvv__corner is-tr" />
          <span class="pvv__corner is-bl" />
          <span class="pvv__corner is-br" />
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use "./panel" as *;

.pvv {
  @include db-panel(179px);

  // spec：三块 (1470/1610/1750,906) 126×121，步进 140 → 块间 14；面板内 left 14、top 37
  &__list {
    position: absolute;
    left: 14px;
    top: 37px;
    display: flex;
    gap: 14px;
  }

  &__block {
    position: relative;
    flex: none;
    width: 126px;
    height: 121px;
    box-sizing: border-box;
    border: 1px solid rgba(9, 96, 191, 1);
    background: rgba(46, 90, 184, 0.46);
    overflow: hidden;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      border-color: rgba(0, 180, 255, 0.9);
      box-shadow: 0 0 14px rgba(0, 140, 255, 0.35);
    }
  }

  &__scene {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    animation: pvv-kenburns 12s ease-in-out infinite alternate;
  }

  &__scanline {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(120, 220, 255, 0.45), transparent);
    animation: pvv-scan 4s linear infinite;
    pointer-events: none;
  }

  &__offline {
    position: absolute;
    inset: 0;
    width: 126px;
    height: 121px;
  }

  // spec：路径 1 (1797,955,32×24)，填充 rgba(184,228,253,0.34)
  &__wifi {
    position: absolute;
    left: 47px;
    top: 45px;
    width: 32px;
    height: 32px;
    background: rgba(184, 228, 253, 0.34);
    -webkit-mask: url("@/assets/codesign/icon-wifi.png") no-repeat center / contain;
    mask: url("@/assets/codesign/icon-wifi.png") no-repeat center / contain;
  }

  // spec：路径 7 —— 5×4，四角
  &__corner {
    position: absolute;
    width: 5px;
    height: 4px;
    box-sizing: border-box;
    border: 1.5px solid rgba(102, 255, 255, 1);
    pointer-events: none;

    &.is-tl {
      left: 0.86px;
      top: 1px;
    }

    &.is-tr {
      left: 120.14px;
      top: 1px;
    }

    &.is-bl {
      left: 1px;
      top: 116px;
    }

    &.is-br {
      left: 120.27px;
      top: 116px;
    }
  }
}

@keyframes pvv-kenburns {
  from {
    transform: scale(1) translateX(0);
  }
  to {
    transform: scale(1.1) translateX(-3px);
  }
}

@keyframes pvv-scan {
  0% {
    top: 0;
  }
  100% {
    top: 100%;
  }
}
</style>