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

// 溜光的轨迹：直接按切图里那条亮边脊线取的（1920×91 设计稿坐标）。
// 拆成左右两段，各自从画面外沿顶边上沿起步，顺着卷曲下潜到台面下方那条亮脊，
// 一直跑到标题台面正中（x=950）收尾 —— 两缕对向进场、在标题下面汇合就停。
// 每条半程弧长约 1030，下面的 dash 收尾位置由浏览器量出来的实际弧长决定（见 onMounted）。
const FLOW_LEFT =
  "M -60 14 C -30.0 14.0 60.0 14.1 120 14.1 C 180.0 14.1 250.0 14.1 300 14.1 " +
  "C 350.0 14.1 386.7 14.2 420 14.2 C 453.3 14.2 480.0 14.2 500 14.3 " +
  "C 520.0 14.4 529.2 13.9 540 14.6 C 550.8 15.3 557.5 15.9 565 18.5 " +
  "C 572.5 21.1 579.2 26.2 585 30 C 590.8 33.8 595.0 38.4 600 41 " +
  "C 605.0 43.6 608.3 44.7 615 45.5 C 621.7 46.3 632.5 45.9 640 46 " +
  "C 647.5 46.1 653.3 45.4 660 46.3 C 666.7 47.2 673.3 48.6 680 51.3 " +
  "C 686.7 53.9 693.3 58.8 700 62.2 C 706.7 65.7 713.3 69.9 720 72 " +
  "C 726.7 74.1 726.7 74.5 740 75 C 753.3 75.5 763.3 75.0 800 75 " +
  "C 836.7 75.0 900.0 75.0 950 75";

// 右段就是把原轨迹反过来：起点在右端 1980，一路往左跑到同一个收尾点（950，75）
const FLOW_RIGHT =
  "M 1980 14 C 1946.7 14.0 1843.3 14.1 1780 14.1 C 1716.7 14.1 1655.0 14.2 1600 14.2 " +
  "C 1545.0 14.2 1487.5 14.2 1450 14.2 C 1412.5 14.2 1391.3 13.9 1375 14.4 " +
  "C 1358.7 14.9 1359.5 15.1 1352 17 C 1344.5 18.9 1337.0 22.0 1330 26 " +
  "C 1323.0 30.0 1317.5 37.7 1310 41 C 1302.5 44.3 1295.0 45.1 1285 46 " +
  "C 1275.0 46.9 1260.0 45.2 1250 46.3 C 1240.0 47.4 1234.2 48.6 1225 52.4 " +
  "C 1215.8 56.2 1203.3 65.3 1195 69 C 1186.7 72.7 1180.8 73.5 1175 74.5 " +
  "C 1169.2 75.5 1169.2 74.9 1160 75 C 1150.8 75.1 1153.3 75.0 1120 75 " +
  "C 1086.7 75.0 1013.3 75.0 960 75 C 955.0 75.0 952.0 75.0 950 75";

// 两条轨迹的实际弧长量出来写到各自的 --flow-span 上：
// dash 的收尾位置要刚好落在轨迹末端，硬编码 1030 会有几像素的出入（短的 core 层容易整条滑出去）
const flowRef = ref<SVGSVGElement>();
onMounted(() => {
  flowRef.value?.querySelectorAll("g").forEach((g) => {
    const path = g.querySelector("path");
    if (path) g.style.setProperty("--flow-span", `${path.getTotalLength().toFixed(1)}px`);
  });
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
    <!-- 溜光：左、右各一缕，从画面外沿着亮边脊线往中间跑，在标题台面正中收尾 -->
    <svg ref="flowRef" class="db-header__flow" viewBox="0 0 1920 91" aria-hidden="true">
      <g class="db-header__flow-streak">
        <path class="db-header__flow-halo" :d="FLOW_LEFT" />
        <path class="db-header__flow-tail" :d="FLOW_LEFT" />
        <path class="db-header__flow-mid" :d="FLOW_LEFT" />
        <path class="db-header__flow-core" :d="FLOW_LEFT" />
      </g>
      <g class="db-header__flow-streak">
        <path class="db-header__flow-halo" :d="FLOW_RIGHT" />
        <path class="db-header__flow-tail" :d="FLOW_RIGHT" />
        <path class="db-header__flow-mid" :d="FLOW_RIGHT" />
        <path class="db-header__flow-core" :d="FLOW_RIGHT" />
      </g>
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

  // 溜光：一缕光头沿亮边脊线跑。每缕四层同一条 d，靠 dash 长度差叠出
  // “亮头 + 短尾焰”。叠起来总长约 40px（原来 120 太长，看着像一条亮线）
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
      // 每层自带 --flow-len（就是它的 dash 长），四层的「亮头」靠它在 keyframes 里对齐
      animation: db-flow-run 5s linear infinite;
    }
  }

  // 四层的 dash 周期都是 1200（> 半程轨迹 1030，保证同一时刻线上只有一颗光头），
  // 长度从长到短、亮度从暗到亮；--flow-len 写本层 dash 长，头对齐全靠它（见 @keyframes）。
  &__flow-halo {
    --flow-len: 40px;
    stroke: rgba(70, 185, 255, 0.34);
    stroke-width: 4.6;
    filter: blur(2.4px);
    stroke-dasharray: 40 1160;
  }

  &__flow-tail {
    --flow-len: 26px;
    stroke: rgba(130, 222, 255, 0.3);
    stroke-width: 2.6;
    stroke-dasharray: 26 1174;
  }

  &__flow-mid {
    --flow-len: 16px;
    stroke: rgba(196, 241, 255, 0.55);
    stroke-width: 1.8;
    stroke-dasharray: 16 1184;
  }

  &__flow-core {
    --flow-len: 9px;
    stroke: #f2feff;
    stroke-width: 1.2;
    filter: drop-shadow(0 0 2px rgba(150, 225, 255, 0.9));
    stroke-dasharray: 9 1191;
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

// 一缕光在自己那半条轨迹上跑一遍，跑到终点就停在标题台面正中
// （左右两条都在 x=950 收尾，两缕对向汇合），剩下 30% 的时间留白（5s 一轮）。
//
// 光头位置 = dash 长 − dashoffset：四层各自代入自己的 --flow-len，
// 起点是「整条还在画布外」（多退 12px，避免圆头在 0 处留个点），终点是「头正好贴住轨迹末端」
// —— 这样四层的头始终叠在一起，亮的那头在前，暗尾在后面拖着。
// --flow-span 是浏览器量出来的轨迹实际弧长（见 script 里的 onMounted）。
@keyframes db-flow-run {
  0% {
    stroke-dashoffset: calc(var(--flow-len, 0px) + 12px);
  }
  70%,
  100% {
    stroke-dashoffset: calc(var(--flow-len, 0px) - var(--flow-span, 1030px));
  }
}
</style>
