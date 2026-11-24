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

// 溜光的轨迹：直接按切图里那条亮边脊线取的（1920×91 设计稿坐标）——
// 左侧顶着顶边上沿走，到标题台面前顺着卷曲下潜到台面下方那条亮脊，
// 横穿整块台面，右侧再原路抬回顶边，最后穿出画布。弧长约 2068，下面 dash 按它换算。
const FLOW_PATH =
  "M -60 14 C -30.0 14.0 60.0 14.1 120 14.1 C 180.0 14.1 250.0 14.1 300 14.1 " +
  "C 350.0 14.1 386.7 14.2 420 14.2 C 453.3 14.2 480.0 14.2 500 14.3 " +
  "C 520.0 14.4 529.2 13.9 540 14.6 C 550.8 15.3 557.5 15.9 565 18.5 " +
  "C 572.5 21.1 579.2 26.2 585 30 C 590.8 33.8 595.0 38.4 600 41 " +
  "C 605.0 43.6 608.3 44.7 615 45.5 C 621.7 46.3 632.5 45.9 640 46 " +
  "C 647.5 46.1 653.3 45.4 660 46.3 C 666.7 47.2 673.3 48.6 680 51.3 " +
  "C 686.7 53.9 693.3 58.8 700 62.2 C 706.7 65.7 713.3 69.9 720 72 " +
  "C 726.7 74.1 726.7 74.5 740 75 C 753.3 75.5 763.3 75.0 800 75 " +
  "C 836.7 75.0 906.7 75.0 960 75 C 1013.3 75.0 1086.7 75.0 1120 75 " +
  "C 1153.3 75.0 1150.8 75.1 1160 75 C 1169.2 74.9 1169.2 75.5 1175 74.5 " +
  "C 1180.8 73.5 1186.7 72.7 1195 69 C 1203.3 65.3 1215.8 56.2 1225 52.4 " +
  "C 1234.2 48.6 1240.0 47.4 1250 46.3 C 1260.0 45.2 1275.0 46.9 1285 46 " +
  "C 1295.0 45.1 1302.5 44.3 1310 41 C 1317.5 37.7 1323.0 30.0 1330 26 " +
  "C 1337.0 22.0 1344.5 18.9 1352 17 C 1359.5 15.1 1358.7 14.9 1375 14.4 " +
  "C 1391.3 13.9 1412.5 14.2 1450 14.2 C 1487.5 14.2 1545.0 14.2 1600 14.2 " +
  "C 1655.0 14.2 1716.7 14.1 1780 14.1 C 1843.3 14.1 1946.7 14.0 1980 14";

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
    <!-- 溜光：一缕短光头贴着切图里的亮边脊线跑，跑完一轮停一会儿再来 -->
    <svg class="db-header__flow" viewBox="0 0 1920 91" aria-hidden="true">
      <path class="db-header__flow-halo" :d="FLOW_PATH" />
      <path class="db-header__flow-tail" :d="FLOW_PATH" />
      <path class="db-header__flow-mid" :d="FLOW_PATH" />
      <path class="db-header__flow-core" :d="FLOW_PATH" />
    </svg>
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

  // 溜光：一缕光头沿着亮边脊线跑。四层同一条 d，靠 dash 长度差叠出
  // “亮头 + 短尾焰”，叠加后总长度约 120px，再长就不像溜光而像一条亮线了
  &__flow {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 91px;
    overflow: visible;
    pointer-events: none;
    mix-blend-mode: screen;

    path {
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  }

  // 四层的 dash 周期都是 2400（> 轨迹长 2068，保证同一时刻线上只有一颗光头），
  // 长度从长到短、亮度从暗到亮，头部对齐
  &__flow-halo {
    stroke: rgba(70, 185, 255, 0.34);
    stroke-width: 4.6;
    filter: blur(2.4px);
    stroke-dasharray: 120 2280;
    animation: db-flow-run 6s linear infinite;
  }

  &__flow-tail {
    stroke: rgba(130, 222, 255, 0.3);
    stroke-width: 2.6;
    stroke-dasharray: 78 2322;
    animation: db-flow-run 6s linear infinite;
  }

  &__flow-mid {
    stroke: rgba(196, 241, 255, 0.55);
    stroke-width: 1.8;
    stroke-dasharray: 48 2352;
    animation: db-flow-run 6s linear infinite;
  }

  &__flow-core {
    stroke: #f2feff;
    stroke-width: 1.2;
    filter: drop-shadow(0 0 2px rgba(150, 225, 255, 0.9));
    stroke-dasharray: 26 2374;
    animation: db-flow-run 6s linear infinite;
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

// 光头沿轨迹跑一遍：跑到 -2400（一个 dash 周期）时上一颗刚好穿出画布右侧、
// 下一颗刚好从左侧画布外冒头，所以看不出接缝；剩下 22% 的时间留白（6s 一轮）
@keyframes db-flow-run {
  0% {
    stroke-dashoffset: 0;
  }
  78%,
  100% {
    stroke-dashoffset: -2400;
  }
}
</style>
