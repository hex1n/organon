# organon

> [English](README.md) | 简体中文

面向 Codex、Claude Code 及兼容 agent runtime 的可移植 skills 与用户级工具。这些 skill
以 `organon` 插件分发（ὄργανον，意为"工具"）：给编程代理的思维工具。

[`plugins/organon/skills/`](plugins/organon/skills/) 下的每个目录都是独立的源 skill，
包含面向任务的指令，以及可选的参考资料、脚本或模板。

## 安装

Codex：

```bash
codex plugin marketplace add ./
codex plugin add organon@organon
```

Claude Code：

```bash
claude plugin marketplace add ./
claude plugin install organon@organon
```

从 GitHub 安装时，把 `./` 换成 `hex1n/organon`。安装后的 skill 带命名空间，Claude Code
中为 `organon:tekton`。在本仓库中，`node scripts/install-skills.cjs --apply` 会完成两边的
安装，并删除早先链接安装留下的逐个 skill 链接。Claude Code 直接读取本地目录 marketplace，
改动源文件后在下一个会话或 `/reload-plugins` 后生效。Codex 运行的是缓存副本：改完 skill
要重新运行安装器，门禁的 installed-copies 检查会报告过期副本。

## Skills

每个 skill 只维护一份源资产，并可作为受管安装 skill 分发到一个或多个 agent runtime。
相关术语见 [CONTEXT.md](CONTEXT.md)。

| 技能 | 领域 | 用途 |
| --- | --- | --- |
| [`arche`](plugins/organon/skills/arche/) | 规划 | 从根问题出发做规划或决策：分离约束与假设、比较机制，给出当前最佳路径及其失败条件和下一步检查；也回答值不值得做，以及对刚给出建议的质疑。 |
| [`dokimasia`](plugins/organon/skills/dokimasia/) | 审查 | 对同一份完整的方案或计划 revision 独立证伪：仅审查模式一轮完整审查后以 GO、NO_GO 或 SUSPENDED 结束；用户要求修订时进入审查并修订模式，在同一最终 revision 上迭代，直到所有必需 reviewer 返回 GO 或审查挂起。深度随候选风险标定，并决定 reviewer 强度。 |
| [`historia`](plugins/organon/skills/historia/) | 调研 | 以证据为支撑的调研，交付书面结论而非修复：判断事实真相、行为成因、证据支持哪个选项。 |
| [`tekton`](plugins/organon/skills/tekton/) | 实现 | 实现、修复、重构、迁移代码，或落地设计文档、已裁决的方案，新写和修改已有代码都适用；不破坏改动波及的调用方、已存数据和测试。先追踪受影响的契约，再按可验证的切片修改；缺陷只在原复现处确认修复；守卫只有找得到真实入口、归属方和一个去掉它就会失败的测试才保留；在最终版本上用证据证明契约仍成立。 |
| [`euthyna`](plugins/organon/skills/euthyna/) | 审查 | 先建立正确性的判断依据，再由两位独立 reviewer 分别审查业务与系统行为、实现与结构；调查缺陷、不必要的复杂度和实质风险，综合证据，只读报告。 |
| [`peira`](plugins/organon/skills/peira/) | 验证 | 规划、执行并呈现端到端测试：可溯源的业务场景树、把缺陷交回调用方另行授权修复的证据化执行报告，明确要求时才做有上限的直至全绿循环，以及 HTML 阅读视图。开头带 `plan`、`run`、`render`、`brief` 或 `harness` 时选定模式：plan 出计划并渲染；run 执行并渲染，无计划时先规划；render 只渲染已有产物；brief 为已完成的报告出一页纸摘要，与报告一起交付；harness 在 `docs/verify/` 下写出项目的验证配方，并以一次端到端实跑证明其可用。 |
| [`horos`](plugins/organon/skills/horos/) | 落地/验证 | 基于代码契约生成跨 RPC 与 HTTP 协议的后端 API 文档，范围可为单个接口、一个需求的后端 API 或一个分支的 API 变更。 |
| [`ichnos`](plugins/organon/skills/ichnos/) | 留痕 | 现有记录不足以保留重要选择、转向、阻断或交接依据，或用户明确要求时，记录理由、证据和结果。在任务的 `.scratch/` 文件夹中合并关键检查点，复用工作本身要求的审查。 |
| [`scholion`](plugins/organon/skills/scholion/) | 导航 | 记录当前代码为什么这样实现，按文件路径或代码片段查找对应的实现理由；记录由个人维护、Git 忽略，支持工作树交接。 |

