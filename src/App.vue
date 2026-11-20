<script setup>
import { computed } from "vue";
import ThreeMap from "./components/ThreeMap/index.vue";

// 面板只是开发期调参工具。访问 /?panel=0 即可看到「上线后不带面板」的样子，
// 也就是项目里 :panel="false" 的实际效果。
const showPanel = computed(() => new URLSearchParams(window.location.search).get("panel") !== "0");
</script>

<template>
  <div class="app-container">
    <ThreeMap :panel="showPanel" />
  </div>
</template>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a0e27;
}

.app-container {
  width: 100%;
  height: 100%;
}
</style>
