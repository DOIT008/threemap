/// <reference types="vite/client" />

/*
 * .vue 单文件组件的兜底类型声明。
 *
 * 本仓库装了 typescript@6.x，而当前 vue-tsc 3.2.x 依赖的 TypeScript 语言服务
 * 内部接口在 TS 6 里有变动，导致 vue-tsc 没有接管 .vue 的模块解析，
 * main.ts / 测试里 import './App.vue' 会报 TS7016。
 *
 * 有这行声明后类型检查能过；等 vue-tsc 正式支持 TS 6 之后可以删掉，
 * 届时 .vue 内部脚本与模板会恢复逐文件检查。
 */
declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
