/**
 * 大屏舞台与各内联模块的布局常量（均基于 1920×1080 设计稿 spec 坐标）。
 * 集中管理，避免在容器与各子组件里重复硬编码。
 */

/** 设计稿舞台尺寸 */
export const STAGE = { width: 1920, height: 1080 } as const;

/** KPI 条：图标左边缘 spec 坐标 54/280/479/667 → 每项块宽（最后一项占满剩余） */
export const KPI_ITEM_WIDTHS = [226, 199, 188, 238];

/** 地图标记：距地图区左上角的 spec 偏移（X 居中锚定、名称牌上移） */
export const MAP_MARKER_OFFSET_X = 470;
export const MAP_MARKER_OFFSET_Y = 317 + 46;
