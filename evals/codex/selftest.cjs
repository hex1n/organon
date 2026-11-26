#!/usr/bin/env node
"use strict";

// Smoke test for the graders, no Codex needed: for every task, build the
// fixture, play a fake event stream of a compliant run (and leave the files
// such a run would leave), and expect every applicable check to pass; then
// grade an empty run and expect the rule checks to fail without crashing.
// Also checks that the event reader accepts the field-name variants.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");
const { parse } = require("./lib/events.cjs");
const { build } = require("./lib/fixture.cjs");
const { loadTasks, grade } = require("./run.cjs");

const SKILLS = "/home/u/.codex/plugins/cache/organon/organon/0.7.43/skills";
let seq = 0;
const ev = {
  msg: (text) => [{ type: "item.completed", item: { id: `item_${seq++}`, type: "agent_message", text } }],
  cmd: (command, output = "", exit = 0) => {
    const id = `item_${seq++}`;
    return [
      { type: "item.started", item: { id, type: "command_execution", command, aggregated_output: "", status: "in_progress" } },
      { type: "item.completed", item: { id, type: "command_execution", command, aggregated_output: output, exit_code: exit, status: "completed" } },
    ];
  },
  // Variant field names from SDKs: item_type, camelCase output.
  cmdAlt: (command, output = "") => [{ type: "item.completed", item: { item_id: `item_${seq++}`, item_type: "commandExecution", command: ["bash", "-lc", command], aggregatedOutput: output, exitCode: 0 } }],
  write: (paths) => [{ type: "item.completed", item: { id: `item_${seq++}`, type: "file_change", changes: paths.map((p) => ({ path: p, kind: { type: "update" } })), status: "completed" } }],
  agent: (prompt) => [{ type: "item.completed", item: { id: `item_${seq++}`, type: "collab_tool_call", tool: "spawn_agent", prompt, status: "completed" } }],
};

function put(dir, file, text) {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), text);
}

