# Meridian

用一段产品描述，生成可维护的前端工作区。

仓库：[github.com/125477/meridian](https://github.com/125477/meridian)

## 痛点

前端项目初始化，现有方案要么太轻，要么太失控：

- **脚手架太薄**：`create-vite` 给你一个空 `App.tsx`。engine / ui / apps 怎么分层、Storybook 怎么接、i18n 怎么挂，都要自己从零搭。
- **AI 写项目太野**：在 Cursor / Claude Code 里让 AI 起项目，它一个文件一个文件手写整棵目录树，质量看运气，跑飞了还得自己收拾。
- **没有闸门**：AI 从选型一口气写到功能落地，中间不确认、不对齐，写完才发现方向不对。
- **增量怕覆盖**：项目跑起来了想加 Storybook、多主题、虚拟列表，手动加容易盖掉已有代码。
- **选型靠拍脑袋**：UI 框架、状态、路由、测试、文档、i18n，每个决策都要自己调研，选错了后面很难改。

## Meridian 怎么做

一段描述，生成带分层的工程骨架。四套蓝图覆盖无头分层、React 单页、组件库、文档站。

核心是 Agent Skill。装进 Cursor / Claude Code / Windsurf 后，AI 不再手写目录树，而是调用同一套引擎，按步骤走，每步有闸门：

- **选型**：规则引擎 + 可选 LLM，先出《技术选型方案》，确认后再动手
- **创建**：可以先 dry-run 看文件清单，有冲突会拦住，失败会回滚
- **体检**：doctor 检查工作区结构和分层依赖方向
- **写功能前**：先问你要不要写；没有设计稿就先完善需求、出 2–3 套预览，对齐后再按 engine → ui → pages 落地，并且 `pnpm build` 要通过
- **增量**：Storybook / i18n / 多主题 / UI 模块可以后补，不覆盖你改过的文件

命令行和 Skill 用的是同一套引擎。

## 要求

- Node.js ≥ 20
- pnpm ≥ 9

## 快速开始

```bash
git clone https://github.com/125477/meridian.git
cd meridian
pnpm install
pnpm build
pnpm meridian create demo-app \
  --describe "企业级前端，无头分层工作区" \
  --platform pc-web \
  --yes
```

本地 CLI：

```bash
pnpm meridian --help
```

## 安装 Agent Skill

```bash
pnpm build
pnpm setup-agent
```

默认安装到 Cursor、Windsurf、Claude Code、Agents。只装 Cursor：

```bash
pnpm setup-agent --ide cursor
```

Skill 目录名为 `meridian`。脚本在 `packages/kit-agent/scripts/`，加载与 CLI 同一套 `@meridian/engine`。

## 命令

### 选型（不写盘）

```bash
pnpm meridian resolve --catalog
pnpm meridian resolve --describe "企业级无头分层前端工作区" --name demo --mapping
pnpm meridian resolve --describe "..." --llm --name demo
```

### 创建

```bash
pnpm meridian create demo-app \
  --describe "企业级前端，无头分层工作区" \
  --platform pc-web \
  --yes \
  --no-install
```

| 选项 | 含义 |
|------|------|
| `--blueprint <id>` | 指定蓝图，跳过描述推荐 |
| `--describe <text>` | 产品描述；有描述时自动做生成后定制 |
| `--platform pc-web\|h5\|pc-desktop` | 目标端 |
| `--ui react\|vue` | UI 框架 |
| `--with-storybook` / `--with-docs` / `--with-adapter` | 特性开关 |
| `--i18n` / `--themes` / `--optimize` / `--no-optimize` | 国际化 / 多主题 / 打包优化 |
| `--modules <list>` | UI 模块（markdown, rich-text, …） |
| `--catalog <url>` | 远程蓝图目录 |
| `--registry <url>` | 写入生成项目 `.npmrc` |
| `--dry-run` | 只打印文件清单 |
| `--force` | 允许写入非空目录 |
| `--no-finish` | 跳过生成后定制 |
| `--json` | 机器可读输出 |

### 其它

```bash
pnpm meridian doctor ./demo-app
pnpm meridian finish ./demo-app
pnpm meridian add storybook --path ./demo-app
pnpm meridian add --modules markdown --path ./demo-app
pnpm meridian blueprints
pnpm meridian ci verify --doctor-only
pnpm meridian ci snapshot --blueprint headless-workspace
pnpm meridian ci diff
```

不依赖全局命令时，可直接跑 Agent 脚本：

```bash
node packages/kit-agent/scripts/resolve.mjs --describe "企业级无头分层" --mapping --name demo
node packages/kit-agent/scripts/create.mjs demo --describe "..." --platform pc-web --yes
node packages/kit-agent/scripts/doctor.mjs ./demo
```

## 蓝图

| ID | 用途 |
|----|------|
| `headless-workspace` | 无头分层：engine / ui / apps/web |
| `react-app` | 轻量单页（React / Vue） |
| `ui-library` | 组件库 + 画廊（React / Vue） |
| `docs-portal` | 文档门户 |

`headless-workspace` 生成物分层：

- `packages/engine`：无头状态与用例
- `packages/ui`：展示组件与 AppShell
- `apps/web/src/pages`：接线与页面

## 包

| 包 | 职责 |
|----|------|
| `@meridian/kit` | CLI（`meridian` / `create-meridian`） |
| `@meridian/engine` | 选型、规划、渲染、写盘、体检 |
| `@meridian/schema` | 类型、校验、错误码 |
| `@meridian/blueprints` | 内置蓝图与选型目录 |
| `@meridian/agent` | Agent Skill 与脚本 |
| `@meridian/create-kit` | `npm create @meridian/kit` 垫片（尚未发布） |

## 环境变量

复制 `.env.example` 为 `.env` 后按需填写，不要提交密钥。

| 变量 | 说明 |
|------|------|
| `MERIDIAN_LLM_BASE_URL` | OpenAI 兼容接口根路径 |
| `MERIDIAN_LLM_API_KEY` | API Key（可回退 `OPENAI_API_KEY`） |
| `MERIDIAN_LLM_MODEL` | 模型 id |
| `MERIDIAN_LLM_TIMEOUT_MS` | 超时，默认 120000 |
| `MERIDIAN_HOME` | Agent 脚本定位引擎的仓库根 |
| `MERIDIAN_BLUEPRINT_CATALOG` | 远程蓝图目录 JSON URL |
| `MERIDIAN_CACHE_DIR` | 远程蓝图缓存目录，默认 `~/.cache/meridian` |

## 开发

```bash
pnpm build    # 按依赖顺序编译各包
pnpm test     # 单元测试 + 生成管线测试
```

设计说明见 [docs/architecture.md](./docs/architecture.md)。

## 许可证

[MIT](./LICENSE)
