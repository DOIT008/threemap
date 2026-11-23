<script setup lang="ts">
import ThreeMap from "@/components/ThreeMap/index.vue";
import analysisTheme from "@/themes/analysis";
</script>

<template>
  <ThreeMap :option="analysisTheme" :panel="false" />
</template>
