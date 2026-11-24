<script setup lang="ts">
import markerDot from "@/assets/codesign/marker-dot.png";
import { MAP_MARKER_OFFSET_X, MAP_MARKER_OFFSET_Y } from "./constants";
import dashboard from "@/data/dashboard.json";

const mapMarkers = dashboard.mapMarkers;
</script>

<template>
  <div
    v-for="(marker, i) in mapMarkers"
    :key="`${marker.name}-${marker.x}-${marker.y}`"
    class="db-map__marker"
    :style="{
      left: `${marker.x - MAP_MARKER_OFFSET_X}px`,
      top: `${marker.y - MAP_MARKER_OFFSET_Y}px`,
      animationDelay: `${i * 0.6}s`,
    }"
  >
    <span class="db-map__plate">{{ marker.name }}</span>
    <img class="db-map__chevron" :src="markerDot" alt="" />
  </div>
</template>

<style scoped lang="scss">
.db-map__marker {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-50%);
  z-index: 2;
  pointer-events: none;
  animation: db-marker-float 3s ease-in-out infinite;
}

.db-map__plate {
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

.db-map__chevron {
  width: 34px;
  height: 35px;
  margin-top: -4px;
  filter: drop-shadow(0 0 6px rgba(247, 129, 96, 0.6));
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
</style>
