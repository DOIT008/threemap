import { onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";

/** 解析结果：数值 + 小数位 + 后缀 + 是否千分位 */
interface Parsed {
  num: number;
  decimals: number;
  suffix: string;
  commas: boolean;
}

const NUM_RE = /^(-?[\d,]+(?:\.\d+)?)(%|万)?$/;

function parse(raw: string): Parsed | null {
  const m = NUM_RE.exec(raw.trim());
  if (!m) return null;
  const body = m[1] ?? "";
  const num = Number(body.replace(/,/g, ""));
  if (!Number.isFinite(num)) return null;
  const dot = body.indexOf(".");
  return {
    num,
    decimals: dot >= 0 ? body.length - dot - 1 : 0,
    suffix: m[2] ?? "",
    commas: body.includes(","),
  };
}

function format(n: number, p: Parsed): string {
  const fixed = n.toFixed(p.decimals);
  const out = p.commas ? Number(fixed).toLocaleString("en-US", {
    minimumFractionDigits: p.decimals,
    maximumFractionDigits: p.decimals,
  }) : fixed;
  return out + p.suffix;
}

/**
 * 数字滚动：把 "2,396,047" / "98.28%" / "4832.6万" 这类字符串
 * 从 0 缓动到目标值，保留原有千分位 / 小数位 / 后缀格式。
 * 非数值（如 "-"）原样返回。source 变化时重新滚动（用于 tab 切换）。
 *
 * ready 传入时（大屏入场信号），挂载后先按住不滚，
 * 等它置 true 再一起从 0 滚上来；不传则挂载即滚（单独调试面板时就是这个行为）。
 */
export function useCountUp(
  source: () => string,
  duration = 1400,
  ready?: Ref<boolean>,
): Ref<string> {
  const initial = source();
  const parsed = parse(initial);
  const display = ref(parsed ? format(0, parsed) : initial);
  let raf = 0;

  // 初始值已经算成 0 了，这时候不滚就是停在 0，不会先闪一下真实值
  const held = (): boolean => ready !== undefined && !ready.value;

  function animateTo(raw: string): void {
    cancelAnimationFrame(raf);
    const p = parse(raw);
    if (!p) {
      display.value = raw;
      return;
    }
    const start = performance.now();
    const step = (t: number): void => {
      const k = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      display.value = format(p.num * eased, p);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  onMounted(() => {
    if (!held()) animateTo(source());
  });
  watch(source, (v) => {
    if (!held()) animateTo(v);
  });
  // 入场信号亮起来：把藏着没滚的数字补滚一次
  if (ready !== undefined) {
    watch(ready, (ok) => {
      if (ok) animateTo(source());
    });
  }
  onBeforeUnmount(() => cancelAnimationFrame(raf));
  return display;
}