## 命名

每个 skill 以其核心动作对应的古希腊词命名。旧名只留在历史记录和改名前建立的安装链接里，
见[兼容性](#兼容性)。

| Skill | 旧名 | 原意 | 对应 |
| --- | --- | --- | --- |
| `arche`（ἀρχή） | `first-principles-planner` | 本原、第一原理 | 从根问题出发做规划 |
| `dokimasia`（δοκιμασία） | `assayer` | 雅典官员上任前的资格审查；其动词也指检验钱币 | 方案在实施前被证伪 |
| `tekton`（τέκτων） | `arborist` | 建造者、木匠；architect 一词由它构成 | 按契约施工：新代码立得住，已有代码的调用方、数据和测试不被弄坏 |
| `euthyna`（εὔθυνα） | `scrutineer` | 雅典官员卸任时的问责审计；审计官只驳回指控或移交法庭 | 代码建成后受审，发现交回，不代为修复 |
| `historia`（ἱστορία） | `deep-research` | 调查；希罗多德称其著作为"调查的展示" | 以书面结论交付的调研 |
| `scholion`（σχόλιον） | `rationale-records` | 抄本页边针对某一段的批注 | 锚定到代码片段、写在项目文档之外的个人记录 |
| `horos`（ὅρος） | `generating-api-docs` | 界石；雅典的 horos 公示地块上的负担 | 在边界上写调用方契约，不写实现 |
| `peira`（πεῖρα） | `e2e-test-workflow` | 试验、尝试；empirical 一词的来源 | 在真实环境中试跑场景 |
| `ichnos`（ἴχνος） | —（新增） | 足迹、踪迹；猎人循迹找到猎物 | 复核者顺着留痕找回每个决策及其证据 |

`dokimasia` 与 `euthyna` 是雅典官员上任和卸任时各受的一次审查。在这里，它们把审查分成
实施前的方案评审和实施后的代码审查。

## 各 skill 背后的方法论

每个 skill 都只落在少数几个成熟方法论上，而不是一套自创风格。知道它用的是什么方法论，才能解释它为什么坚持某一步，也知道扩展时该去查什么。

### `arche`

- **第一性原理推理**：先分清真约束、惯例与未验证假设，再从根问题出发。
- **Five Whys（丰田）**：用于单一解法形状的请求；系统性问题则沿业务、技术、历史、运维四条根追溯。
- **价值门禁**：以现状为基线，与复用现有能力、改流程、改系统比较，值得做才进入设计。
- **方案锦标赛与反演思维（Jacobi，经 Munger 推广）**：比较本质不同的机制，再问赢家在什么条件下最差、落地后还剩多少问题。
- **预注册（实验科学）与显式停止规则（Simon 的满意化）**：Bestness Check 在推荐前写下评判标准、最强替代、被击败条件和边际收益停止点。

### `dokimasia`

- **波普尔证伪**：由独立 reviewer 攻击方案，第二模型作为对同模型盲区更强的证伪者。
- **失效关闭（安全工程的 fail-closed）**：精确门禁遇到缺失或不一致就不通过，不存在近似通过。
- **按后果定严重度**：只由后果决定，不由评审成本决定。
- **Perspective-Based Reading（Basili）**：full depth 时让一名 reviewer 以"值班运维"视角走读，A/B 实验把视角收窄到唯一值回成本的那个。
- **Decision Envelope**：技术判定与价值决策分开，评审不重算价值。

### `historia`

- **证据层级**：一手来源优先于非一手来源。
- **三角验证**：结论经多条独立证据通道交叉印证。
- **强推断（Platt；Chamberlin 的多重工作假设）**：让竞争解释并存，直到区分性检查把它们分开。

### `tekton`

- **契约式思维**：把改动定义为可观察结果、须保住的行为和区分成败的证据；修 bug 的预言机独立于缺陷本身。
- **变更影响分析（Bohner & Arnold）**：沿真实入口追踪生产者与消费者，区分源码可达与实际走到的路径。
- **遗留代码工作法（Feathers）**：特征化测试保住现有行为；接缝只为已证明的变化而设。
- **深 Module（Ousterhout）**：把大块内聚的复杂度藏在小接口后面，接口写全调用方必须知道的一切。
- **DRY 的原义（Hunt & Thomas）**：一条规则只有一个权威所有者，调用方只用不复制。
- **演进式重构模式（Fowler 目录）**：并行变更、抽象分支、绞杀者、扩展-迁移-收缩，以旧路径删除为退出。
- **增量交付**：每个切片前先验证会让它出错的承重假设，切片可验证，中间状态对调用方和数据始终有效。
- **让非法状态无法表达（Minsky）**：守卫只有找得到送来非法数据的生产入口、不变量的归属方和一个去掉它就会失败的测试才保留；平行的结构合并成一个类型，而不是靠守卫维持一致。
- **测试即预言机**：真实执行核心逻辑、只在数据边界放替身，测试数据从带出处的真实样本出发，在归属边界上断言具体值、错误码和最终存储状态。
- **按风险选择验证**：需要时加变异分析（DeMillo）和独立审查。

### `euthyna`

- **独立推导预期**：从业务目标与有依据的契约判断正确性，区分目标、所选方案与实现。
- **互补审查视角**：一位 reviewer 追踪业务与系统结果，另一位检查规则归属、实现结构和具体维护代价。
- **因果证据**：建立可达的后果，并核实能推翻发现前提的证据；未验证的实质前提保留为风险。
- **消融与测试预言机**：用针对性实验调查复杂度和防御的必要性，同时核实观察结果能支持什么结论。
- **独立反证**：交叉挑战重大结论，包括一致与通过判断；按证据裁定，保留决定性缺口、不同受影响结果与覆盖边界。

### `peira`

- 规划
  - **基于模型的测试设计（Ammann & Offutt）**：对输入空间（Base-Choice、Pairwise）、状态图、决策逻辑施加覆盖准则；复合规则的每个独立条件各欠一条义务，判定条件思想取自 MC/DC。
  - **独立预言机**：期望结果权威与实现证据分离。
  - **变更影响分析（Bohner & Arnold）**：沿共享写者、读者、调用方与订阅者追踪变更可达的路径。
- 执行
  - **RIPR 模型的骨架**：每个场景写明可达的触发、传播到系统级结果、有界的可观测完成谓词。
  - **按易失性顺序采证（数字取证）**：易失的失败现场在重试或清理前先采集。
  - **PROV 式溯源**：计划、运行、产物仅凭产物即可重建。
  - **显式的 SUT 边界**：声明每个真实依赖与替身。
- 呈现
  - **单一事实来源**：Markdown 为正本，HTML 是经核对的投影。
  - **派生视图只复述、不计算**：摘要页只能出现正本已陈述的数值，且每条结论链回确立它的场景或问题。

### `horos`

- **契约式设计（Meyer）与信息隐藏（Parnas）**：只写调用方契约，不写实现。
- **目标契约**：写意图中的外部契约，不写当前缺陷。
- **权威与证据分离**：已批准的契约决定接口承诺什么，被查阅的源码版本补全契约没写的部分；两者不一致时作为缺陷报告。

### `scholion`

- **切斯特顿的栅栏**：记下代码为什么这样实现，以及看似更简单的改写会破坏什么行为。
- **DRY 的原义（Hunt & Thomas）**：一条不变量只有一个当前所有者。
- **从代码查理由**：每条记录用文件路径和在文件内唯一匹配的代码片段定位实现，便于修改者找到对应理由。
- **记录是一次中断**：标题写"改成更自然的写法会破坏什么"——读者是在改代码的当口到达的，适不适用已由锚点回答。

### `ichnos`

- **同步、可归属的记录（ALCOA 数据完整性原则）**：在重要选择发生时记录，每次参与运行标明自己写的行。
- **只做更正分录、不擦除（簿记）**：写错的行保留，由后面的行取代。
- **适度审计**：对照证据检查新增的重要记录，并纳入工作本身已经要求的审查。

## 生命周期定位

```
规划   arche → dokimasia   ← 先定方案，再证伪
实现   tekton              ← 先追根系，再做最小安全改造
审查   euthyna             ← 证伪实现，也核实发现；只读报告
验证   peira（plan → run → render · brief）· horos
调研   historia            ← 按需求证
        ↑ 新发现的未知回馈下一轮规划
按需   ichnos              ← 保留重要决策和交接依据
```

这些技能保证「事情做对」。对用户已有方案的拷问（访谈 / grill 类技能）位于
规划与评审之间，不在本仓范围。

## 兼容性

这些 skills 不依赖特定编排 runtime，且每个都可独立分发。
`dokimasia` 在两个宿主复用同一套可移植流程：fresh-context reviewer 使用 runtime 的只读
agent 能力，second-model reviewer 使用 runtime 提供的只读第二模型能力，可用性在冻结时
一次判定并记录；reviewer 始终只读。

`peira` 在两个宿主中都由模型自动触发；手动输入时开头的 `plan`、`run`、
`render` 或 `brief` 选定模式：Claude Code 用 `/organon:peira plan …`，Codex 用
`$organon:peira plan …`。它取代已退役的 `e2e-test-planner` 与 `e2e-test-executor`。

这八个 skill 由 `first-principles-planner`、`assayer`、`arborist`、`scrutineer`、
`deep-research`、`rationale-records`、`generating-api-docs`、`e2e-test-workflow`
改名而来（见[命名](#命名)）。`node scripts/install-skills.cjs --apply` 会删除所有
指向本仓库的逐个 skill 链接（包括改名留下的），并安装插件。真实目录和指向别处的链接都会保留。`scholion` 的状态仍放在
`~/.agents/state/rationale-records` 下，已有索引和未消费的工作树交接记录照常可用。

`euthyna` 可独立调用，也可交给实现流程中的 fresh-context reviewer 使用。
它负责代码审查，`tekton` 负责实施，`dokimasia` 负责方案/计划评审；三者均无强制依赖。

## 仓库结构

```
plugins/organon/       # 插件：Claude 与 Codex 清单以及 skills/
  skills/              # 源技能，每个目录一个 skill
.claude-plugin/        # Claude Code marketplace
.agents/plugins/       # Codex marketplace
tools/                 # 可移植的用户级 agent 工具
scripts/               # 安装器与契约检查
docs/                  # 调研笔记与计划（仅本机，Git 忽略）
evals/                 # 评测运行产物（仅本机，Git 忽略）
tests/                 # 门禁运行的测试套件（仅本机，Git 忽略）
AGENTS.md              # 跨运行时共用仓库约定
CONTEXT.md             # 技能分发的领域术语
CLAUDE.md              # Claude Code 入口：一行 @AGENTS.md 导入
user-agent-rules.md    # 适用于任意仓库的用户级通用规则
```

每个技能目录包含面向任务的 `SKILL.md`（含 `name` / `description` 路由 frontmatter）、
按需加载的 `REFERENCE.md` 等细节文件，以及可选的 `scripts/` 与仅本机的 `tests/`。

## Agent 工具

organon 插件自带一个 Stop Hook：[`hooks/stop.mjs`](plugins/organon/hooks/stop.mjs)，Claude Code
通过 `hooks/hooks.json` 注册，Codex 通过插件清单注册。代理结束前，仓库有 `docs/rationale` 时它运行
[scholion](plugins/organon/skills/scholion/) 检查，仓库有 `docs/tools/run-agent-gates.mjs` 时运行该仓库自己的门禁；
两者都没有的仓库不受任何影响。Codex 第一次运行前、以及 Hook 改动后，需要你确认信任一次。
业务仓库可以在 `docs/rationale` 下保存 Git 忽略的个人记录，但不保存 formatter/checker 执行器、运行时 Hook 或 rationale 状态。

[可移植 Java formatter](tools/java-formatter/) 仍是用户级工具，由仓库的门禁脚本调用：

    node scripts/install-agent-tools.cjs
    node scripts/install-agent-tools.cjs --apply
    node scripts/contract-java-formatter.mjs
    node scripts/contract-organon-hook.mjs
    node scripts/contract-scholion.mjs

安装器把 formatter 链接到 `~/.agents/tools`，并清理早先安装为这个 Hook 留下的东西：各运行时
配置里的全局 Stop Hook 和 `~/.agents/tools/scholion` 链接，其他 Hook 和设置保持不变。

它还会安装 [`user-agent-rules.md`](user-agent-rules.md)，即适用于任意仓库的用户级规则：
`~/.codex/AGENTS.md` 建成指向它的文件符号链接，建不了链接的环境（没有开发者模式的 Windows）退回逐字节相同的副本；
`~/.claude/CLAUDE.md` 加一行指向它的 `@import`。安装器保留 Claude 文件中的其他内容，并刷新它管理的 Codex 副本。
不是安装器写的 Codex 文件只报告、不替换。
`node scripts/assert-installed-copies.cjs` 会复查副本，所以改完规则文件后重跑一次安装器。

## 测试

遵循 [AGENTS.md](AGENTS.md#verification-and-completion) 中的验证要求。

## 参与贡献

仓库工作开始前阅读 [AGENTS.md](AGENTS.md)。它统一定义 skills 与工具的源码归属、
可移植性、编写和验证要求。创建和改进 skill 使用当前运行时官方的 `skill-creator`，
措辞与信息组织使用 `writing-for-agents`。仓库特有的约束继续由 `AGENTS.md` 定义。