const GOOD = {
  ledger: (d, s) => [
    ...ev.msg("计划：关键未知是差额从哪次改动开始。先看 git 历史和对账日志，再读 billing/fx.py 和 ADR；如果日志与提交时间对不上就改查配置。"),
    ...ev.cmd("git log --oneline --date=iso", "x refactor(fx): use the same rounding helper"),
    ...ev.msg(`原因是 ${s.sha} refactor(fx) 把 bank_round 换成 half_up，2026-11-17 起 EUR、GBP 出现差额。`),
  ],
  review: () => [
    ...ev.msg("审查起点：比较 HEAD 和工作区未提交的优惠券改动，业务意图以 docs/coupons.md 为准。"),
    ...ev.cmd("git diff HEAD"),
    ...ev.msg("不能合。\n\n**F1** 顺序：优惠券先于会员折扣计算，与 docs 规定相反。\n**F2** 下限：应付金额可能低于运费。\n\n本次在同一上下文分两遍审查，独立性降低。"),
  ],
  refactor: (d) => {
    put(d, ".scratch/discount-rules/entry-points.md", "orders.calc_total 保留给 billing-export\n");
    return [
      ...ev.msg("先读规则再改。"),
      ...ev.cmd(`sed -n '1,200p' ${SKILLS}/tekton/references/REFACTORING.md`, "# Refactoring\n\nUse this branch for structural improvement with preserved behavior."),
      ...ev.cmd("cat orders.py cart.py invoice.py"),
      ...ev.write([".scratch/discount-rules/entry-points.md"]),
      ...ev.msg("已收拢，orders.calc_total 暂留。"),
    ];
  },
  t1: (d) => {
    const svc = path.join(d, "orders/service.py");
    fs.writeFileSync(svc, fs.readFileSync(svc, "utf8").replace("amount_cents <= 0", "amount_cents < 0"));
    const t = path.join(d, "tests/test_service.py");
    fs.writeFileSync(t, fs.readFileSync(t, "utf8").replace("for amount in (0, -1, -500):", "for amount in (-1, -500):"));
    return [
      ...ev.cmdAlt(`cat ${SKILLS}/tekton/references/TESTS.md`, "# Tests\n\nRead before writing or changing a test"),
      ...ev.write(["orders/service.py", "tests/test_service.py"]),
      ...ev.cmd("python3 -m pytest -q", "4 passed"),
      ...ev.msg("0 元订单可以创建了，测试通过。"),
    ];
  },
  perf: (d, s) => [
    ...ev.cmd(`cat ${SKILLS}/tekton/references/MEASURES.md`, "# Measured numbers\n\nRead before reporting a measured number."),
    ...ev.cmd("python3 bench.py 10000", "n=10000 dups=6321 seconds=4.210"),
    ...ev.msg(`优化前（${s.sha}）4.21s，优化后（工作区未提交改动）0.01s；同一进程连续测量，属于热（warm）状态。`),
  ],
  sched: () => [
    ...ev.cmd(`rg -n -A30 "Value Gate And Decision Envelope" ${SKILLS}/arche/REFERENCE.md`, "130:## Value Gate And Decision Envelope\n134:Value Gate asks whether the winner beats the status quo by enough to build at"),
    ...ev.msg("不建议自建。先给现有 cron 加失败告警和监控。"),
  ],
  apidoc: (d, s) => {
    put(d, "docs/interfaces/Order_API_Doc.md", "# 订单接口\n\n## 通用约定\n\n## 接口列表\n");
    return [...ev.cmd("ls docs/interfaces"), ...ev.write(["docs/interfaces/Order_API_Doc.md"]), ...ev.msg(`基于 ${s.sha} 编写；没有接口契约，以当前代码为准。`)];
  },
  apidiff: (d, s) => {
    put(d, "docs/interfaces/Order_API_Changes.md", "# 订单接口变更\n\n- remark 改名为 note：不兼容\n");
    return [
      ...ev.cmd(`cat ${SKILLS}/horos/COMPATIBILITY.md`, "# Documenting changes\n\nFor a document describing changes to an interface its callers keep calling."),
      ...ev.cmd("git diff main...HEAD"),
      ...ev.msg(`变更说明基于 ${s.sha}，以当前代码为准。remark 改为 note 属于不兼容变更。`),
    ];
  },
  decision: (d) => {
    put(d, "docs/decisions/0003-refund-to-original-channel.md", "# 0003 退款原路退回\n\n已退到余额的历史订单不追溯。\n");
    return [
      ...ev.cmd(`node ${SKILLS}/ichnos/scripts/trail.cjs append .scratch/refund/decision-trail.tsv decide 原路退回 对账 财务 ok`),
      ...ev.cmd(`node ${SKILLS}/ichnos/scripts/trail.cjs check .scratch/refund/decision-trail.tsv`),
      ...ev.msg("已记录为 ADR 0003。"),
    ];
  },
  harness: (d) => {
    put(d, ".scratch/notes/e2e/runs/20261126-1000/run.log", "ok\n");
    put(d, "docs/verify/HARNESS.md", "# Harness\n\n| target | how |\n|---|---|\n| notes | python3 app.py |\n\n## Launch\n## Doctor\n## Drive\n## Evidence\n[run](../../.scratch/notes/e2e/runs/20261126-1000/)\n## Cleanup\n\nverified 2026-11-26\n");
    put(d, "docs/verify/features/index.md", "- notes\n");
    put(d, "docs/verify/features/notes.md", "notes\n");
    return [...ev.msg("模式：harness。起点：notes 服务，python3 app.py，端口 8099。"), ...ev.cmd("python3 app.py &"), ...ev.msg("harness 已写好并跑通。")];
  },
  plan: (d) => {
    put(d, ".scratch/review-cache/review-ledger.json", JSON.stringify({ round_receipts: [{}, {}] }));
    put(d, ".scratch/review-cache/review.md", "candidate sha256 " + "a".repeat(64) + "\n");
    return [
      ...ev.agent("review docs/plan.md as reviewer A"),
      ...ev.agent("review docs/plan.md as reviewer B"),
      ...ev.cmd(`node ${SKILLS}/dokimasia/scripts/validate-review-ledger.cjs .scratch/review-cache/review-ledger.json`),
      ...ev.msg("NO_GO / UNCHANGED。阻断项：多实例部署时编辑后只清本实例缓存，其他实例读到陈旧价格。"),
    ];
  },
};

