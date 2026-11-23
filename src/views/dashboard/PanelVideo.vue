<script setup lang="ts">
import PanelTitle from "./PanelTitle.vue";
import titleImg from "@/assets/codesign/panel-title-video.png";
import offlineBg from "@/assets/codesign/video-offline-bg.png";
import iconWifi from "@/assets/codesign/icon-wifi.png";
import dashboard from "@/data/dashboard.json";

const data = dashboard.videos;
</script>

<template>
  <section class="pd">
    <PanelTitle :img="titleImg" :width="442" :enter-left="237" />

    <div class="pd__list">
      <div v-for="(video, i) in data.list" :key="video.name" class="pd__block" :class="`is-${video.status}`">
        <!-- 在线：风格化大厅画面 + 扫描线 -->
        <template v-if="video.status === 'live'">
          <svg class="pd__scene" viewBox="0 0 127 121" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient :id="`pd-wall-${i}`" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#0e2c5e" />
                <stop offset="1" stop-color="#071a3e" />
              </linearGradient>
              <linearGradient :id="`pd-floor-${i}`" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#123a74" />
                <stop offset="1" stop-color="#081d42" />
              </linearGradient>
            </defs>
            <rect width="127" height="78" :fill="`url(#pd-wall-${i})`" />
            <rect y="78" width="127" height="43" :fill="`url(#pd-floor-${i})`" />
            <!-- 顶部灯带 -->
            <rect x="10" y="8" width="30" height="3" rx="1.5" fill="#9fd4ff" opacity="0.55" />
            <rect x="50" y="8" width="30" height="3" rx="1.5" fill="#9fd4ff" opacity="0.45" />
            <rect x="90" y="8" width="27" height="3" rx="1.5" fill="#9fd4ff" opacity="0.5" />
            <!-- 服务窗口 -->
            <rect x="8" y="40" width="26" height="20" rx="2" fill="#1b4a8c" opacity="0.8" />
            <rect x="50" y="40" width="26" height="20" rx="2" fill="#1b4a8c" opacity="0.7" />
            <rect x="92" y="40" width="26" height="20" rx="2" fill="#1b4a8c" opacity="0.75" />
            <!-- 柜台 -->
            <rect x="4" y="66" width="119" height="10" rx="2" fill="#2a5fa8" opacity="0.85" />
            <rect x="4" y="66" width="119" height="2" fill="#7fc4ff" opacity="0.6" />
            <!-- 办事群众剪影 -->
            <g fill="#0a2450" opacity="0.9">
              <circle cx="30" cy="84" r="4" />
              <rect x="25" y="88" width="10" height="16" rx="4" />
              <circle cx="66" cy="86" r="4" />
              <rect x="61" y="90" width="10" height="16" rx="4" />
              <circle cx="98" cy="83" r="4" />
              <rect x="93" y="87" width="10" height="16" rx="4" />
            </g>
            <!-- 地面反光 -->
            <rect x="20" y="106" width="87" height="3" rx="1.5" fill="#3f7fd0" opacity="0.3" />
          </svg>
          <span class="pd__scanline" />
          <span class="pd__live"><i />实时</span>
        </template>
        <!-- 离线：官方占位切图 -->
        <template v-else>
          <img class="pd__offline" :src="offlineBg" alt="" />
          <img class="pd__wifi" :src="iconWifi" alt="" />
        </template>
        <span class="pd__name">{{ video.name }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.pd {
  position: relative;
  width: 442px;
  height: 199px;
  flex: none;
  background: linear-gradient(180deg, rgba(12, 32, 74, 0.42), rgba(6, 16, 42, 0.62));
  border: 1px solid rgba(46, 100, 190, 0.32);
  box-shadow: inset 0 0 26px rgba(20, 60, 140, 0.16);

  &__list {
    display: flex;
    gap: 8px;
    padding: 12px 0 0 34px;
  }

  &__block {
    position: relative;
    width: 127px;
    height: 121px;
    overflow: hidden;
    border: 1px solid rgba(46, 100, 190, 0.4);
    border-radius: 3px;
    background: rgba(8, 24, 58, 0.5);
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

    &:hover {
      border-color: rgba(0, 160, 255, 0.75);
      box-shadow: 0 0 14px rgba(0, 120, 255, 0.3);
      transform: translateY(-2px);
    }
  }

  &__scene {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    animation: pd-kenburns 12s ease-in-out infinite alternate;
  }

  &__scanline {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(120, 220, 255, 0.5), transparent);
    animation: pd-scan 4s linear infinite;
    pointer-events: none;
  }

  &__live {
    position: absolute;
    left: 6px;
    top: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 1px 6px;
    border-radius: 2px;
    background: rgba(6, 16, 40, 0.7);
    font-size: 10px;
    color: rgba(230, 247, 255, 0.9);

    i {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ff4d4f;
      animation: pd-blink 1.2s ease-in-out infinite;
    }
  }

  &__offline {
    position: absolute;
    inset: 0;
    width: 127px;
    height: 121px;
  }

  &__wifi {
    position: absolute;
    left: 50%;
    top: 40px;
    transform: translateX(-50%);
    width: 32px;
    height: 32px;
    opacity: 0.8;
  }

  &__name {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 8px;
    text-align: center;
    font-size: 12px;
    color: rgba(198, 231, 255, 0.85);
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  }
}

@keyframes pd-kenburns {
  from {
    transform: scale(1) translateX(0);
  }
  to {
    transform: scale(1.12) translateX(-4px);
  }
}

@keyframes pd-scan {
  0% {
    top: 0;
  }
  100% {
    top: 100%;
  }
}

@keyframes pd-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.25;
  }
}
</style>