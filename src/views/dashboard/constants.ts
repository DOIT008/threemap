/**
 * 大屏舞台与各内联模块的布局常量（均基于 1920×1080 设计稿 spec 坐标）。
 * 集中管理，避免在容器与各子组件里重复硬编码。
 */

import type { InjectionKey, Ref } from "vue";

/** 设计稿舞台尺寸 */
export const STAGE = { width: 1920, height: 1080 } as const;

/** KPI 条：图标左边缘 spec 坐标 54/280/479/667 → 每项块宽（最后一项占满剩余） */
export const KPI_ITEM_WIDTHS = [226, 199, 188, 238];

/** 地图标记：距地图区左上角的 spec 偏移（X 居中锚定、名称牌上移） */
export const MAP_MARKER_OFFSET_X = 470;
export const MAP_MARKER_OFFSET_Y = 317 + 46;

/**
 * 入场信号：地图完全出场（panelsIn）后置 true。
 * 面板里的 CountValue 注入它，等这一批真正入场时才从 0 滚到目标值；
 * 没被 provide 到的场景（单独调试某个面板）注入不到，照旧挂载即滚。
 */
export const DB_REVEAL: InjectionKey<Ref<boolean>> = Symbol("db-reveal");
