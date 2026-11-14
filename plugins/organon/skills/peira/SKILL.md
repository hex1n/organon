---
name: peira
description: >
  Plan, execute and present source-backed acceptance scenarios: E2E / 端到端,
  integration or regression tests against a deployed or running system. Use
  for scenario planning, running or continuing a plan/report, rendering a
  report's HTML view, or writing the project's verification
  harness: how to launch, check, drive, and observe the running system
  (本地怎么跑起来 / 验证环境说明).
---

# Peira — E2E Test Workflow

Arguments: `[plan | run | render | harness] [feature, plan, or report]`.

Route one E2E ask to its mode, then follow the stage files, each read only when its
stage starts: [plan/PLAN.md](plan/PLAN.md), [run/RUN.md](run/RUN.md),
[harness/HARNESS.md](harness/HARNESS.md), and
[run/REPORTING.md](run/REPORTING.md#format-reportv1) for a report's HTML view. Each
stage file sets its own language policy; the view follows its source Markdown
unless the user explicitly requests another language.

## Pick the mode

If an explicit invocation starts with an unquoted `plan`, `run`, `render`, or
`harness`, use that mode. Examples are `/organon:peira run …` in Claude Code
and `$organon:peira run …` in Codex; a standalone install drops the `organon:`
prefix. That mode outranks conflicting prose.
Quoted feature names and paths are operands. Without an explicit mode, infer it
from the whole ask:

| Mode | Stages | Selected by |
|---|---|---|
| plan | [Plan](plan/PLAN.md); no execution handoff | Planning scenarios or coverage without an ask to run |
| run | [Execute → render](run/RUN.md); without a plan, plan first and follow its execution handoff | Run or continue scenarios |
| render | [Render](run/REPORTING.md#render-and-check) an existing report only; with only a plan, say so and offer run mode | HTML view of a report |
| harness | [Interview → write → prove](harness/HARNESS.md); writes the project's `docs/verify/` | Writing or refreshing how to launch, check, drive, and observe the system |

For run and render, select the starting artifact in this order:

1. If the ask names a plan (`*-e2e-test-plan.md`) or execution report
   (`*-e2e-test-report.md`), use that artifact. If it does not exist, report it as missing.
2. Otherwise, resolve the feature and requested business outcome from the ask,
   then from the conversation. Select the newest applicable artifact under
   `.scratch/{feature}/e2e/`: plans are there, and reports are under its `runs/`.
   Check its expectations and coverage against the current request; a related
   feature's report is background, not an execution plan for new behavior.
3. If neither the ask nor the conversation names a feature, select the newest
   artifact across `.scratch/*/e2e/`. State which feature it belongs to.
   If two artifacts are equally recent, ask the user to choose.

Harness mode starts from the repository and its existing `docs/verify/`, not from
a plan or report; run mode reads that harness when it exists.

A report means a continuation of the outcome it covers. A harness supplies
execution mechanics, not scenario coverage. For run mode without an applicable
business plan, follow planning first; establish the scenario tree and gaps before
selecting an executable slice. In render mode, never create a substitute plan.
A scenario described only in the ask is planning input; planning can scale to one
scenario while retaining the requested outcome and affected flows.
State the mode and its starting artifacts first, then open that stage's file.

Deliver verified business findings and the canonical Markdown when ready. A report's
HTML view follows by default without holding those results; when it is ready, link
it first with its source and remaining gaps. A plan and a harness are delivered as
their Markdown files; a harness also delivers its proof run's result.
