/*
 * @Editor: zhanghang
 * @Description: 创建飞行路径系列的默认配置选项
 * @Date: 2026-04-07 15:33:04
 * @LastEditors: zhanghang
 * @LastEditTime: 2026-04-08 10:51:09
 */
import type { FlightSeriesOptions } from "../types";

/**
 * 创建飞行路径动画的默认配置选项
 * @description 用于在地图上渲染两点之间的贝塞尔曲线飞行动画，使用粒子系统实现流动效果
 * 动画原理：
 *   1. 使用 QuadraticBezierCurve3 创建二次贝塞尔曲线路径
 *   2. 在路径上均匀分布 points 个粒子点
 *   3. 通过 Shader 的时间窗口控制粒子可见性，形成流动效果
 *   4. 使用双系统（主系统 + 半系统）实现无缝循环
 * @returns {FlightSeriesOptions} 飞行路径系列配置对象
 * @example
 * const flightOptions = createFlight();
 * flightOptions.data = [{ from: '110000', to: '310000' }];
 * map.addSeries(flightOptions);
 */
export default function (): FlightSeriesOptions {
  return {
    type: "flight", // 系列类型标识
    seriesName: "flight", // 系列名称
    points: 72, // 每条弧线的采样段数，与 demo 的 buildFlyLineGeometry 默认值一致
    flightLen: 50, // 飞行流光的长度（粒子数量），决定可见窗口大小
    speed: 10, // 飞行速度，每帧移动的索引步长
    flightColor: ["#5ea8f0", "#e6f6ff"], // 光带渐变色：[尾段颜色, 头部高光]
    headSize: 1, // 粒子头部放大系数，用于强调飞行方向
    data: [], // 数据数组，每项需包含 from, to 字段（可以是区域代码或坐标）
  };
}
