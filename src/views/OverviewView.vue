<script setup lang="ts">
import ThreeMap from "@/components/ThreeMap/index.vue";
import overviewTheme from "@/themes/overview";
</script>

<template>
  <!-- 上线写法：只传主题，不带面板 -->
  <ThreeMap :option="overviewTheme" :panel="false" />
</template>
