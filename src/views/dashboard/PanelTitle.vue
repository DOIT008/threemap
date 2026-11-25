<script setup lang="ts">
import iconEnter from "@/assets/codesign/icon-enter.png";
import titleIcon from "@/assets/codesign/panel-title-icon.png";

const props = defineProps<{
  /** 标题栏切图（仅含标题文字与分隔线，不含 》》 图标） */
  img: string;
  /** 标题组宽度（spec：面板宽 + 10） */
  width: number;
  /** 「进入专题」相对标题组左端的 spec 坐标 */
  enterLeft: number;
  /** 标题组相对面板顶端的偏移（spec 每个面板不同，为负值） */
  top?: number;
}>();

defineEmits<{ enter: [] }>();
</script>

<template>
  <div class="panel-title" :style="{ width: `${props.width}px`, top: `${props.top ?? -12}px` }">
    <img class="panel-title__chevron" :src="titleIcon" alt="" />
    <img class="panel-title__bar" :src="props.img" alt="" />
    <button class="panel-title__enter" :style="{ left: `${props.enterLeft}px` }" @click="$emit('enter')">
      <span>进入专题</span>
      <img :src="iconEnter" alt="" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.panel-title {
  position: absolute;
  left: -10px;
  z-index: 3;
  height: 32px;

  // spec：标题图标（28,91,32×29），标题组 (28,92.89) → 组内 top -2
  &__chevron {
    position: absolute;
    left: 0;
    top: -2px;
    width: 32px;
    height: 29px;
    // 》》 持续向右往返：像在“催”视线进入面板，静止时容易和切图混成一片
    animation: db-chevron-flow 1.8s ease-in-out infinite;
  }

  // 切图宽度固定、高度按原始比例（442×32，趋势图 442×30）
  &__bar {
    display: block;
    width: 100%;
    height: auto;
  }

  // spec：矩形 9 —— 62×18、圆角 9、0.8px 渐变描边；文字 (1683,866) 箭头 (1727,870)
  &__enter {
    position: absolute;
    top: 7px;
    width: 62px;
    height: 18px;
    padding: 0;
    border: none;
    border-radius: 9px;
    background: none;
    cursor: pointer;
    transition: filter 0.2s ease;

    // 渐变描边（padding + mask 掏空）
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 0.8px;
      background: linear-gradient(90deg, rgba(83, 176, 255, 0.07) 10%, rgba(190, 225, 254, 0.46) 100%);
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      mask-composite: exclude;
      pointer-events: none;
    }

    span {
      position: absolute;
      left: 8px;
      top: 0;
      font-size: 10px;
      line-height: 18px;
      color: rgba(198, 231, 255, 1);
      white-space: nowrap;
      transition: color 0.2s ease, text-shadow 0.2s ease;
    }

    // spec：箭头 5.41×5.53，中心 (54.7,9)；切图 25×25
    img {
      position: absolute;
      left: 42px;
      top: -3.5px;
      width: 25px;
      height: 25px;
      transition: transform 0.2s ease;
    }

    &:hover {
      span {
        color: #ffffff;
        text-shadow: 0 0 8px rgba(80, 180, 255, 0.9);
      }

      img {
        // transform: translateX(3px);
      }
    }
  }
}

// 》》箭头左右往返：只动 3px，幅度大了会显得慌
@keyframes db-chevron-flow {
  0%,
  100% {
    transform: translateX(0);
    opacity: 0.82;
  }
  50% {
    transform: translateX(3px);
    opacity: 1;
  }
}
</style>