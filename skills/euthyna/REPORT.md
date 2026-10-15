# Review Record And Report

A review produces two artifacts. The **record** is JSON and is authoritative:
[review-record-schema.json](review-record-schema.json) defines it, [scripts/validate-review-record.cjs](scripts/validate-review-record.cjs)
checks it, and a caller reconciles rounds by its ids. The **prose report** is
rendered from that record for the person reading it, in the user's language.

Write the record first. Prose written first and a record fitted to it afterwards
inverts the dependency, and the two drift on the first correction. Neither
artifact may carry a verdict, severity, evidence class, or limit the other does
not.

## Delivery and retention

Return the record and prose in-band for a review that needs no saved output or
later continuation. When saving is requested or needed for repair/re-review,
use the user's output path; otherwise use `.scratch/YYYYMMDD-review-topic/`
under the target repository, with the review start date and a short subject.
Choose an unused name for a new series; reuse the directory for re-review.
Keep existing audit directories and their references intact.

Save `review-record.json` and `review.md`. The prose links the JSON rather than
embedding another copy. On later rounds, preserve the previous pair and write
`review-record-r2.json` and `review-r2.md` (and so on); link the prior record for
id reconciliation. The record remains the authority for every round. When the
delivered record differs from the one the reviewer returned, keep the returned
one unchanged as `evidence/returned-record.json`, so the difference stays
checkable under [Delivered record](#delivered-record).

Create `evidence/` only for material needed to substantiate findings, reproduce
checks, or continue the review. Capture the exact relevant input, command,
revision, and observation; retain source/input snapshots when a path or hash
alone cannot recover them. A compact task brief belongs here when needed for
continuation. Existing durable evidence can be linked without copying it.

Create `diagnostics/` only for launch failures, troubleshooting, or requested
execution replay. Startup logs, launch scripts, and full transcripts are not
routine deliverables. Put sufficient observed launch facts in
`mode.host_evidence`; retain the necessary receipt excerpt if a reference will
not remain available. Evidence essential to a finding is retained evidence,
even if it was first captured during troubleshooting. Do not delete existing
files or break report links to achieve a smaller directory.

## Record

Return the record in-band unless the handoff names an output path. Write it
from this template: one `entries` item per concern, of the kind it is, and
`parity_ledger` and `re_review` only for parity work and for a round after the
first.

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

[review-record-schema.json](review-record-schema.json) fixes the shape; these
are the fields whose meaning it cannot carry:

- `mode.host_evidence` — the caller-verified launch facts bound to the returned
  session: mechanism, inheritance, protected sources, writable validation roots
  and execution/data permissions, session reference, brief identity, and the state of each automatic context source the host
  offers (memory, project instructions, a resumed transcript). The caller
  resolves any pending verification under
  [HANDOFF.md](HANDOFF.md#host-mechanisms) before delivery; a role label or
  intended launch command is insufficient.
- `location` and `line_text` — the file and line at the reviewed revision, plus
  the triggering line quoted verbatim, so the reference survives the builder's
  edits and a re-review matches on content rather than line numbers. A concern
  with no quotable line is a risk, not a finding, and the schema enforces that
  by requiring `line_text` on findings alone.
- `trigger` — the conditions that reach the defect through input the caller can
  choose or through generated facts, as
  [SKILL.md](SKILL.md#test-the-failure-hypothesis) requires. Establish the supported
  input domain and intervening restrictions, or the generation path or source
  contract and its required conditions, including facts from another system.
  An unestablished triggering path belongs to a risk; a complete source proof
  does not require a captured incident.
- `falsification` — the result of the check
  [SKILL.md](SKILL.md#test-the-failure-hypothesis) owes a critical or high
  source-established finding, and required on exactly those: `ran` names the
  dispatched context's session or agent reference and what it observed;
  `not-run` names what prevented the dispatch. It sits on the entry so it
  travels with the finding through a merge, which renumbers ids that prose
  elsewhere in the record still quotes.
- `coverage.surfaces[].depth` — `in-depth` identifies in `evidence` the
  contract path and deciding boundaries inspected, including where the trace
  stops. Reading whole files or seeing green tests alone does not establish that
  depth. `sampled` and `skipped` name their limits there.
- `re_review[].reviewer_status` — what the new revision shows, read from its
  evidence rather than from the builder's action text.

The two lens lists partition [references/LENSES.md](references/LENSES.md):
every section of that file appears once, under `lenses_applied` or under
`lenses_excluded` with the fact that excludes it, spelled as that file spells
it.

## Delivered record

The reviewer returns the record. The caller delivers it and is usually the
builder being reviewed. Before delivery, the caller may make only these changes:

1. Replace `mode.host_evidence` with verified launch facts. Leave no pending value.
2. Append caller-run `checks_run` rows, with every command prefixed `caller:`.
3. If isolation cannot be established, set `verdict` and `mode.context` to
   `blocked`. Append the gap to `coverage.limits`, regardless of the returned
   verdict.

Every other difference requires a new round using the changed material.
This includes dropping a limit, changing a severity, or rewording an entry.
Render the prose from the delivered record. Change the prose only where that
record changed. Check the pair with
`node <skill-dir>/scripts/validate-review-record.cjs <delivered.json> --returned <returned.json>`.
On a re-review, also pass the preceding delivered record as the second positional argument.

## Candidate identity

Keep `reviewed.candidate` and `base` as display labels. For independent reads,
record `candidate_identity` and `base_identity` from the exact retained inputs:
`git:<full lowercase commit id>` for an immutable committed snapshot, or
`sha256:<64 lowercase hex>` for a retained snapshot artifact. Use `none` as the
base identity only for a component review that has no comparison base.

A working-tree snapshot must account for the pinned HEAD, every in-scope file's
path, mode and content, additions, deletions, and supporting inputs. Hash its
retained archive or canonical manifest, not the words "working tree at HEAD",
a branch name, a subset of changed files, or the review brief. Verify that the
review reads those bytes. Reads can have different briefs and navigation while
sharing one snapshot. If no recoverable identity exists, keep the reads separate
and report the missing identity rather than merging them.

Legacy records still validate individually. Without explicit identity fields,
the merger accepts only an entire bare full commit id, not abbreviations or a
hash embedded in prose. It checks identity equality, not the truth or completeness
of a declared snapshot; the caller and reviewer establish that from the inputs.
Keep old records unchanged; do not invent identities retroactively to pass a merge.

## Independent reads

Each read is delivered and checked as its own record under its own
`review_series` and kept as `read-N/review-record.json`, with its returned copy
beside it. The series record is then built from the delivered reads:

`node <skill-dir>/scripts/merge-review-records.cjs --series <series> --out review-record.json --map merge-map.json read-1=<file> read-2=<file>`

It keeps every entry and renumbers it, places entries on one quoted line next
to each other and marks them `co_located` in the map together with the read and
id each came from, keeps each coverage surface at its deepest depth with every
read's account, and keeps the overall verdict `blocked` if any read is blocked;
otherwise it derives the verdict from the merged entries. Findings and limits
remain present in either case. It merges first-round reads with identical
candidate and base identities, refuses a read whose host evidence is still
pending, and writes nothing unless the result validates. Co-located entries may
be one defect or several, since two distinct defects on one line do occur, so
the builder verifies each before treating two as one. The prose renders from
the merged record and names the read behind each entry from the map; a
re-review answers the merged ids.

## Prose report

Render all applicable record information, findings first, including every id,
severity, evidence class, limit and re-review disposition with its evidence.
For an empty entry kind, use one sentence instead of a section; always include
verdict and coverage.

Derived views use the delivered record and cited evidence within the requested
scope. Identify the record, reviewed revision, view scope and material limits.
Preserve the verdict and each shown item's id, kind, severity and evidence status.
When showing behavior or structure, preserve business subjects, rule owners and
required dependencies. Distinguish logical dependencies from execution order;
add no unsupported order or guarantee. Keep observations, assumptions and
proposed remedies distinguishable. Label unknown relationships where they appear.

For diagrams, make the defect and affected boundary easy to find. Separate
overview from reference detail. Give each node one role, state or action with
a short, consistent label. Put field lists, predicates and caveats in keyed
adjacent notes; keep conditions that change a relationship with that relationship.
Group related roles, align items and leave space. If the overview stays dense,
revise its abstraction or split complementary views rather than shrink text.
Choose direction for the
relationships and avoid edges that obscure them. Use restrained colour,
readable contrast and text for status. Inspect the view at its intended reading
size, including dense branches and long labels. Fix crowding, clipping,
unreadable text and connections that are hard to trace; successful rendering
alone is insufficient.

Check content and exercise interactions used to support a conclusion. State
what remains unverified. A scoped summary links
the complete record or report and does not replace them. The JSON record remains
authoritative.

## Rules

- A decision item carries a finding's own fields because it is a finding the
  user owns rather than the change's defect: a pre-existing defect keeps its
  confirmed label, severity, attribution, and evidence class there, and adds
  `location` when it has one to quote.
- `verdict` is `blocked` when the review could not be established or completed,
  including when `mode.context` is `blocked`, with the reason in
  `coverage.limits`. Preserve findings while blocked. Otherwise use
  `needs-attention` when a confirmed finding or credible high-impact risk stays
  open, and `accept-scoped` when neither exists in the inspected scope.
  A limit never upgrades a verdict. Decision items remain the user's decisions
  and do not erase a finding, risk, or review blocker.
- Severity measures consequence; the evidence class says how a finding is
  established. A concern resting on an unchecked premise is a risk at any
  severity, so a critical risk stays visible without being reported as
  confirmed; a critical or high risk may receive the one-shot falsification
  check and becomes a finding only when the observation establishes it. A
  well-evidenced nit stays optional.
- Pick the severity word from these anchors, so two reviewers of the same
  change land on the same one. Repair cost and evidence strength are not
  inputs; the discriminator is how far the consequence reaches.
  - `critical` — data loss or corruption, a defeated security or tenancy
    boundary, or an outage on a supported path.
  - `high` — a wrong result the caller cannot detect, an unhandled failure on
    valid input, or a removed guard that reopens a defect class the repository
    already closed.
  - `medium` — a real defect the consequence confines: a narrow trigger, a
    visible failure with a workaround, or one caller's broken contract.
  - `low` — a defect whose worst outcome costs a maintainer time: a confusing
    message, a log gap, a misleading name on a live path.
  The medium/high line: `high` reaches the user's data or result silently,
  `medium` stops at one caller or announces itself. When the concrete damage
  resists statement, the severity is lower than it feels.
- Coverage is the claim about what the review touched, and every located entry
  belongs to a surface the record calls `in-depth`. A finding in a sampled or
  skipped surface contradicts itself, so either the surface rises to `in-depth`
  or the concern is a risk. Incomplete review is reported in `limits`, not as
  acceptance.
- Dispositions apply from the first round onward; `re_review` adds the
  reviewer's check of the new revision. `fact_status` is whether the finding
  holds: `confirmed` with its attribution, `refuted`, or `unverified`.
  `builder_action` is what the builder did: `repaired` with the rerun checks,
  `refuted` with evidence, `deferred` with an owner, or `open`.
  `reviewer_status` is what the new revision shows: `resolved`,
  `still present`, `refuted`, or `unverified`. `repaired` becomes `resolved`
  only from that evidence; `deferred` keeps `confirmed` and its owner and
  grants no acceptance. Ids stay stable across rounds within a review series;
  sub-items carry their own ids, a merged or reclassified entry keeps its id or
  names the alias, and a new entry never reuses an old id.
- A re-review includes the preceding record from the same series and advances
  its round by one. Every unresolved prior entry remains in `entries` under
  its stable id, or names the retained entry in `current_id` after a merge or
  reclassification; its evidence explains that mapping. An unresolved material
  item cannot become optional. `re_review` is a disposition, not a replacement
  for the open item. `resolved` requires `confirmed` plus `repaired` and new evidence;
  `refuted` requires a refuted fact. Closed items leave the current entries
  and remain in the disposition history. Neither deleting an entry nor
  marking a still-present issue `deferred` grants acceptance.
- When the builder's evidence and the reviewer's conclusion point opposite
  ways, both are carried side by side with the observation each rests on. The
  user decides; relabeling the finding settles nothing.
- Check the record before returning it, whenever Node and this skill's
  directory are both reachable:
  `node <skill-dir>/scripts/validate-review-record.cjs <record.json>`, adding the
  prior record's path on a re-review, or `-` to read it from stdin. It applies
  the schema and the rules above it can reach — the fixed vocabulary, the
  verdict against the entries, id stability across rounds, coverage against
  every located entry, the lens partition — and names each violation. A
  reviewer working from an inlined brief has no such directory; then the caller
  runs it on receipt, and adds `--returned <returned.json>` to check its own
  delivery. It cannot judge evidence: a passing record is well-formed, not
  correct.
