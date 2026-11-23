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
    <PanelTitle :img="titleImg" :width="442" :enter-left="154" />

    <div class="pu__users">
      <div class="pu__user pu__user--left">
        <span class="pu__user-label">{{ data.users[0]?.label }}</span>
        <span class="pu__user-val"><CountValue :value="data.users[0]?.value ?? ''" /></span>
      </div>
      <img class="pu__avatar" :src="avatarRing" alt="" />
      <div class="pu__user pu__user--right">
        <span class="pu__user-label">{{ data.users[1]?.label }}</span>
        <span class="pu__user-val"><CountValue :value="data.users[1]?.value ?? ''" /></span>
      </div>
    </div>

    <img class="pu__divider" :src="dividerImg" alt="" />

    <div class="pu__daily">
      <div v-for="(d, i) in data.daily" :key="d.label" class="pu__daily-item">
        <span class="pu__daily-icon">
          <img v-for="(layer, j) in ICON_SETS[i] ?? ICON_SETS[0]!" :key="j" :src="layer" alt="" />
        </span>
        <span class="pu__daily-text">
          <span class="pu__daily-label">{{ d.label }}</span>
          <span class="pu__daily-val"><CountValue :value="d.value" /></span>
        </span>
      </div>
    </div>

    <div class="pu__keywords">
      <span class="pu__keywords-label">热门关键词</span>
      <button v-for="kw in data.keywords" :key="kw" class="pu__tag">{{ kw }}</button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.pu {
  position: relative;
  box-sizing: border-box;
  width: 442px;
  height: 266px;
  flex: none;
  background: linear-gradient(180deg, rgba(12, 32, 74, 0.42), rgba(6, 16, 42, 0.62));
  border: 1px solid rgba(46, 100, 190, 0.32);
  box-shadow: inset 0 0 26px rgba(20, 60, 140, 0.16);

  &__users {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    padding: 12px 24px 0;
  }

  &__user {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 158px;
    padding: 10px 14px;
    background: linear-gradient(180deg, rgba(16, 44, 96, 0.5), rgba(8, 24, 58, 0.6));
    border: 1px solid rgba(46, 100, 190, 0.35);
    border-radius: 4px;

    &--left {
      align-items: flex-end;
      text-align: right;
      margin-right: -14px;
    }

    &--right {
      align-items: flex-start;
      margin-left: -14px;
    }
  }

  &__user-label {
    font-size: 12px;
    color: rgba(198, 231, 255, 0.75);
  }

  &__user-val {
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: rgba(255, 255, 255, 1);
    text-shadow: 0 0 8px rgba(36, 160, 255, 0.5);
  }

  &__avatar {
    width: 78px;
    height: 78px;
    flex: none;
    z-index: 1;
    animation: pu-glow 3s ease-in-out infinite;
  }

  &__divider {
    display: block;
    width: 386px;
    height: 14px;
    margin: 8px auto 0;
  }

  &__daily {
    display: flex;
    justify-content: space-between;
    padding: 8px 28px 0;
  }

  &__daily-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__daily-icon {
    position: relative;
    width: 26px;
    height: 26px;
    flex: none;

    img {
      position: absolute;
      inset: 0;
      width: 26px;
      height: 26px;
    }
  }

  &__daily-text {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__daily-label {
    font-size: 12px;
    color: rgba(198, 231, 255, 0.75);
    white-space: nowrap;
  }

  &__daily-val {
    font-family: Roboto, "Segoe UI", Arial, sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: rgba(255, 255, 255, 1);
  }

  &__keywords {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 28px 0;
  }

  &__keywords-label {
    font-size: 14px;
    color: rgba(198, 231, 255, 0.85);
    margin-right: 4px;
  }

  &__tag {
    padding: 2px 10px;
    border: 1px solid rgba(0, 140, 255, 0.45);
    border-radius: 3px;
    background: rgba(10, 50, 110, 0.4);
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    color: rgba(198, 231, 255, 0.9);
    transition: all 0.2s ease;

    &:hover {
      color: #ffffff;
      border-color: rgba(0, 180, 255, 0.9);
      background: rgba(0, 110, 220, 0.45);
      box-shadow: 0 0 10px rgba(0, 140, 255, 0.5);
      transform: translateY(-1px);
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