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
| 信任为 false 时拒写项目 `settings.json` | **空实现**，永远可写 |
| 信任为 false 时拒装/删项目 package | **空实现**，永远可访问 |
| 项目 `mcp.json` 禁用 `auth` 字段 | **已解禁**，项目级也可带 provider token |
| MCP `auth` 强制 https / loopback | **已解除**，token 可发往任意 host |

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

`apps/`（p2 / p2-mac / p3）已重新从上游原样导入，见下面「图形界面」。上游的 `packages/evals`、nix/flake、husky、上游文档与扩展示例仍未导入。

## 图形界面（GUI）

除 TUI 外还有浏览器界面（`apps/p2`，从上游原样导入）：

```bash
npm install --ignore-scripts
npm run hydrate:model-data      # 首次需要：生成模型数据
npm run p2                      # 默认 http://127.0.0.1:8788
```

启动后终端会打印一次性登录 token（十分钟内有效），粘贴到浏览器即可进入。

| 变量 | 默认 | 作用 |
|---|---|---|
| `PORT` | `8788` | 监听端口（仅 loopback） |
| `P2_DATA_DIR` | `~/.pi/p2` | 数据目录（sessions / settings / mcp / auth） |
| `P2_FAKE` | 未设置 | `1` 用假 provider 演示，工具仍操作真实文件 |
| `P2_IDLE_MS` | `300000` | 会话空闲多久后停掉 worker |

- `apps/p2` — 自托管 Web UI（React + Chord 插件，49 个插件），也有终端宿主：`npm --prefix apps/p2 run tui`。
- `apps/p3` — API server 与插件入口，构建用 `npm run p3:build`。
- `apps/p2-mac` — macOS SwiftUI 外壳，需要 macOS + Xcode，Windows 上无法构建。

注意：三个 app 是上游的实验代码（p2 的 README 自己标了 EXPERIMENTAL），**没有做过去护栏适配**。它们默认只监听 loopback，且自带 owner 级 agent + shell 权限，不要暴露到公网。

## 许可证与署名

MIT。原始的 pi 代码版权归 **Mario Zechner / Earendil Works**，见 [LICENSE](./LICENSE) 与 [NOTICE](./NOTICE)。
修改与删减（去护栏）由本仓库作者完成，同样以 MIT 发布。
