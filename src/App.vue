<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
/** 大屏路由独占视口，隐藏站点导航 */
const fullscreen = computed(() => route.meta.fullscreen === true);

const navItems = [
  { name: "概览", path: "/overview" },
  { name: "监测", path: "/monitor" },
  { name: "分析", path: "/analysis" },
  { name: "驾驶舱", path: "/dashboard" },
  { name: "调参台", path: "/dev" },
];
</script>

<template>
  <div class="app-shell">
    <header v-if="!fullscreen" class="app-nav">
      <span class="app-brand">ThreeMap</span>
      <nav class="app-nav-links">
        <RouterLink v-for="item in navItems" :key="item.path" :to="item.path" class="app-nav-link">
          {{ item.name }}
        </RouterLink>
      </nav>
      <span class="app-nav-hint">三个业务页各自一套主题，调参台带控制面板</span>
    </header>

    <main class="app-body">
      <!-- 故意不套 keep-alive：地图实例要随路由卸载并释放 WebGL 上下文 -->
      <RouterView />
    </main>
  </div>
</template>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a0e27;
  font-family: "Microsoft Yahei", system-ui, sans-serif;
}

.app-shell {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.app-nav {
  flex: 0 0 auto;
  height: 52px;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 18px;
  box-sizing: border-box;
  background: linear-gradient(180deg, rgba(9, 26, 52, 0.96), rgba(7, 20, 40, 0.9));
  border-bottom: 1px solid rgba(80, 170, 255, 0.22);
  color: #cfe7ff;
}

.app-brand {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #8fd8ff;
}

.app-nav-links {
  display: flex;
  gap: 6px;
}

.app-nav-link {
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 13px;
  color: #9fc3e8;
  text-decoration: none;
  border: 1px solid transparent;
  transition: all 0.18s ease;
}

.app-nav-link:hover {
  color: #d7f0ff;
  background: rgba(70, 160, 255, 0.12);
}

.app-nav-link.router-link-active {
  color: #04182c;
  background: linear-gradient(180deg, #7fe3ff, #35b6f0);
  border-color: rgba(160, 230, 255, 0.8);
  font-weight: 600;
}

.app-nav-hint {
  margin-left: auto;
  font-size: 12px;
  color: rgba(150, 190, 230, 0.6);
}

.app-body {
  flex: 1 1 auto;
  min-height: 0;
  position: relative;
}
</style>
