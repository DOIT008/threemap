<script setup lang="ts">
import PanelTitle from "./PanelTitle.vue";
import CountValue from "./CountValue.vue";
import titleImg from "@/assets/codesign/panel-title-users.png";
import avatarRing from "@/assets/codesign/user-avatar-ring.png";
import dividerImg from "@/assets/codesign/divider-line-users.png";
import newBg from "@/assets/codesign/user-icon-new-bg.png";
import newInner from "@/assets/codesign/user-icon-new-inner.png";
import newGlyph from "@/assets/codesign/user-icon-new.png";
import activeBg from "@/assets/codesign/user-icon-active-bg.png";
import activeInner from "@/assets/codesign/user-icon-active-inner.png";
import activeGlyph from "@/assets/codesign/user-icon-active.png";
import visitBg from "@/assets/codesign/user-icon-visit-bg.png";
import visitInner from "@/assets/codesign/user-icon-visit-inner.png";
import visitGlyph from "@/assets/codesign/user-icon-visit.png";
import dashboard from "@/data/dashboard.json";

const data = dashboard.userStats;
const ICON_SETS = [
  [newBg, newInner, newGlyph],
  [activeBg, activeInner, activeGlyph],
  [visitBg, visitInner, visitGlyph],
];
</script>

<template>
  <section class="pu">
    <PanelTitle :img="titleImg" :width="442" :enter-left="146" :top="-12" />

    <div class="pu__card">
      <span class="pu__label is-left">{{ data.users[0]?.label }}</span>
      <span class="pu__val is-left"><CountValue :value="data.users[0]?.value ?? ''" /></span>
      <span class="pu__label is-right">{{ data.users[1]?.label }}</span>
      <span class="pu__val is-right"><CountValue :value="data.users[1]?.value ?? ''" /></span>
      <img class="pu__avatar" :src="avatarRing" alt="" />
    </div>

    <div class="pu__daily-list">
      <div v-for="(d, i) in data.daily" :key="d.label" class="pu__daily">
        <span class="pu__daily-icon">
          <img v-for="(layer, j) in ICON_SETS[i] ?? ICON_SETS[0]!" :key="j" :src="layer" alt="" />
        </span>
        <span class="pu__daily-text">
          <span class="pu__daily-label">{{ d.label }}</span>
          <span class="pu__daily-val"><CountValue :value="d.value" /></span>
        </span>
      </div>
    </div>

    <img class="pu__divider" :src="dividerImg" alt="" />

    <div class="pu__keywords">
      <span class="pu__keywords-label">热门关键词</span>
      <button v-for="kw in data.keywords" :key="kw" class="pu__tag">{{ kw }}</button>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use "./panel" as *;

.pu {
  @include db-panel(238px);

  // spec：矩形 2 —— (1486,371,371×71) → 相对 (30,35)
  &__card {
    position: absolute;
    left: 30px;
    top: 35px;
    width: 371px;
    height: 71px;
    border-radius: 2px;
    background: linear-gradient(0deg, rgba(16, 44, 96, 0.5) 0%, rgba(8, 24, 58, 0.2) 100%);
  }

  &__label {
    position: absolute;
    top: 13px;
    font-size: 12px;
    line-height: 18px;
    color: rgba(198, 231, 255, 0.75);
    white-space: nowrap;

    &.is-left {
      left: 20px;
    }

    &.is-right {
      left: 291px;
    }
  }

  // spec：数值 (1507,405,24 高) → 卡片内 (21,34)
  &__val {
    position: absolute;
    top: 34px;
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 20px;
    font-weight: 700;
    line-height: 24px;
    color: rgba(255, 255, 255, 1);
    white-space: nowrap;
    text-shadow: 0 0 8px rgba(36, 160, 255, 0.5);

    &.is-left {
      left: 21px;
    }

    &.is-right {
      right: 20px;
    }
  }

  // spec：头像环 78×78 at (1633,368) → 卡片内 (147,-3)
  &__avatar {
    position: absolute;
    left: 147px;
    top: -3px;
    width: 78px;
    height: 78px;
    animation: pu-glow 3s ease-in-out infinite;
  }

  // spec：图标 (1484,463,16×16)，文字 (1510,463) → 整行相对 (28,127)，三组步进 135
  &__daily-list {
    position: absolute;
    left: 25px;
    top: 127px;
    display: flex;
  }

  &__daily {
    flex: none;
    width: 135px;
    display: flex;
    align-items: flex-start;
    gap: 2px;
  }

  &__daily-icon {
    position: relative;
    width: 26px;
    height: 26px;
    flex: none;
    margin-top: -5px;
    margin-left: -2px;

    img {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 26px;
      height: 26px;

      &:first-child {
        width: 16px;
        height: 16px;
      }
    }
  }

  &__daily-text {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__daily-label {
    font-size: 12px;
    line-height: 14px;
    color: rgba(198, 231, 255, 0.75);
    white-space: nowrap;
  }

  &__daily-val {
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 18px;
    line-height: 22px;
    font-weight: 700;
    color: rgba(255, 255, 255, 1);
  }

  // spec：分隔光条 386×14 at (1480,546) → 相对 (24,203)
  &__divider {
    position: absolute;
    left: 23px;
    top: 210px;
    width: 386px;
    height: 14px;
  }

  // spec：热门关键词 (1480,523) → 相对 (24,187)
  &__keywords {
    position: absolute;
    left: 24px;
    top: 185px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__keywords-label {
    width: 70px;
    // spec：标签右端 1550 → 首个胶囊 1565，间距 15（行内 gap 为 6）
    margin-right: 9px;
    font-size: 14px;
    line-height: 21px;
    color: rgba(255, 255, 255, 0.8);
  }

  // spec：矩形 3–6 —— (1565,521) 66/55/77/66×26、圆角 17；填充 90deg 橙 0→20%，描边 1px 橙 0→100%
  &__tag {
    position: relative;
    height: 26px;
    padding: 0 15px;
    border: none;
    border-radius: 17px;
    background: linear-gradient(90deg, rgba(255, 110, 35, 0) 0%, rgba(255, 110, 35, 0.2) 100%);
    cursor: pointer;
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 12px;
    line-height: 26px;
    font-weight: 500;
    color: rgba(255, 255, 255, 1);
    white-space: nowrap;
    transition: all 0.2s ease;

    // 1px 渐变描边（270deg：右端橙 → 左端透明）
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1px;
      background: linear-gradient(90deg, rgba(255, 110, 35, 0) 0%, rgba(255, 110, 35, 1) 100%);
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      mask-composite: exclude;
      pointer-events: none;
    }

    &:hover {
      background: linear-gradient(90deg, rgba(255, 110, 35, 0.08) 0%, rgba(255, 110, 35, 0.38) 100%);
      box-shadow: 0 0 10px rgba(255, 110, 35, 0.35);
    }
  }
}

@keyframes pu-glow {
  0%,
  100% {
    filter: drop-shadow(0 0 4px rgba(0, 140, 255, 0.35));
  }
  50% {
    filter: drop-shadow(0 0 12px rgba(0, 180, 255, 0.7));
  }
}
</style>