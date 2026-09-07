# 通用功能落点示例

以「工作台首页展示状态」为例（不要把它当成默认业务）：

1. `packages/engine/src/modules/workspace.ts`：定义快照与 `boot` / `fail`
2. `packages/ui/src/StatusPanel.tsx`：只接收 `title` / `message` props
3. `apps/web/src/pages/WorkspacePage.tsx`：`useSyncExternalStore` 或订阅 engine，把快照传给 StatusPanel

应用壳继续留在 `AppShell`，路由与页面组装留在 `apps/web`。
