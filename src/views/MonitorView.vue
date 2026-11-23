<script setup lang="ts">
import ThreeMap from "@/components/ThreeMap/index.vue";
import monitorTheme from "@/themes/monitor";
</script>

<template>
  <ThreeMap :option="monitorTheme" :panel="false" />
</template>
