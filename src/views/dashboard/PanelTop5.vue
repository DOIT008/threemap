<script setup lang="ts">
import { onMounted, ref } from "vue";
import PanelTitle from "./PanelTitle.vue";
import titleImg from "@/assets/codesign/panel-title-top5.png";
import rankBg1 from "@/assets/codesign/top5-rank-bg.png";
import rankBg2 from "@/assets/codesign/top5-rank-bg-2.png";
import rankBg3 from "@/assets/codesign/top5-rank-bg-3.png";
import rankBg4 from "@/assets/codesign/top5-rank-bg-4.png";
import rankBg5 from "@/assets/codesign/top5-rank-bg-5.png";
import rankBd1 from "@/assets/codesign/top5-rank-border.png";
import rankBd2 from "@/assets/codesign/top5-rank-border-2.png";
import rankBd3 from "@/assets/codesign/top5-rank-border-3.png";
import rankBd4 from "@/assets/codesign/top5-rank-border-4.png";
import rankBd5 from "@/assets/codesign/top5-rank-border-5.png";
import dot1 from "@/assets/codesign/top5-progress-dot.png";
import dot2 from "@/assets/codesign/top5-progress-dot-2.png";
import dot3 from "@/assets/codesign/top5-progress-dot-3.png";
import dot4 from "@/assets/codesign/top5-progress-dot-4.png";
import dot5 from "@/assets/codesign/top5-progress-dot-5.png";
import dashboard from "@/data/dashboard.json";

const data = dashboard.top5;
const RANK_BGS = [rankBg1, rankBg2, rankBg3, rankBg4, rankBg5];
const RANK_BDS = [rankBd1, rankBd2, rankBd3, rankBd4, rankBd5];
const DOTS = [dot1, dot2, dot3, dot4, dot5];

/** spec：条形填充宽 308 / 233.5 / 187 / 141.5 / 114.5（条总宽 382） */
const PROGRESS = [80.6, 61.1, 49, 37, 30];

const grown = ref(false);
onMounted(() => {
  requestAnimationFrame(() => {
    grown.value = true;
  });
});
</script>

<template>
  <section class="p5">
    <PanelTitle :img="titleImg" :width="442" :enter-left="180" :top="-11" />

    <ul class="p5__list">
      <li
        v-for="(item, i) in data.list"
        :key="item.rank"
        class="p5__row"
        :class="{ 'is-first': i === 0 }"
      >
        <div class="p5__head">
          <span class="p5__rank">
            <img :src="RANK_BGS[i] ?? RANK_BGS[0]!" alt="" />
            <img class="p5__rank-bd" :src="RANK_BDS[i] ?? RANK_BDS[0]!" alt="" />
            <b>{{ item.rank }}</b>
          </span>
          <span class="p5__name">{{ item.name }}</span>
          <span class="p5__val">{{ item.value.toLocaleString() }}</span>
          <span class="p5__unit">{{ item.unit }}</span>
        </div>
        <div class="p5__bar">
          <div
            class="p5__fill"
            :style="{
              width: grown ? `${PROGRESS[i]}%` : '0%',
              transitionDelay: `${i * 0.12}s`,
            }"
          />
          <img
            class="p5__dot"
            :src="DOTS[i] ?? DOTS[0]!"
            alt=""
            :style="{
              left: grown ? `calc(${PROGRESS[i]}% - 9.5px)` : '-9.5px',
              transitionDelay: `${i * 0.12}s`,
            }"
          />
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
@use "./panel" as *;

.p5 {
  @include db-panel(210px);

  // spec：列表 x=61(相对 23) y=875(相对 37)，宽 382，行距 32
  &__list {
    position: absolute;
    left: 23px;
    top: 37px;
    width: 382px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__row {
    position: relative;
    height: 32px;

    &:hover .p5__name {
      color: rgba(230, 247, 255, 1);
    }
  }

  &__head {
    display: flex;
    align-items: flex-start;
    height: 17px;
  }

  // spec：序号 14×14
  &__rank {
    position: relative;
    width: 14px;
    height: 14px;
    flex: none;

    img {
      position: absolute;
      inset: 0;
      width: 14px;
      height: 14px;
    }

    b {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-family: Roboto, "Segoe UI", Arial, sans-serif;
      font-size: 10px;
      line-height: 10.5px;
      font-weight: 700;
      color: #ffffff;
    }
  }

  // spec：名称 (81,875,14px 高 14)，距序号 6
  &__name {
    margin-left: 6px;
    font-size: 12px;
    line-height: 14px;
    color: rgba(198, 231, 255, 0.85);
    transition: color 0.2s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // spec：数值右端 427(相对 389)
  &__val {
    margin-left: auto;
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 14px;
    line-height: 17px;
    font-weight: 700;
    color: rgba(255, 255, 255, 1);
  }

  // spec：单位 (431,877)
  &__unit {
    margin-left: 4px;
    margin-top: 2px;
    font-size: 12px;
    line-height: 12px;
    color: rgba(108, 128, 151, 1);
  }

  // spec：进度条 382×3，y=+22
  &__bar {
    position: absolute;
    left: 0;
    right: 0;
    top: 22px;
    height: 3px;
    background: rgba(20, 45, 95, 0.6);
  }

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, #0057c0, #008cff 60%, #31d8d8);
    transition: width 1s cubic-bezier(0.22, 0.8, 0.3, 1);
  }

  &__row.is-first &__fill {
    background: linear-gradient(90deg, #c04a2a, #f78160 70%, #ffb199);
  }

  // spec：端点 5×5，切图 19×19 含光晕
  &__dot {
    position: absolute;
    top: -8px;
    width: 19px;
    height: 19px;
    transition: left 1s cubic-bezier(0.22, 0.8, 0.3, 1);
  }
}
</style>