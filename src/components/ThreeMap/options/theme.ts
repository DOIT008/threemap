/*
 * @Description: 主题（视觉配置）的提取、合并与序列化
 *
 * 用途：控制面板只是「调参工具」，调好的结果不该跟着带上线。
 * 这里把「渲染配置」和「业务数据」拆开：
 *   - ThreeMapTheme：只含视觉配置（含 series 的样式，不含 data）
 *   - extractTheme()：从面板里的完整 options 抽出主题，顺手丢掉函数与业务数据
 *   - mergeOptions()：把主题深合并进默认配置，得到 ThreeMap 可以直接吃的完整 options
 *   - themeToTS()：把主题转成一段可直接粘进项目的 TS 代码
 */
import type { ThreeMapOptions, SeriesOptions } from "../types";

/** 除业务数据（data / series）外的全部渲染配置，允许只写一部分 */
export type ThreeMapTheme = DeepPartial<Omit<ThreeMapOptions, "data" | "series">> & {
  /** 系列样式。业务数据（每条 series 里的 data）不会被导出，由使用方自己填 */
  series?: SeriesOptions[];
};

/**
 * 递归可选。
 * 函数原样保留，数组整体替换（不按索引深合并），避免 merge 出半截数组。
 */
export type DeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends Array<infer U>
    ? U[]
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

/** 只认字面量对象，排除数组 / Date / 函数 / null */
function isPlainObject(value: unknown): value is Record<string, any> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

/**
 * 深合并：patch 覆盖 base，返回全新对象，不污染入参。
 * - 纯对象 → 逐键递归
 * - 数组 / 函数 / 原始值 → 整体替换
 * - patch 里没有的键 → 沿用 base
 */
function deepMerge(base: any, patch: any): any {
  if (patch === undefined) return base;
  if (Array.isArray(patch)) return patch.slice();
  if (!isPlainObject(patch)) return patch;

  const out: Record<string, any> = isPlainObject(base) ? { ...base } : {};
  Object.keys(patch).forEach((key) => {
    out[key] = deepMerge(out[key], patch[key]);
  });
  return out;
}

/**
 * 把主题合并到一份完整默认配置上。
 * @param base 默认配置（createDefaultOptions() 的产物，调用方保证是全新对象）
 * @param theme 面板导出的主题，允许为 null
 */
export function mergeOptions(base: ThreeMapOptions, theme?: ThreeMapTheme | null): ThreeMapOptions {
  if (!theme) return base;
  return deepMerge(base, theme) as ThreeMapOptions;
}

/** 递归剔除函数值（formatter 之类没法序列化，导出也没意义） */
function stripFunctions<T>(value: T): T {
  if (typeof value === "function") return undefined as unknown as T;
  if (Array.isArray(value)) return value.map((item) => stripFunctions(item)) as unknown as T;
  if (!isPlainObject(value)) return value;

  const out: Record<string, any> = {};
  Object.keys(value).forEach((key) => {
    const next = stripFunctions((value as Record<string, any>)[key]);
    if (next !== undefined) out[key] = next;
  });
  return out as T;
}

/**
 * 从完整 options 抽出可固化的主题。
 * 不含 data / series 的业务数据，也不含任何函数。
 */
export function extractTheme(options: ThreeMapOptions): ThreeMapTheme {
  // data 置空后会被 stripFunctions 丢掉，等价于「不导出业务数据」
  const theme = stripFunctions({ ...options, data: undefined }) as ThreeMapTheme;
  // 系列本身留着（样式有用），但把每条 series 的 data 清空
  const series = options.series;
  if (series && series.length) {
    theme.series = stripFunctions(series).map((item) => ({ ...item, data: [] })) as SeriesOptions[];
  }
  return theme;
}

/**
 * 把主题转成一段可直接粘进项目的 TS 源码。
 * @param theme 主题对象
 * @param varName 生成的常量名
 */
export function themeToTS(theme: ThreeMapTheme, varName = "mapTheme"): string {
  const json = JSON.stringify(theme, null, 2)
    // JSON 的 key 一定带引号，这里把合法的标识符解掉，贴进项目更像手写代码
    .replace(/^(\s*)"([A-Za-z_$][\w$]*)":/gm, "$1$2:");

  return `import type { ThreeMapTheme } from "@/components/ThreeMap/options/theme";

/**
 * 由控制面板导出的地图主题。
 * 用法：<ThreeMap :option="${varName}" :panel="false" />
 */
const ${varName}: ThreeMapTheme = ${json};

export default ${varName};
`;
}
