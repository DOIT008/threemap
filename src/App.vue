<script setup lang="ts">
import DevView from "./views/DevView.vue";
</script>

<template>
  <div class="app-shell">
    <DevView />
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
  font-family: "Microsoft Yahei", system-ui, sans-serif;
}

.app-shell {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
