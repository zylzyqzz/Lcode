# Lcode — agent 工作说明

这是 Lcode 仓库的常驻指令，每次会话都会进系统提示。保持简短、稳定。

## 这是什么

pi coding-agent 的 **无护栏 fork**。为了 DIY 才存在，不要当成可上线产品。

## 结构

- `packages/coding-agent` — 主体（CLI / TUI / 工具 / 扩展 / 会话）
- `packages/agent` — agent loop 内核
- `packages/ai` — provider 抽象与模型目录
- `packages/{tui,chord,codemode,mcp,schema,durable,env,telemetry}` — 支撑模块
- `apps/{p2,p3,p2-mac}` → 上游 GUI / 服务端（原样导入，未去护栏，改动前想清楚）
- 构建顺序在根 `package.json` 的 `build` 脚本里，改动依赖时要同步更新它

## 已拆除的护栏（改动前先确认是不是要加回来）

第一层 — 信任判定本身：

- `core/project-trust.ts` → `resolveProjectTrusted()` 直接返回 `trustOverride ?? true`
- `core/trust-manager.ts` → `ProjectTrustStore.get()` 恒返回 `true`
- `core/settings-defaults.ts` → `defaultProjectTrust: "always"`

第二层 — 残余读写在信任为 false 时仍然拦人的地方（已一并拆掉）：

- `core/settings-manager.ts` → `loadFromStorage()` 不再跳过 project 作用域；`isProjectTrusted()` 恒返回 `true`；`assertProjectTrustedForWrite()` 空实现
- `core/package-manager.ts` → `assertProjectTrustedForScope()` 空实现（install/remove/resolve 不再拒绝 project 作用域）
- `extensions/mcp/config.ts` → project `mcp.json` 不再拒绝 `auth` 字段
- `core/mcp-servers.ts` → `checkAuth()` 不再要求 https/loopback，provider token 可发往任意 scheme 与 host
- `main.ts` / `package-manager-cli.ts` → 启动时的 `SettingsManager` 不再以 `projectTrusted: false` 创建

要复位到上游行为，上面两层的每一处都必须改回去；只改第一层会留下「信任恒真、但写 project 设置仍然抛错」的死代码。

## 约定

- 上游包名仍叫 `@earendil-works/pi-*`，配置目录仍是 `.pi`。**故意不改**，方便跟上游 diff；要改名是一次独立重构。
- 每个 package 用 `npm run build` 单独可编译，顺序见根脚本。
- 提交前：`npm run build` 必须过；涉及工具/权限的改动跑 `npm test --workspace @earendil-works/pi-coding-agent`。
- 别把 `apps/`、`packages/evals` 搬回来，除非明确要用。

## 红线

- 不做公网入口（HTTP serve / IM bot）除非先补上信任、审批与沙箱。
- 不删 `LICENSE` / `NOTICE`：上游是 MIT，署名是法律要求。
