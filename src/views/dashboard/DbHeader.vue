<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import headerBg from "@/assets/codesign/header-bg.png";
import dashboard from "@/data/dashboard.json";

const header = dashboard.header;

// ==================== 顶部实时时间 ====================
const now = ref(new Date());
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date();
  }, 1000);
});
onBeforeUnmount(() => {
  if (timer !== undefined) clearInterval(timer);
});

const WEEKS = ["日", "一", "二", "三", "四", "五", "六"];
function pad(n: number): string {
  return String(n).padStart(2, "0");
}
const timeText = computed(() => {
  const d = now.value;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 星期${
    WEEKS[d.getDay()]
  } ${pad(d.getHours())}:${pad(d.getMinutes())}`;
});
</script>

<template>
  <header class="db-header">
    <!-- 主标题已烘焙在 header-bg 切图中 -->
    <img class="db-header__bg" :src="headerBg" alt="" />
    <span class="db-header__org">{{ header.org }} • {{ header.updateText }}</span>
    <span class="db-header__time">{{ timeText }}</span>
  </header>
</template>

<style scoped lang="scss">
.db-header {
  position: relative;
  height: 91px;
  flex: none;

  &__bg {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 91px;
  }

  &__org {
    position: absolute;
    left: 34px;
    top: 28px;
    font-size: 16px;
    line-height: 24px;
    color: rgba(219, 231, 255, 0.7);
  }

  &__time {
    position: absolute;
    right: 50px;
    top: 28px;
    font-family: LCDMono2, Consolas, monospace;
    font-size: 20px;
    font-weight: 700;
    line-height: 21px;
    color: rgba(230, 247, 255, 1);
    letter-spacing: 1px;
    text-shadow: 0 0 10px rgba(80, 180, 255, 0.45);
  }
}
</style>
