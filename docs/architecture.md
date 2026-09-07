# Meridian 架构与产品说明

本文同时覆盖：功能拆解、技术选型、架构设计。独立实现，不依赖其它脚手架源码。

## 1. 功能拆解

### 核心（0.1）

| 模块 | 能力 | 依赖 |
|------|------|------|
| 规则选型 | 描述 → 蓝图 + 开关 + 模块 + 置信度 | stack-map + stack-modules |
| 蓝图协议 | manifest + 模板目录 + 路径/重命名条件 | schema |
| 规划 | 可检查的文件清单（Plan） | 蓝图 |
| 渲染 | 无 eval 的模板插值 | Plan |
| 提交 | 冲突检测、dry-run、失败回滚 | Plan |
| 创建 CLI / Agent 脚本 | 同一 `createProject` | 引擎 |
| 生成后定制 | 按 feature 裁剪文档、占位符、`.env.example`；支持 dry-run | `.meridian/project.json` |
| 体检 doctor | 工作区、分层依赖方向、i18n/desktop 元数据 | 生成物 |
| 增量 add | 补文件且不覆盖已改文件；注入模块依赖；dry-run | 已有项目 |
| 特性模板 | i18n / 多主题 / Electron 壳 / Vue 与 React 分支 / 打包优化 | 蓝图 pathRules |
| UI 模块 | 描述推断 + `--modules` 写入 ui 依赖 | stack-modules.yaml |
| 远程 catalog | `--catalog` / `MERIDIAN_BLUEPRINT_CATALOG` | github / file / tarball |
| 交互式创建 | 《技术选型方案》+ blueprint prompts | CLI |
| Agent Skill | 两阶段确认、双引擎、功能闸门；setup-agent 可 vendor 引擎 | scripts |

### 明确不做

- 完整桌面安装包 / 自动更新 / 原生菜单产品壳
- 领域业务 stub（如 IM）
- 后端运行时、数据库、K8s

### 数据流

```
用户描述
  ├─ LLM（可选，叙述 + meridianAnswers）
  └─ resolveFromDescription（规则分 + 模块关键词）
        ↓ mergeAnswers（false 胜 / platform 优先级）
  GenerationPlan（文件列表，可 --dry-run / 落盘）
        ↓ interpolate + commit
  目标目录 + .meridian/project.json
        ↓ finishScaffold（仅有描述时）
        ↓ inspectProject
  询问写功能 → UI/需求闸门 → feature-bootstrap
```

## 2. 技术选型

| 领域 | 选型 | 许可证 | 理由 | 备选 |
|------|------|--------|------|------|
| 语言 | TypeScript ESM | Apache-2.0 | 与生成物一致 | — |
| 校验 | zod | MIT | 运行时 schema | valibot (MIT) |
| YAML | js-yaml | MIT | 选型表可读 | 纯 JSON |
| CLI | commander | MIT | 稳定、文档全 | yargs (MIT) |
| 交互 | @clack/prompts | MIT | 现代 TUI | inquirer (MIT) |
| 测试 | vitest | MIT | 快、TS 友好 | node:test |
| CLI 打包 | tsup | MIT | 单入口 ESM | tsdown |
| 包管理 | pnpm workspaces | MIT | 与生成物一致 | npm workspaces |
| 任务编排 | `pnpm -r` | MIT | **不使用** MPL 的 Turborepo | nx (MIT) |
| 模板 | 自研受限插值器 | MIT | 禁止模板内执行 JS | Handlebars (MIT) |
| 版本范围 | 自研 caret 匹配 | MIT | 避免 ISC semver | 手写 |

生成物常用依赖（React / Vue / Vite / TypeScript / Electron）均为 MIT 或兼容宽松许可。

## 3. 架构

单体 TypeScript monorepo，库与 CLI 分离，**不是**微服务。

```
meridian/
  packages/kit-schema      类型、错误码、zod
  packages/kit-engine      唯一生成内核
  packages/kit-blueprints  蓝图 + stack-map + stack-modules
  packages/kit-cli         meridian / create-meridian
  packages/create-kit      npm create @meridian/kit 垫片
  packages/kit-agent       SKILL.md + scripts
  tests/                   管线集成测试
  examples/golden/         ci snapshot 快照
```

横切：

- **错误**：`MeridianError` + 稳定错误码，CLI 打印 `✖ [CODE]`
- **鉴权**：本地工具，无用户体系；LLM Key 只走环境变量
- **日志**：`--json` / `--verbose` 级输出；写盘清单来自 Plan
- **配置**：项目级 `.meridian/project.json`；LLM 用 `MERIDIAN_*`；远程蓝图用 `MERIDIAN_BLUEPRINT_CATALOG`

相对常见脚手架的改进：

1. Plan 一等公民，可 dry-run 与审计
2. CLI 与 Agent 共享引擎，禁止两套生成逻辑
3. 模板不可执行，降低注入面
4. 生成物不用 Turbo，许可证更干净
5. 分层依赖由 doctor 检查，而不是只写在文档里
