---
name: ichnos
description: >
  Record consequential decisions, reversals and blockers as they arise
  when their reasons or evidence matter to later work, such as material
  choices about scope, approach, authorization or acceptance. Also use for
  explicit decision-trail requests (留痕 / 决策记录).
---

# Ichnos — Decision Trail

Decide as work progresses which choices, pivots and blockers need a record.
Start or append to the trail when the event happens and its rationale or
evidence matters to what happens next. Start one when the user asks.
Use native logs for routine work. A brief Markdown handoff carries the
current decision, evidence links, open checks and next action.

## Task folder

Keep the trail and supporting artifacts together in `.scratch/YYYYMMDD-task-name/`
at the task repository's root, dated in the user's timezone.
Use the folder the user named or another workflow already opened for this task,
and reuse it when the task resumes. It holds:

- `decision-trail.tsv`, the trail;
- the evidence rows point to: saved command output, logs, result files, and
  scripts that rerun a check;
- `decision-trail-review.md`, the reviewer's flags, when a reviewer runs.

Leave the folder unstaged. Commit the trail only when the user wants it in history.

## Rows

| Column | Content |
| --- | --- |
| `timestamp` | ISO 8601 with offset; the helper stamps it. |
| `phase` | The stage or workstream: `plan`, `slice-2`, `review`, `verify`. `start` marks run boundaries only. |
| `decision` | What was chosen or done, in one line, in the words you would use with a teammate. |
| `reason` | Why, in plain words. |
| `evidence` | Pointers that resolve: a path relative to the task folder or repository root, `file:line`, a commit, a URL. Wrap a path that contains spaces in backticks. |
| `result` | The outcome or state: `focused 48/48 green`, `reverted`, `17/17 mutants detected`, `open`, `blocked: <what>`. |

Record decisions that materially change the contract, approach, authorization
or acceptance:

- a consequential choice and why it won. When relevant, include the cost of
  switching each way, what would reopen the choice, or why a limit was accepted.
- a material pivot or revert, with the evidence or user decision that caused it;
- a blocker or finding that changes the next action or leaves acceptance open;
- a completed workstream's decisive verification and remaining gaps.

Group related commands and checks. Add scripts when they aid execution.

Append through the helper, which keeps every cell on one line and writes each
row in one write, so parallel writers do not interleave:

```
node <skill-dir>/scripts/trail.cjs append <decision-trail.tsv> <phase> <decision> <reason> <evidence> <result>
```

Pin mutable evidence to the revision, snapshot or run used. Reuse a receipt
or save the decisive command and output.

The trail is append-only. A revert or replaced design is a new `pivot` row that
names the row it replaces; the replaced row stays checked, because its evidence
still shows what happened then. A `correction` row repairs a row that is wrong as
written or whose evidence moved: its decision names that row's timestamp, and
`check` stops checking that row's evidence. Backfill an earlier consequential
decision only when supported by visible evidence; mark its result `backfilled`.

## Durable project decisions

When discussion settles a material business rule, requirement boundary or
design choice that future work must honor, preserve the decision and its
rationale in project docs. Reuse a requirement or design document that already
explains the decision. Otherwise, when repository edits are in scope, write a
short ADR with the context, decision, rationale and consequences. Include the
confirmed edge cases and deliberate exclusions that define the boundary.
Follow the project's ADR convention, or use `docs/adr/` for the first ADR.
Link the record from the trail. Use the trail for temporary constraints and
open choices that affect the task.

## Runs

A run is one agent conversation, including later turns and compaction. Reuse
the task's folder and trail when work resumes.

- A run that adds to a trail holding another run's rows writes a `start` row
  first. Its decision names the timestamp range of the rows this run did not
  write; its evidence identifies this run by session id or agent name.
- Before appending in a later turn, read the last rows. Rows from another run
  since your last row call for a new `start` row. A routine follow-up that adds
  no material decision needs neither a `start` row nor another audit.

## Close the task

When this run added or corrected material rows:

1. **Audit** those rows against what actually happened.
   - Run `node <skill-dir>/scripts/trail.cjs check <decision-trail.tsv>`. It
     confirms the six columns and that every path and commit in evidence
     resolves, except in rows a `correction` row supersedes.
   - Open the evidence behind each verification claim and confirm it shows what
     the row says.
   - Add missing consequential choices, pivots and gaps.

   Make corrections as new superseding rows; existing rows stay as written.
   Consult this run's transcript only when the receipts leave a material claim
   or decision unresolved. Disclose an unavailable source if it limits acceptance.
2. **Review** when the user or governing workflow requires it. Include the trail
   in that review and reuse its findings; the trail adds no separate review stage.
   Delegation, repeated deliveries and a changed approach do not alone trigger
   another reviewer. Use a different model only when the user asks for one.
3. **Deliver** the result, checks and material limits once. Link the trail when
   it helps the reader. Use a separate `Attention` section only when required
   by the governing workflow or useful for a material unresolved flag.
