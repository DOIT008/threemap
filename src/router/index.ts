import { createRouter, createWebHistory } from "vue-router";

/**
 * 示例路由：业务页各用一套主题，最后一页是调参台。
 * 页面全部走懒加载 —— 首屏只下载当前页，面板那套代码只会在 /dev 用到。
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/overview" },
    {
      path: "/overview",
      name: "overview",
      component: () => import("@/views/OverviewView.vue"),
      meta: { title: "概览" },
    },
    {
      path: "/test",
      name: "test",
      component: () => import("@/views/TestView.vue"),
      meta: { title: "测试" },
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("@/views/DashboardView.vue"),
      meta: { title: "领导驾驶舱", fullscreen: true },
    },
    {
      path: "/monitor",
      name: "monitor",
      component: () => import("@/views/MonitorView.vue"),
      meta: { title: "监测" },
    },
    {
      path: "/analysis",
      name: "analysis",
      component: () => import("@/views/AnalysisView.vue"),
      meta: { title: "分析" },
    },
    {
      path: "/dev",
      name: "dev",
      component: () => import("@/views/DevView.vue"),
      meta: { title: "调参台" },
    },
    // 未知路径兜底回概览
    { path: "/:pathMatch(.*)*", redirect: "/overview" },
  ],
});

export default router;
