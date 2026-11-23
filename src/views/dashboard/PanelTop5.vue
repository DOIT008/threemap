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

const grown = ref(false);
onMounted(() => {
  requestAnimationFrame(() => {
    grown.value = true;
  });
});

function pct(value: number): number {
  return Math.max((value / data.max) * 100, 2);
}
</script>

<template>
  <section class="p5">
    <PanelTitle :img="titleImg" :width="442" :enter-left="188" />

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
            :style="{ width: grown ? `${pct(item.value)}%` : '0%', transitionDelay: `${i * 0.12}s` }"
          />
          <img
            class="p5__dot"
            :src="DOTS[i] ?? DOTS[0]!"
            alt=""
            :style="{ left: grown ? `calc(${pct(item.value)}% - 9px)` : '-9px', transitionDelay: `${i * 0.12}s` }"
          />
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
.p5 {
  position: relative;
  width: 442px;
  height: 232px;
  flex: none;
  background: linear-gradient(180deg, rgba(12, 32, 74, 0.42), rgba(6, 16, 42, 0.62));
  border: 1px solid rgba(46, 100, 190, 0.32);
  box-shadow: inset 0 0 26px rgba(20, 60, 140, 0.16);

  &__list {
    margin: 0;
    padding: 8px 27px 0;
    list-style: none;
  }

  &__row {
    position: relative;
    height: 37px;
    padding: 0 4px;
    border-radius: 3px;
    transition: background 0.2s ease;

    &:hover {
      background: rgba(0, 140, 255, 0.08);

      .p5__name {
        color: rgba(230, 247, 255, 1);
      }
    }
  }

  &__head {
    display: flex;
    align-items: center;
    height: 20px;
  }

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
      font-weight: 700;
      color: #ffffff;
    }
  }

  &__name {
    margin-left: 12px;
    font-size: 12px;
    color: rgba(198, 231, 255, 0.85);
    transition: color 0.2s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__val {
    margin-left: auto;
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: rgba(255, 255, 255, 1);
  }

  &__unit {
    margin-left: 5px;
    font-size: 12px;
    color: rgba(108, 128, 151, 1);
  }

  &__bar {
    position: relative;
    height: 6px;
    margin-top: 4px;
    border-radius: 3px;
    background: rgba(20, 45, 95, 0.6);
  }

  &__fill {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, #0057c0, #008cff 60%, #31d8d8);
    transition: width 1s cubic-bezier(0.22, 0.8, 0.3, 1);
  }

  &__row.is-first &__fill {
    background: linear-gradient(90deg, #c04a2a, #f78160 70%, #ffb199);
  }

  &__dot {
    position: absolute;
    top: -6px;
    width: 19px;
    height: 19px;
    transition: left 1s cubic-bezier(0.22, 0.8, 0.3, 1);
    filter: drop-shadow(0 0 4px rgba(0, 140, 255, 0.6));
  }
}
</style>