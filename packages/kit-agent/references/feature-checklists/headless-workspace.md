# headless-workspace 功能落地清单

硬验收（全部勾上才算完成）：

- [ ] `packages/engine` 有可单测的领域 module
- [ ] `packages/ui` 只有展示组件 / AppShell / 已启用模块封装
- [ ] 页面在 `apps/web/src/pages/`，不在 ui 包
- [ ] 空态 / 加载 / 错误至少有一处可见处理
- [ ] README 写了「功能说明：已实现 / 未实现」
- [ ] 根目录 `pnpm build` 退出码 0
