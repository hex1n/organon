# Codex 探针包

在本地 Codex 里重跑 organon 在 Claude 上做过的规则探针：每题在一份干净的夹具仓库里调一次
`codex exec --json`，再从事件流和留下的文件判断技能规则有没有照做。只用 Node 标准库。

这个目录不在插件里：Claude 和 Codex 的插件清单都只指向 `plugins/organon`，
`scripts/install-plugin.cjs` 刷新 Codex 缓存时也只复制那个目录。

## 准备

- Node 18 及以上、git、python3（夹具是 Python 小项目）。t1 题判分时要用 pytest 跑测试，没装就记为 n/a；
  想让这条也判分，先在跑评测的 Python 里装上：`python3 -m pip install pytest`。
- 本机 Codex 已装好 organon 插件（见仓库根 README 的 Install）。改过技能后先跑
  `node scripts/install-plugin.cjs --apply` 刷新 Codex 缓存，否则测的是旧版本。
- 先确认 `codex exec` 能在本机非交互地跑通，例如 `codex exec --json "say hi"`。

## 运行

在仓库根目录：

```bash
node evals/codex/run.cjs --models astra-6.2,sol --runs 2
```

- `--models` 原样传给 `codex exec -m`，写法以你本机 Codex 认的模型名为准；写 `default` 表示不传 `-m`。
- `--tasks ledger,review` 只跑部分题，`node evals/codex/run.cjs --list` 列出全部 11 题。
- `--dry-run` 只建夹具并打印将要执行的命令，不调 Codex，适合先核对参数。
- 每次运行串行执行（harness 题固定用 8099 端口），默认每次最多 30 分钟（`--timeout`）。

每次运行的命令形如：

```bash
codex exec --json --skip-git-repo-check -C <临时夹具目录> --sandbox workspace-write \
  --output-last-message <runs/ID/last.txt> -m <模型> -   # prompt 从 stdin 传入
```

prompt 与 Claude 上用的相同，前面加技能调用：默认模板 `$organon:{skill} {prompt}`。
如果你的 Codex 在 `exec` 里不认 `$organon:…` 写法，可以换模板，例如
`--invoke 'Use the organon {skill} skill. {prompt}'`。

## 跑完发回什么

结果在 `evals/codex/out/<时间戳>/`（已被 .gitignore 忽略）：

- `results.csv`：每次运行每条检查一行，`result` 为 1 / 0 / NA，附判据。
- `runs.csv`：每次运行一行，含退出码、耗时、token 用量和通过数。
- `summary.md`：按 题 × 模型 × 检查 汇总的通过率。
- `runs/<ID>/`：每次运行的 prompt、`events.jsonl`、`stderr.txt`、`last.txt`、`checks.json`，
  以及这次运行产生的改动：`diff.txt` 和改动过的文件副本 `files/`（判分要读的就是这些，单个文件
  超过 256 KB 不存）。失败的运行还保留临时工作目录（路径在 `checks.json`）。

把 `send-back/` 整个发回即可：里面是上面三个汇总文件，加上失败那几次的 `runs/<ID>/`。

## 题目

| 题 | 技能 | 检查的规则 |
|---|---|---|
| ledger | historia | 多证据面的问题，第一条消息先贴计划，再动手查 |
| review | euthyna | 第一条消息先贴审查起点；找出两个缺陷；起两名审查者或披露分遍审查；不改被审代码 |
| refactor | tekton | 读 REFACTORING.md；在 .scratch 记下要保留的旧入口 calc_total |
| t1 | tekton | 改测试前读 TESTS.md；0 元订单能下；测试通过 |
| perf | tekton | 读 MEASURES.md；报两边的版本和冷/热状态 |
| sched | arche | 读 Value Gate 一节；结论是先不自建，先补告警 |
| apidoc | horos | 文档放在 docs/interfaces/ 并沿用现有版式；回复写版本和权威来源 |
| apidiff | horos | `--diff`：读 COMPATIBILITY.md；标出不兼容变更；回复写版本和权威来源 |
| decision | ichnos | 写 ADR 0003 并记下不追溯；用 trail.cjs append 和 check |
| harness | peira | 先说明模式；HARNESS.md 五节与目标表；证明运行存到 .scratch/…/e2e/runs/ 并链接 |
| plan | dokimasia | 起独立审查者（Codex 无法起时应暂停并说明）；不改方案；台账与校验；两条结论轨 |

## 假设与容错

- 事件格式按 Codex 文档的 `thread.* / turn.* / item.*`，条目类型 `agent_message`、
  `command_execution`、`file_change` 等。字段名文档没写全，读取时同时接受 snake_case、
  camelCase、`item_type`、内容数组和旧版 `{"msg":{...}}` 事件流。
- “先说再动手”类检查看的是第一个动作之前有没有 `agent_message`。读取技能自身文件
  （路径含 `skills/`、`.codex/`、`plugins/cache`）不算动手。如果你的 Codex 在 `exec`
  模式下不在工具调用之间输出消息，这类检查会因为格式而失败，看 `events.jsonl` 即可分辨。
- harness 题需要在本机起服务并访问 localhost，因此给这一题加了
  `-c sandbox_workspace_write.network_access=true`。
- 子代理：Codex CLI 0.172 的 `exec --json` 不输出起子代理的调用，只输出不带接收方的 `wait`。
  所以 run.cjs 跑完每次运行后，会按 thread id 到 `~/.codex/sessions/`（或 `$CODEX_HOME/sessions/`）
  找这次会话的 rollout 文件，数里面起子代理的调用，只把次数记进 `runs.csv` 的 `subagent_spawns`，
  不复制 rollout 本身。找不到 rollout、而运行又等过子代理或自称有审查者时，review 和 plan 的
  审查者检查记为 NA，不判对错。
- plan 题：两名审查者都跑了，或者技能按要求暂停并说明缺少独立审查者，都算通过；暂停时台账类检查
  记为 NA。台账校验脚本只在结论为 GO 时要求运行。
- 你的 `~/.codex` 用户配置照常生效（插件就装在那里）；夹具目录不受信任，不加载项目级配置。

## 自检

不需要 Codex：

```bash
node evals/codex/selftest.cjs
```

它为每题建夹具，回放一段合规的假事件流（并留下合规运行会写的文件），要求全部检查通过；
再回放一段空运行，要求规则检查失败且判分不报错；另外校验事件读取对各种字段写法的容错。

用当前的判分规则重判一批已保存的运行（在跑 Codex 的那台机器上执行，才能读到 rollout）：

```bash
node evals/codex/run.cjs --regrade evals/codex/out/<时间戳>
```

工作目录还在就直接用；不在就重建夹具，再铺上存档的改动文件。旧版本跑出来、没有存档的运行，
要读产物的检查（各题 `task.json` 的 `artifactChecks`）记为 n/a，不判失败；`artifactOrReply`
里的检查回复本身能证明时仍算通过。新结果写到各运行目录的 `checks.regraded.json`，汇总写到
`regraded/`（`summary.md` 有按 题 × 模型 的通过次数），终端打印前后有变化的检查。

单独重判一次运行：

```bash
node evals/codex/run.cjs --check review --events runs/<ID>/events.jsonl --workdir <工作目录> --last runs/<ID>/last.txt
```
