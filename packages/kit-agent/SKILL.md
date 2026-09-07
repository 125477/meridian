---
name: meridian
description: >-
  Meridian 全流程 Agent：规则引擎选型、LLM 全网选型、创建工作区、
  生成后定制、询问是否写功能（先对齐 UI/需求再编码）、增量特性。
  当用户说「Meridian 创建」「初始化脚手架」「帮我选型」「什么技术栈合适」
  「根据描述实现功能」「meridian add」时使用。
---

# Meridian

一个 Skill 覆盖 **选型 → 确认 → 创建 → 生成后定制 →（可选）功能落地 / 增量模块**。

本 Skill **自包含**：`scripts/` + vendor 引擎 + 蓝图 + `references/`。Agent **只调用本目录 scripts**，不要手写完整目录树。

## 硬规则

- 默认两阶段：先输出《技术选型方案》→ 用户确认 → 再 `scripts/create.mjs`
- 双引擎：LLM（`references/llm-stack-selection.md`）+ 规则引擎（`scripts/resolve.mjs --mapping`）
- 合并：docs / i18n / themes **false 胜**；platform 以用户 `--platform` 或规则表为准
- 禁止未确认就创建（用户明确「直接创建 / --yes」除外）
- i18n / 桌面端 / 独立文档站：仅当描述明确出现对应词时开启
- Vue：描述明确 Vue 时 `--ui vue`。无头工作区、单页、组件库均支持；UI 模块用 Vue 对应依赖（如 TipTap、VueUse）
- 有 `--describe` 的创建会自动 finish；无描述的手动蓝图创建不跑
- 创建 + doctor 后必须询问是否写功能；同意后先做 UI/需求闸门，再二次确认才编码
- 分层：`engine` 无头业务；`ui` 展示 + AppShell；`apps/web/src/pages` 接线。禁止在 ui 包写整页接 store

## 模式 A：创建

1. 读 `references/llm-stack-selection.md`，做全网选型叙述
2. `node scripts/resolve.mjs --catalog`
3. `node scripts/resolve.mjs --describe "<描述>" --mapping --name <项目名>`
4. 合并输出《技术选型方案》，**停止等待确认**
5. 确认后：

```bash
node scripts/create.mjs <项目名> --describe "<描述>" --platform pc-web --yes
node scripts/doctor.mjs <项目-path>
```

6. 询问是否根据描述写功能。拒绝则给 P0/P1/P2 清单。同意则先问有无 UI 图。
7. 无 UI：读 `references/product-requirements.md`（企业向再叠加 `enterprise.md`），确认后写入 `docs/requirements.md`；再读 `references/ui-preview.md` 出 2–3 套预览。有 UI：按图补全需求。对齐后再问是否写代码。
8. 确认写代码后读 `references/feature-bootstrap.md` 与 `references/feature-checklists/headless-workspace.md`，按 engine → ui → pages 落地，且 `pnpm build` 必须通过。

### 无 UI：先需求 → 再出图

禁止未确认需求就出 UI 图；禁止仅用文字色板让用户选风格。

- 需求：`references/product-requirements.md`
- 出图：`references/ui-preview.md`（`ui-ux-pro-max` 可选，不是硬依赖）
- 企业向（`headless-workspace` 或描述含企业/后台/B2B/工作台等）：再读 `references/enterprise.md`

## 模式 B：仅选型

只跑 resolve，禁止 create。

## 模式 C：生成后定制

需要 `.meridian/project.json`：

```bash
node scripts/finish.mjs <project-path>
node scripts/doctor.mjs <project-path>
```

## 模式 D：已有项目功能落地

UI/需求闸门同模式 A，再按 `feature-bootstrap.md` 实现。仅当用户明确说「按现有描述直接写、跳过 UI」时才可跳过闸门。

## 模式 E：增量

```bash
node scripts/add.mjs storybook --path <project-path>
node scripts/add.mjs i18n --path <project-path>
node scripts/add.mjs --modules markdown,virtual-list --path <project-path>
node scripts/add.mjs desktop --path <project-path>
```

特性：`storybook | docs | adapter | i18n | themes | optimize | desktop`
