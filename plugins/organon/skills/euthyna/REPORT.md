# Review Record And Report

Use for requested/workflow-required machine records and existing record series;
ordinary prose follows [SKILL.md](SKILL.md#report-and-re-review). A prose report is
not a historical JSON record: a later machine gate starts its recorded series at
round one, retaining prior concerns as known context.

The JSON is authoritative. [review-record-schema.json](review-record-schema.json)
owns shape; [the validator](scripts/validate-review-record.cjs) checks it. Validate
before rendering prose with the same verdict, severity, evidence and limits.

## Delivery and retention

Return record and prose in-band unless saved output or continuation is needed.
Then use the user's path or an unused `.scratch/YYYYMMDD-review-topic/` in the target
repository, reused for the series. Save `review-record.json` and `review.md`;
later rounds retain prior pairs and use `review-record-r2.json`, `review-r2.md`, etc.
Link JSON rather than embedding it. Retain the unchanged raw return as
`evidence/returned-record.json` when delivery differs.

Keep deciding inputs, commands, revisions and observations recoverable, including
source snapshots when paths/hashes alone cannot recover bytes. Keep prior audit
files and unique reproduction evidence. Routine transcripts/startup scripts are
not deliverables; minimal host receipts establish `mode.host_evidence`.
`diagnostics/` holds actual launch failures, troubleshooting or requested replay.

## Record

Use one entry per concern under its actual kind. Add `parity_ledger` for alignment
and `re_review` after round one.

```json
{
  "verdict": "accept-scoped | needs-attention | blocked",
  "mode": { "context": "fresh-context | self-review | blocked", "host_evidence": "<launch facts>" },
  "review_series": "<the brief's review_series>",
  "round": 1,
  "brief": { "source": "inline | file", "path": "<the brief's path, when source is file>", "content_identity": "sha256 <hex of the brief as received>" },
  "reviewed": {
    "candidate": "<revision reviewed>", "base": "<revision it is compared against>",
    "candidate_identity": "<git:full-commit-id or sha256:snapshot-digest>",
    "base_identity": "<git:full-commit-id, sha256:snapshot-digest, or none for no base>",
    "scope": "<what the review covered>"
  },
  "entries": [
    {
      "kind": "finding", "id": "F1", "title": "<...>",
      "severity": "critical | high | medium | low",
      "attribution": "introduced | pre-existing | unknown",
      "evidence": "observed | source-established",
      "location": { "file": "<path at the reviewed revision>", "line": 1 },
      "line_text": "<the triggering line, verbatim>",
      "trigger": "<conditions that reach it>",
      "contract": "<the obligation it breaks>",
      "consequence": "<what goes wrong>",
      "evidence_detail": "<the observation or source reading that establishes it>",
      "falsification": { "status": "ran | not-run", "detail": "<the separate context's reference and what it observed, or what prevented the dispatch>" },
      "repair_constraints": "<what a repair must preserve, when there is any>"
    },
    {
      "kind": "risk", "id": "R1", "title": "<...>",
      "severity": "critical | high | medium | low",
      "unknown": "<the unchecked premise>",
      "smallest_resolving_check": "<the check that would settle it>",
      "blocks": "<the conclusion it prevents>"
    },
    {
      "kind": "decision", "id": "D1", "title": "<...>",
      "decision_kind": "scope deviation | pre-existing defect | target-versus-preservation conflict",
      "severity": "critical | high | medium | low",
      "attribution": "introduced | pre-existing | unknown",
      "evidence": "observed | source-established",
      "location": { "file": "<path, when there is a line to quote>", "line": 1 },
      "evidence_detail": "<...>",
      "decision_needed": "<the choice the user owns>"
    },
    { "kind": "optional", "id": "O1", "title": "<...>", "benefit": "<the concrete benefit>" }
  ],
  "coverage": {
    "surfaces": [{ "surface": "<a surface of the brief's coverage_plan>", "depth": "in-depth | sampled | skipped", "evidence": "<see below>" }],
    "lenses_applied": ["<LENSES.md section heading>"],
    "lenses_excluded": [{ "lens": "<section heading>", "reason": "<the fact that excludes it>" }],
    "checks_run": [{ "command": "<command>", "revision": "<revision it ran at>", "observation": "<what it showed>" }],
    "limits": ["<what the review could not establish>"]
  },
  "parity_ledger": [{ "obligation": "<...>", "expected": "<...>", "actual": "<...>", "evidence_or_gap": "<...>" }],
  "re_review": [{ "id": "F1", "current_id": "<current entry id, only after merging or reclassification>", "fact_status": "confirmed | refuted | unverified", "builder_action": "repaired | refuted | deferred | open", "reviewer_status": "resolved | still present | refuted | unverified", "evidence": "<what the new revision shows>" }]
}
```

The schema owns field types/vocabulary. `location` and verbatim `line_text` refer
to the reviewed revision; an entry without a quotable triggering line is a risk.
Every located entry needs an in-depth coverage surface. Its evidence carries path
outcomes and stopping points under SKILL.md; sampled/skipped surfaces name limits.
Partition every LENSES.md heading once between applied and factually excluded,
using the original spelling. Observations, complete source proofs and unresolved
premises follow SKILL.md; well-formed JSON alone establishes none of them.

## Delivered record

The caller may only replace `mode.host_evidence` with verified facts, append checks
with `caller:` commands, or demote context/verdict to blocked with the isolation gap
added to limits. Retain findings and old limits. Host evidence names actual loaded
context, source protection, permissions, session and brief identity under
[HANDOFF.md](HANDOFF.md#host-mechanisms), with no pending verification.

Keep context-aware caller dispositions beside the immutable return, naming each
origin and deciding premise/constraint. They do not waive a required gate. Any other
record change, including entry/severity/limit edits, needs a new review round.
Render prose from the delivered record and preserve its information.

Check `node <skill-dir>/scripts/validate-review-record.cjs <delivered.json> --returned <returned.json>`,
adding the prior delivered record as the second positional argument on re-review.

## Candidate identity

Display labels are not identity. Derive candidate/base identities from recoverable
exact inputs: `git:<full lowercase commit id>` or `sha256:<64 lowercase hex>` for a
snapshot. Base `none` is only for a component without comparison base. A working-tree
snapshot covers HEAD, all in-scope paths/modes/content, additions, deletions and
supporting inputs. Retain its archive/canonical manifest and verify the reviewer
reads it. A brief, branch label or changed-file subset is insufficient.

Legacy records validate individually; the merger accepts a whole bare commit ID
when explicit identities are absent. Keep old records unchanged. Matching identity
strings do not prove snapshot truth/completeness; establish those from inputs.

## Independent reads

Deliver/check each read separately in `read-N/review-record.json`, with its own
series `<series>.read-N` and raw return, then merge:

`node <skill-dir>/scripts/merge-review-records.cjs --series <series> --out review-record.json --map merge-map.json read-1=<file> read-2=<file>`

Only initial reads with matching candidate/base identities and resolved host
evidence merge. Every entry/limit survives; IDs are renumbered with their origin
map. Same-line entries are `co_located`, not necessarily one defect: verify before
deduplicating. Coverage retains deepest depth plus each read's account. Any blocked
read keeps the series blocked; otherwise entries decide. Render prose with origins
from the map; re-review answers merged IDs. Evidence, not agreement, settles findings.

## Prose report

Render all applicable record information, findings first: IDs, severity, evidence,
limits and re-review dispositions. Verdict/coverage always appear; an empty kind
needs one sentence. A summary links the complete report/record, never replaces it.
Derived views identify source record, revision, scope and limits, preserving shown
IDs, kinds, severity/evidence, verdict, subjects, rule owners and dependencies.
Separate facts, assumptions, remedies, logical dependencies and execution order.

<!-- >>> shared-derived-views -->
For diagrams, separate overview from reference detail. Give each node one role,
state or action with a short, consistent label. Put field lists, predicates and
caveats in keyed adjacent notes; keep conditions that change a relationship with
that relationship. Make the reading path clear: choose grouping and direction
for the relationships, align related items, give them space and reduce crossing
or backtracking edges. If the overview is still dense, revise its abstraction or
split complementary views rather than shrink the text. Use restrained colour
with sufficient contrast; convey status and unknown relationships in text.

Check content and inspect the rendered view at its intended reading size,
including dense branches and long labels. Fix unreadable text, collisions,
clipping and connections that are hard to trace; a successful render alone is
insufficient. Revise grouping, layout or format when needed. Exercise the
interactions used in the explanation and state what remains unverified.
<!-- <<< shared-derived-views -->

## Rules

- Use `blocked` for incomplete review/context with the reason in limits and findings
  retained. Otherwise `needs-attention` keeps open findings/credible high-impact risks;
  `accept-scoped` requires neither in inspected scope. Labels/limits grant no acceptance.
- User-owned scope, pre-existing-defect and preservation conflicts retain the
  finding's fields, severity, origin/evidence as decisions, with the actual choice.
  Keep contrary evidence and builder/reviewer disagreement visible.
- Severity measures consequence independently of evidence or repair cost: `critical`
  is data loss/corruption, defeated security/tenancy or supported-path outage; `high`
  is silent wrong results, unhandled valid-input failure or a removed guard reopening
  a closed defect class; `medium` is confined/visible failure with workaround or one
  caller's contract; `low` is a live-path defect costing maintainer time. Unclear
  concrete damage does not justify higher severity. Critical/high source-established
  entries retain their falsification status/session/result or dispatch barrier.
- IDs/sub-IDs stay stable within a series; merge/reclassification keeps ID or alias,
  and new entries never reuse old IDs. Re-review advances exactly one round in the
  same series and answers every preceding ID, including reopened historical concerns.
- Track fact (`confirmed | refuted | unverified`), builder action
  (`repaired | refuted | deferred | open`) and reviewer status
  (`resolved | still present | refuted | unverified`) separately, with new evidence.
  `resolved` needs confirmed + repaired + new evidence; `refuted` needs a refuted fact.
  Deletion, deferral or repair claims alone close nothing. Retain unresolved entries
  or map them via `current_id`; material ones cannot become optional. Closed entries
  leave current entries but retain disposition history.
- Validate records whenever Node/skill files are reachable:
  `node <skill-dir>/scripts/validate-review-record.cjs <record.json>`, with the prior
  record on re-review; `-` reads stdin. With an inlined skill, the caller validates
  on receipt, using `--returned` for delivery. Checks cover schema/vocabulary, state,
  lineage, coverage, lens partition and delivery changes, not evidence truth.
