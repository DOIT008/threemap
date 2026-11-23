<script setup lang="ts">
import ThreeMap from "@/components/ThreeMap/index.vue";
</script>

<template>
  <!-- 调参台：只有这一页带面板，调好后点「导出配置」存到 src/themes/ 下 -->
  <ThreeMap :panel="true" />
</template>
