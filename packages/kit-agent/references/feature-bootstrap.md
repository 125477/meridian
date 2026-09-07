# 功能落地

仅在用户确认「写代码」之后执行。脚手架已经具备分层，不要推倒重来。

## 落点

| 层 | 路径 | 做什么 |
|----|------|--------|
| 无头业务 | `packages/engine/src/modules/` | 状态、用例、纯函数 |
| 展示 | `packages/ui/src/` | 无业务 store 的组件与 AppShell |
| 接线 | `apps/web/src/pages/` | 订阅 engine，拼接 ui |

已启用的 `enabledStackModules` 必须优先在 `packages/ui` 封装后由页面使用。

## 顺序

1. 完成 UI/需求闸门（`product-requirements.md` → 确认 → `ui-preview.md`；企业向叠加 `enterprise.md`）并获用户确认「现在写代码」
2. 输出《功能拆解》（场景 / 实体 / 页面落在 apps/web / Mock）
3. 在 engine 写可单测模块
4. 在 ui 增加展示组件（props 输入，不接全局 store）
5. 在 pages 接线，补空态 / 加载 / 错误
6. 更新 README「功能说明」：已实现 / 未实现
7. `pnpm build` 必须通过

## 询问话术

### 是否写功能

```markdown
✔ 项目已创建：`<project-path>`

是否根据描述继续写一版较完善的功能代码？

- 回复「要 / 实现 / 写功能」：先进入 UI / 需求对齐，再决定写代码
- 回复「不要 / 以后再说」：仅保留脚手架，并给出后续功能清单
```

### UI / 需求闸门

```markdown
写代码前需要先对齐界面与需求。

是否已有 UI 图（Figma / 设计稿 / 截图 / 线框图）？

- 回复「有」：请提供链接、导出图或文件
- 回复「没有」：先按 `product-requirements.md` 完善需求（企业向叠加 `enterprise.md`）→ 再按 `ui-preview.md` 出 2–3 套预览图供你选
```

### 二次确认写代码

```markdown
界面与需求已对齐（见上文）。

现在开始按该说明写功能代码吗？

- 回复「写 / 开始 / 实现」：按对齐后的需求与选定 UI 落地 MVP
- 回复「先改需求 / 再改 UI」：继续改，改完再问
- 回复「先不写」：输出后续功能清单后结束
```

## 禁止

- 在 `packages/ui` 写整页并直接订阅 engine
- 把 HTTP 细节写进 UI 组件
- 引入 GPL 依赖
- 未通过 `pnpm build` 就宣告完成
