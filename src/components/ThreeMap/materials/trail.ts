import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';

/**
 * 把一条折线做成「光带条带」几何，供 billboard 描线使用。
 *
 * 与飞线共用同一套思路：顶点只放中心线，宽度方向在顶点着色器里按
 * cross(切线, 视线) 推开，所以任何视角下看到的都是等宽光带。
 *
 * uv.x = 沿折线的弧长比例（0..1，闭合环直接首尾相连）
 * uv.y = 0 / 1（横跨光带）
 * aSide = -1 / +1，决定往哪一侧推开
 */
export function buildRibbonGeometry(points: Vector3[], _segments = 1): BufferGeometry {
  const count = points.length;
  const position: number[] = [];
  const tangent: number[] = [];
  const side: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];

  // 累积弧长，保证跑光速度沿轮廓均匀（点的密度并不均匀）
  const lengths: number[] = [0];
  for (let i = 1; i < count; i++) {
    lengths.push(lengths[i - 1]! + points[i]!.distanceTo(points[i - 1]!));
  }
  const total = Math.max(1e-6, lengths[count - 1]!);

  const tmp = new Vector3();
  for (let i = 0; i < count; i++) {
    const prev = points[(i - 1 + count) % count]!;
    const next = points[(i + 1) % count]!;
    tmp.subVectors(next, prev);
    if (tmp.lengthSq() < 1e-12) tmp.set(1, 0, 0);

    const u = lengths[i]! / total;
    const p = points[i]!;
    for (const s of [-1, 1]) {
      position.push(p.x, p.y, p.z);
      tangent.push(tmp.x, tmp.y, tmp.z);
      side.push(s);
      uv.push(u, s > 0 ? 1 : 0);
    }
  }

  for (let i = 0; i < count - 1; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    index.push(a, b, c, b, d, c);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3));
  geometry.setAttribute('aTangent', new Float32BufferAttribute(tangent, 3));
  geometry.setAttribute('aSide', new Float32BufferAttribute(side, 1));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);

  return geometry;
}
