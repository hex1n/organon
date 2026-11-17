# Issue records

Read when a run has a finding to record. The ordinary verdict and report contracts
live in `RUN.md` and `REPORTING.md`.

## Defect Handoffs

Scenario results describe observations; a root cause can affect several scenarios.
As an evidence-backed defect or actionable plan, environment, or tooling blocker is
identified, create `issues/{id}-{short-slug}.md` under the current run without a
separate request. Record observed mismatches even when their root cause is unknown;
label that uncertainty. A failed command or unexplained observation alone is not a
confirmed product defect. Keep unsupported suspicions in the report's evidence gaps.

Use one stable issue ID/file per distinct problem, linking all affected scenarios;
combine only established duplicates. Reuse the current run's issue when more evidence
arrives. A continuation links the earlier issue and records new evidence/disposition
in its own directory, preserving historical records. With no qualifying findings,
create no empty issue files or directory.

| Disposition | Meaning |
|---|---|
| `OPEN` | Unresolved, actionable now by the named owner within that owner's authority; a delegated executor does not acquire product-fix authority. |
| `CLOSED` | Verified complete or no longer applicable. |
| `MITIGATED` | A workaround exists; residual risk remains explicit. |
| `ACCEPTED` | Deliberately accepted by the named owner, a deferred fix included; the residual risk stays stated. |
| `NEEDS-DECISION` | Waits on a named owner's decision or missing expected-result authority. |
| `BLOCKED` | Waits on a named missing capability, dependency, sample, or fixture. |
| `OUT-OF-SCOPE` | Outside the current task boundary, by its definition or a user override of scope. |

The last three carry their plan meanings, so a planner's item keeps its token when it
becomes an issue; a plan's `ASSUMED` premise becomes `ACCEPTED` under its accepting
owner. The cause stays in the issue's category: a `BLOCKED` issue names
`plan`, `tooling`, or `environment` there.
Preserve inherited planner dispositions until this run changes the item's state.
Only `OPEN` findings become immediate executable next actions; other findings retain
their missing precondition, decision, capability, or scope reason. Superseded plan
requirements are recorded as overridden, never as product failures.

Each issue names its business impact, category, source run/build, affected scenarios,
disposition and owner (or unassigned), reproduction inputs/steps, expected/actual,
evidence, known or suspected cause, fix constraints, and post-fix verification/closure
rule. Missing authority or fix permission remains an explicit disposition; recording
the issue does not authorize repair. Add an index only when several issues need a
queue; the report already provides the ordinary entry point.

Link affected results to that issue. Close a product defect only after the fix
is loaded and its required E2E scenarios and affected dependents have fresh passing
evidence; preserve earlier reports. Issues live only as these local documents.
