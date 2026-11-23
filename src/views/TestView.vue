




<template>
  <ThreeMap :option="testTheme" :panel="false" />
</template>

<script setup lang="ts">
import ThreeMap from "@/components/ThreeMap/index.vue";
import testTheme from "@/themes/test";
</script>

<style lang="scss" scoped>

</style>






/**
* 由控制面板导出的地图主题。
* 用法：
<ThreeMap :option="mapTheme" :panel="false" />
*/


export default mapTheme;
