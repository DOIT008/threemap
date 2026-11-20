import { Color } from 'three';

/**
 * 自定义 ShaderMaterial 的片元输出不会做色彩空间转换，而 `new Color("#hex")`
 * 会被 three 的色彩管理转成线性空间，导致着色器里拿到的数值偏暗。
 * 这里再反转一次，让着色器输出的数值正好等于设计色值。
 */
export function displayColor(input: string | number): Color {
  return new Color(input).convertLinearToSRGB();
}
