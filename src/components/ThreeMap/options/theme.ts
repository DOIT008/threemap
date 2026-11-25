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

/** 非飞线 series 统一使用的区县数据文件；飞线数据仍由使用方填 start/end */
const DISTRICT_DATA_IMPORT = "@/data/410100-districts.json";
const DISTRICT_DATA_TOKEN = "__THREEMAP_DISTRICT_DATA__";

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
 * 主题里的相机方向可以写「方位角 + 俯仰角」，比 x/y/z 好读。
 * 这里把它换算成方向向量写回 x/y/z，并删掉角度字段：
 * 角度只是书写方式，留着会和面板改出来的 x/y/z 打架（两者同时存在时分不清谁生效）。
 * 只写其中一个角度时，另一个按现有的 x/y/z 反算，所以「只调俯仰角」也能用。
 */
function resolveCameraAngles(camera: ThreeMapOptions["camera"]): void {
  const { azimuth, elevation } = camera;
  if (azimuth === undefined && elevation === undefined) return;

  const az = azimuth ?? (Math.atan2(camera.x, camera.z) * 180) / Math.PI;
  const el = elevation ?? (Math.atan2(camera.y, Math.hypot(camera.x, camera.z)) * 180) / Math.PI;

  // 夹掉 90°，否则水平分量归零、方位角会失去意义
  const azRad = (az * Math.PI) / 180;
  const elRad = (Math.min(89.9, Math.max(0.1, el)) * Math.PI) / 180;
  const horizontal = Math.cos(elRad);

  // 长度无所谓，setCamera 会归一化后按地图宽重新算距离
  camera.x = Math.sin(azRad) * horizontal;
  camera.y = Math.sin(elRad);
  camera.z = Math.cos(azRad) * horizontal;
  delete camera.azimuth;
  delete camera.elevation;
}

/**
 * 把主题合并到一份完整默认配置上。
 * @param base 默认配置（createDefaultOptions() 的产物，调用方保证是全新对象）
 * @param theme 面板导出的主题，允许为 null
 */
export function mergeOptions(base: ThreeMapOptions, theme?: ThreeMapTheme | null): ThreeMapOptions {
  if (!theme) return base;
  const options = deepMerge(base, theme) as ThreeMapOptions;
  resolveCameraAngles(options.camera);
  return options;
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
 * 把方向向量换成面板同款的角度（方位角 / 俯仰角，单位度）。
 * 导出时保留一位小数：面板是整数调参，但向量回算会有零头，留着不丢精度。
 */
function toCameraAngles(camera: ThreeMapOptions["camera"]): NonNullable<ThreeMapTheme["camera"]> {
  const azimuth = ((Math.atan2(camera.x, camera.z) * 180) / Math.PI + 360) % 360;
  const elevation = (Math.atan2(camera.y, Math.hypot(camera.x, camera.z)) * 180) / Math.PI;
  const round = (value: number) => Math.round(value * 10) / 10;
  return { azimuth: round(azimuth), elevation: round(elevation) };
}

/**
 * 从完整 options 抽出可固化的主题。
 * 不含 data / series 的业务数据，也不含任何函数。
 */
export function extractTheme(options: ThreeMapOptions): ThreeMapTheme {
  // data 置空后会被 stripFunctions 丢掉，等价于「不导出业务数据」
  const theme = stripFunctions({ ...options, data: undefined }) as ThreeMapTheme;
  // 相机方向导出成人能读的角度（面板也是按角度调的），回填时由 resolveCameraAngles 换算回 x/y/z
  theme.camera = toCameraAngles(options.camera);
  // 系列样式留着；data 一律清掉，由 themeToTS() 按类型补回共享数据引用
  const series = options.series;
  if (series && series.length) {
    theme.series = stripFunctions(series).map((item) => ({ ...item, data: [] })) as SeriesOptions[];
  }
  return theme;
}

/**
 * 把主题转成一段可直接粘进项目的 TS 源码。
 * 非飞线 series 的 data 统一改为引用 districtData；飞线 data 保持清空，由使用方填 start/end。
 * @param theme 主题对象
 * @param varName 生成的常量名
 */
export function themeToTS(theme: ThreeMapTheme, varName = "mapTheme"): string {
  const usesDistrictData = theme.series?.some((item) => item.type !== "flight") ?? false;
  const serializable: any = {
    ...theme,
    series: theme.series?.map((item) => (item.type === "flight" ? item : { ...item, data: DISTRICT_DATA_TOKEN })),
  };
  const json = JSON.stringify(serializable, null, 2)
    // JSON 的 key 一定带引号，这里把合法的标识符解掉，贴进项目更像手写代码
    .replace(/^(\s*)"([A-Za-z_$][\w$]*)":/gm, "$1$2:")
    .replace(new RegExp(`"${DISTRICT_DATA_TOKEN}"`, "g"), "districtData");

  const districtImport = usesDistrictData
    ? `import districtData from "${DISTRICT_DATA_IMPORT}";

// 非飞线 series 共用区县数据；飞线数据自行填 start/end
`
    : "";

  return `import type { ThreeMapTheme } from "@/components/ThreeMap/options/theme";
${districtImport}
/**
 * 由控制面板导出的地图主题。
 * 用法：<ThreeMap :option="${varName}" :panel="false" />
 */
const ${varName}: ThreeMapTheme = ${json};

export default ${varName};
`;
}
