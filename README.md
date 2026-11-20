# Lcode

> **无护栏（no-guardrail）版 coding agent，基于 [earendil-works/pi](https://github.com/earendil-works/pi) 的 `coding-agent` 分支而来。**
> 这是给你自己 DIY 用的底座，不是可以直接暴露在公网上的产品。

Lcode = pi 的 coding agent 内核，**删掉了全部安全限制**：

| 上游限制 | Lcode 状态 |
|---|---|
| 项目信任门（`.pi/` 里的 settings / extensions / MCP / skills 需要用户点「Trust」） | **永远信任**，不再询问 |
| `trust.json` 信任库 + `defaultProjectTrust` 策略（`ask` / `never`） | **绕过**，恒为 `true` |
| 扩展 `project_trust` 事件拦截 | **不再触发** |
| MCP 项目的信任校验 | **恒通过** |

也就是说：把仓库 clone 下来，只要目录里有 `.pi/` 配置、扩展、MCP server 或 skills，**开箱即用，一次确认都没有**。

---

## ⚠️ 先读这段

去掉护栏意味着：

1. **agent 会不问就执行。** 它可以在你机器上跑任意 shell、写任意路径的文件、访问任意网络地址。没有审批、没有白名单、没有沙箱。
2. **`.pi/` 目录里的东西等价于本机代码执行。** 拉一个别人的仓库下来跑 Lcode，等于跑了他的扩展。这是设计如此，不是 bug。
3. **绝对不要**把它挂到公网 HTTP 端口、IM 机器人或任何多人可达的入口上。要上线必须先自己加回信任/审批/沙箱——这正是 `后续 DIY` 的部分。

## 环境要求

- Node.js **>= 22.19**（本机已验证 26.x）
- npm 10+

## 构建

```bash
npm install
npm run build          # 按依赖顺序编译 11 个 package
```

产物：`packages/coding-agent/dist/bundle/cli.js`

## 运行

```bash
node packages/coding-agent/dist/bundle/cli.js      # 或 npm run lcode
```

首次运行需要给一个模型端点。配置目录沿用 `.pi`（未改名，方便跟上游对照）：
`~/.pi/` 下放 `settings.json`，或项目里放 `.pi/settings.json`。

最小配置示例（`~/.pi/settings.json`）：

```json
{
  "model": "deepseek-chat",
  "provider": {
    "type": "openai",
    "baseUrl": "https://api.deepseek.com",
    "apiKeyEnv": "DEEPSEEK_API_KEY"
  }
}
```

## 仓库结构

```
packages/
  coding-agent/    ← 主体：CLI / TUI / 工具 / 扩展 / 会话
  agent/           ← agent loop 内核
  ai/              ← provider 抽象（OpenAI 兼容 / Anthropic），模型目录
  tui/             ← 终端 UI 组件
  chord/           ← 键盘/输入 chord 层
  codemode/        ← 沙箱式 JS 代码执行工具
  mcp/             ← MCP 客户端
  schema/          ← 运行时 schema
  durable/         ← 持久化原语
  env/             ← 环境探测
  telemetry/       ← 遥测（默认关闭）
scripts/           ← 构建辅助脚本
```

已移除上游的 `apps/`（p2 / p2-mac / p3）、`packages/evals`、nix/flake、husky、上游文档与扩展示例。

## 许可证与署名

MIT。原始的 pi 代码版权归 **Mario Zechner / Earendil Works**，见 [LICENSE](./LICENSE) 与 [NOTICE](./NOTICE)。
修改与删减（去护栏）由本仓库作者完成，同样以 MIT 发布。
