import { LinearFilter, LinearMipmapLinearFilter, NoColorSpace, TextureLoader, type Texture } from 'three';

import darkMapUrl from '@/assets/mapTex/zz_dark_map.png';
import normalMapUrl from '@/assets/mapTex/zz_normal_map_aligned.png';

let darkMap: Texture | null = null;
let normalMap: Texture | null = null;

/**
 * 暗底路网贴图（郑州），全局只加载一次（所有区县共用同一张）。
 *
 * 贴图 RGBA 约定：
 *   RGB = 暗底 + 真实路网 + 边界泛光
 *   A   = 归一化的「距边界距离」(0 = 边界, 1 = 内部)，轮廓光带直接由它反推
 *
 * colorSpace = NoColorSpace：自定义 ShaderMaterial 输出不做 sRGB 编码，
 * 按原始数值读取才不会整体偏暗。
 */
export function getDarkMap(): Texture {
  if (!darkMap) {
    darkMap = new TextureLoader().load(darkMapUrl);
    darkMap.colorSpace = NoColorSpace;
    darkMap.anisotropy = 16;
    darkMap.generateMipmaps = true;
    darkMap.minFilter = LinearMipmapLinearFilter;
    darkMap.magFilter = LinearFilter;
    darkMap.needsUpdate = true;
  }
  return darkMap;
}

/**
 * 地形法线贴图，已横向压回到 geo 包围盒纵横比，与暗底贴图共用同一套 UV。
 * 法线是数据不是颜色，任何色彩管理都会毁掉它，所以同样是 NoColorSpace。
 */
export function getNormalMap(): Texture {
  if (!normalMap) {
    normalMap = new TextureLoader().load(normalMapUrl);
    normalMap.colorSpace = NoColorSpace;
    normalMap.anisotropy = 16;
    normalMap.generateMipmaps = true;
    normalMap.minFilter = LinearMipmapLinearFilter;
    normalMap.magFilter = LinearFilter;
    normalMap.needsUpdate = true;
  }
  return normalMap;
}
