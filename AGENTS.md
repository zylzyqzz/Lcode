# Lcode — agent 工作说明

这是 Lcode 仓库的常驻指令，每次会话都会进系统提示。保持简短、稳定。

## 这是什么

pi coding-agent 的 **无护栏 fork**。为了 DIY 才存在，不要当成可上线产品。

## 结构

- `packages/coding-agent` — 主体（CLI / TUI / 工具 / 扩展 / 会话）
- `packages/agent` — agent loop 内核
- `packages/ai` — provider 抽象与模型目录
- `packages/{tui,chord,codemode,mcp,schema,durable,env,telemetry}` — 支撑模块
- 构建顺序在根 `package.json` 的 `build` 脚本里，改动依赖时要同步更新它

## 已拆除的护栏（改动前先确认是不是要加回来）

- `core/trust-manager.ts` → `ProjectTrustStore.get()` 恒返回 `true`
- `core/project-trust.ts` → `resolveProjectTrusted()` 直接返回 `trustOverride ?? true`
- `core/settings-defaults.ts` → `defaultProjectTrust: "always"`

如果哪天要重新加安全层，改这三处即可复位到上游行为。

## 约定

- 上游包名仍叫 `@earendil-works/pi-*`，配置目录仍是 `.pi`。**故意不改**，方便跟上游 diff；要改名是一次独立重构。
- 每个 package 用 `npm run build` 单独可编译，顺序见根脚本。
- 提交前：`npm run build` 必须过；涉及工具/权限的改动跑 `npm test --workspace @earendil-works/pi-coding-agent`。
- 别把 `apps/`、`packages/evals` 搬回来，除非明确要用。

## 红线

- 不做公网入口（HTTP serve / IM bot）除非先补上信任、审批与沙箱。
- 不删 `LICENSE` / `NOTICE`：上游是 MIT，署名是法律要求。
