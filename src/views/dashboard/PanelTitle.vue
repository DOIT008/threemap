<script setup lang="ts">
import iconEnter from "@/assets/codesign/icon-enter.png";
import titleIcon from "@/assets/codesign/panel-title-icon.png";

const props = withDefaults(
  defineProps<{
    /** 标题栏切图（多数已含 》》 图标与标题文字） */
    img: string;
    width: number;
    /** 「进入专题」距面板左端的 spec 坐标 */
    enterLeft: number;
    /** 办件量总览的标题切图不含 》》 图标，需单独拼 */
    withIcon?: boolean;
  }>(),
  { withIcon: false },
);

defineEmits<{ enter: [] }>();
</script>

<template>
  <div class="panel-title" :style="{ width: `${props.width}px` }">
    <img v-if="props.withIcon" class="panel-title__chevron" :src="titleIcon" alt="" />
    <img class="panel-title__bar" :src="props.img" alt="" />
    <button class="panel-title__enter" :style="{ left: `${props.enterLeft}px` }" @click="$emit('enter')">
      <span>进入专题</span>
      <img :src="iconEnter" alt="" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.panel-title {
  position: relative;
  height: 32px;
  flex: none;

  &__chevron {
    position: absolute;
    left: 6px;
    top: 7px;
    width: 18px;
    height: 18px;
  }

  &__bar {
    display: block;
    width: 100%;
    height: 32px;
  }

  &__enter {
    position: absolute;
    top: 8px;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 10px;
    line-height: 14px;
    color: rgba(198, 231, 255, 1);
    letter-spacing: 1px;
    transition: color 0.2s ease, text-shadow 0.2s ease;

    img {
      width: 14px;
      height: 14px;
      transition: transform 0.2s ease;
    }

    &:hover {
      color: #ffffff;
      text-shadow: 0 0 8px rgba(80, 180, 255, 0.9);

      img {
        transform: translateX(3px);
      }
    }
  }
}
</style>