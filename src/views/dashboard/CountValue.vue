<script setup lang="ts">
import { inject } from "vue";
import { DB_REVEAL } from "./constants";
import { useCountUp } from "./useCountUp";

const props = defineProps<{ value: string }>();
// 大屏里等面板真正入场（地图出场后）再滚，独立调试时注入不到、照旧挂载即滚
const reveal = inject(DB_REVEAL, null);
const display = useCountUp(() => props.value, 1400, reveal ?? undefined);
</script>

<template>
  <span>{{ display }}</span>
</template>