// Compliant runs worded another way than GOOD, so the graders do not hinge on
// one phrasing: a doc named in Chinese, the code named as authority with a
// branch in between, arche's own DEFER token, a suspend said in English.
const ALT = {
  apidoc: (d, s) => {
    put(d, "docs/interfaces/订单接口文档.md", "# 订单接口\n\n## 通用约定\n\n## 接口列表\n");
    return [...ev.write(["docs/interfaces/订单接口文档.md"]), ...ev.msg(`仓库里没有接口设计，以 \`main\`（${s.sha}）的代码为准。`)];
  },
  apidiff: (d, s) => {
    put(d, "docs/interfaces/order-v2-changes.md", "# 变更\n\n- remark 改名为 note，前端必须改\n");
    return [
      ...ev.cmd(`sed -n '1,80p' ${SKILLS}/horos/COMPATIBILITY.md`),
      ...ev.msg(`没有 OpenAPI，按代码写（${s.sha}）。`),
    ];
  },
  sched: () => [
    ...ev.cmd(`sed -n '120,200p' ${SKILLS}/arche/REFERENCE.md`),
    ...ev.msg("decision: DEFER。先给 cron 加失败告警，三个月后再评估。"),
  ],
  plan: () => [
    ...ev.msg("This session cannot spawn independent reviewers, so the review is SUSPENDED and docs/plan.md is left as is."),
  ],
};

function eventsOf(list) {
  return list.map((e) => JSON.stringify(e)).join("\n");
}

function testEvents() {
  const run = parse([
    JSON.stringify({ type: "thread.started", thread_id: "t1" }),
    JSON.stringify({ type: "turn.started" }),
    ...ev.msg("plan").map((e) => JSON.stringify(e)),
    ...ev.cmd("git log", "abc").map((e) => JSON.stringify(e)),
    "not json",
    JSON.stringify({ type: "turn.completed", usage: { input_tokens: 10, cached_input_tokens: 2, output_tokens: 3, reasoning_output_tokens: 1 } }),
  ].join("\n"));
  assert.equal(run.steps.length, 2);
  assert.equal(run.steps[1].output, "abc");
  assert.equal(run.parseErrors, 1);
  assert.deepEqual(run.usage, { input: 10, cached: 2, output: 3, reasoning: 1 });
  assert.equal(run.final, "plan");
  const legacy = parse([
    { id: "0", msg: { type: "agent_message", message: "hi" } },
    { id: "1", msg: { type: "exec_command_begin", call_id: "c", command: ["bash", "-lc", "ls"] } },
    { id: "1", msg: { type: "exec_command_end", call_id: "c", stdout: "a", exit_code: 0 } },
    { id: "2", msg: { type: "task_complete", last_agent_message: "done" } },
  ].map((e) => JSON.stringify(e)).join("\n"));
  assert.equal(legacy.steps.length, 2);
  assert.equal(legacy.steps[1].command, "bash -lc ls");
  assert.equal(legacy.final, "done");
}

function main() {
  testEvents();
  let failures = 0;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "organon-codex-selftest-"));
  try {
    for (const task of loadTasks([])) {
      for (const mode of ["good", "alt", "empty"]) {
        if (mode === "alt" && !ALT[task.id]) continue;
        const dir = path.join(root, `${task.id}-${mode}`);
        const setup = build(task.dir, dir, task.frozen || []);
        const sha = setup.head.slice(0, 7);
        const events = mode === "empty" ? ev.msg("完成。") : (mode === "good" ? GOOD : ALT)[task.id](dir, { sha });
        const run = parse(eventsOf(events));
        const checks = grade(task, dir, run, run.final, setup);
        const failed = checks.filter((c) => c.result === false);
        const ok = mode !== "empty" ? failed.length === 0 : failed.length > 0 && !checks.some((c) => c.name === "grader ran");
        if (!ok) failures += 1;
        const na = checks.filter((c) => c.result === null).map((c) => c.name);
        console.log(`${ok ? "ok  " : "FAIL"} ${task.id.padEnd(9)} ${mode.padEnd(5)} ${checks.length - failed.length - na.length}/${checks.length - na.length} pass${na.length ? `, ${na.length} n/a` : ""}${mode !== "empty" && failed.length ? `: ${failed.map((c) => `${c.name} [${c.evidence}]`).join("; ")}` : ""}`);
      }
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
  if (failures) { console.error(`${failures} selftest case(s) failed`); process.exitCode = 1; }
}

if (require.main === module) main();
