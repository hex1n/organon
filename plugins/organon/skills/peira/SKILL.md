---
name: peira
description: >
  Plan, execute and present source-backed acceptance scenarios: E2E / 端到端,
  integration or regression tests against a deployed or running system. Use
  for scenario planning, running or continuing a plan/report, rendering their
  HTML views, briefing a finished report, or writing the project's verification
  harness: how to launch, check, drive, and observe the running system
  (本地怎么跑起来 / 验证环境说明).
---

# Peira — E2E Test Workflow

Arguments: `[plan | run | render | brief | harness] [feature, plan, or report]`.

Route one E2E ask to its mode, then follow the stage files, each read only when its
stage starts: [plan/PLAN.md](plan/PLAN.md), [run/RUN.md](run/RUN.md),
[harness/HARNESS.md](harness/HARNESS.md), and
[READER-VIEW.md](READER-VIEW.md) for the HTML views. Each stage file sets its own
language policy; an HTML view follows its source Markdown unless the user explicitly
requests another language.

## Pick the mode

If an explicit invocation starts with an unquoted `plan`, `run`, `render`,
`brief`, or `harness`, use that mode. Examples are `/organon:peira run …` in Claude Code
and `$organon:peira run …` in Codex; a standalone install drops the `organon:`
prefix. That mode outranks conflicting prose.
Quoted feature names and paths are operands. Without an explicit mode, infer it
from the whole ask:

| Mode | Stages | Selected by |
|---|---|---|
| plan | [Plan → render](plan/PLAN.md); no execution handoff | Planning scenarios or coverage without an ask to run |
| run | [Execute → render](run/RUN.md); without a plan, plan first and follow its execution handoff | Run or continue scenarios |
| render | [Render](READER-VIEW.md) an existing artifact only; no substitute plan | HTML view of a plan/report |
| brief | [Brief](READER-VIEW.md) a finished report; with only a plan, say so and offer run mode | Summary or one-page report |
| harness | [Interview → write → prove](harness/HARNESS.md); writes the project's `docs/verify/` | Writing or refreshing how to launch, check, drive, and observe the system |

For run, render, and brief, select the starting artifact in this order:

1. If the ask names a plan (`*-e2e-test-plan.md`) or execution report
   (`*-e2e-test-report.md`), use that artifact. If it does not exist, report it as missing.
2. Otherwise, resolve the feature from the ask, then from the task already in the
   conversation. If a feature is known, select the newest artifact under
   `.scratch/{feature}/e2e/`: plans are there, and reports are under its `runs/`.
3. If neither the ask nor the conversation names a feature, select the newest
   artifact across `.scratch/*/e2e/`. State which feature it belongs to.
   If two artifacts are equally recent, ask the user to choose.

Harness mode starts from the repository and its existing `docs/verify/`, not from
a plan or report; run mode reads that harness when it exists.

A report means a continuation. In render mode, never create a substitute plan.
A scenario described only in the ask is planning input, however complete it
reads. The planning rules scale a plan down to one scenario.
Before reading any stage's rules, state the mode and its starting artifacts.

Deliver with the HTML view first when it exists, then the canonical Markdown, and the
summary the stage file specifies. A harness has no HTML view: deliver its files and
the proof run's result.
