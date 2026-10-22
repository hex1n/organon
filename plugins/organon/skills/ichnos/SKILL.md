---
name: ichnos
description: >
  Record consequential choices, pivots, blockers and handoffs whose reasons
  and evidence need to survive substantial multi-step work. Use for explicit
  留痕 / 决策记录 / show your work requests and for carrying material decisions
  across sessions.
---

# Ichnos — Decision Trail

A trail preserves consequential decisions a later worker could not recover
from the diff, native logs and delivery. Start when such a decision arises,
or when the user requests a trail. Record the choice, reason, evidence and result.

Routine reversible edits, reads, checks and Git operations use existing records.
An existing trail does not require an entry for every follow-up. If routine work
reveals a consequential choice or blocker, record that event and continue.

## Task folder

Keep everything the task generates in one folder: `.scratch/YYYYMMDD-task-name/`
at the root of the repository the task works in, dated in the user's timezone.
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

Record decisions that change the contract, approach, authorization scope,
acceptance or handoff:

- a consequential choice and why the alternatives were rejected;
- a material pivot or revert, with the evidence or user decision that caused it;
- a blocker or finding that changes the next action or leaves acceptance open;
- a completed workstream's decisive verification and remaining gaps.

Group related commands and checks in one checkpoint. Reuse native output and
existing receipts; create a script only when execution itself benefits from it.

Append through the helper, which keeps every cell on one line and writes each
row in one write, so parallel writers do not interleave:

```
node <skill-dir>/scripts/trail.cjs append <decision-trail.tsv> <phase> <decision> <reason> <evidence> <result>
```

Point at evidence a reviewer can inspect or rerun. Save a decisive command and
its output when no existing receipt records them; cite rather than duplicate it.

The trail is append-only. A revert or replaced design is a new `pivot` row that
names the row it replaces; the replaced row stays checked, because its evidence
still shows what happened then. A `correction` row repairs a row that is wrong as
written or whose evidence moved: its decision names that row's timestamp, and
`check` stops checking that row's evidence. Backfill an earlier consequential
decision only when supported by visible evidence; mark its result `backfilled`.

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
