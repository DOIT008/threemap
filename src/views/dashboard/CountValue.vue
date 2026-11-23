<script setup lang="ts">
import { useCountUp } from "./useCountUp";

const props = defineProps<{ value: string }>();
const display = useCountUp(() => props.value);
</script>

<template>
  <span>{{ display }}</span>
</template>