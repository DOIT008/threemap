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
 */
export function useCountUp(source: () => string, duration = 1400): Ref<string> {
  const initial = source();
  const parsed = parse(initial);
  const display = ref(parsed ? format(0, parsed) : initial);
  let raf = 0;

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

  onMounted(() => animateTo(source()));
  watch(source, (v) => animateTo(v));
  onBeforeUnmount(() => cancelAnimationFrame(raf));
  return display;
}