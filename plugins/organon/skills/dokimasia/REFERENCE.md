# Dokimasia Reference

Read the section named by the current branch. The shared review contract and
Exact Gate live in [SKILL.md](SKILL.md).

## Decision Envelope And Entry States

Only an explicitly requested implementation-authorization gate consumes this
upstream envelope; review does not recompute its worth-building decision:

```yaml
decision: BUILD | DEFER | NO_BUILD | RESEARCH_FIRST
target_outcome:
baseline_and_frequency:
expected_benefit:
delivery_and_maintenance_cost:
status_quo_or_existing_mechanism:
decision_flip_condition:
review_scope: implementation-authorization | correctness-only
review_budget:
```

Reuse an existing explicit user decision as `decision: BUILD, source: user`.
A revision changing cost, benefit, mechanism, scope or key assumptions invalidates
the authorization envelope: suspend that gate until the user or upstream decision
renews it. Correctness-only can continue with changed assumptions stated, unless
the technical target itself needs a user decision.

Entry outcomes are NOT_READY for a missing candidate or requested authorization
without a build decision; DEFERRED for a standing non-BUILD authorization decision;
WITHDRAWN when the user withdraws; SUSPENDED when a running review cannot close.
Use the two outcome tracks defined in SKILL.md; none of these states grants GO.

## Review Artifacts

A short review needing no saved output or continuation may keep its complete
ledger and findings in chat. The checker accepts stdin when no path is supplied.
Save when requested, needed for repair/re-review, or needed for complete disclosure
too long for chat. Use the user's path, otherwise an unused
`.scratch/review-YYYYMMDD-topic/` under the target repository; reuse it for that
series's later rounds. Keep records separate from the candidate; saving never
authorizes editing it.

The parent owns `review-ledger.json`, the authoritative record of attempts,
receipts, reviewer payloads, validations and dispositions. `review.md` presents
the current outcomes and complete findings with parent validations, linking the
ledger and exact candidate instead of copying its JSON. Before replacing a round's
report, archive it as `review-r1.md`, `review-r2.md`, etc.; retain original claims,
later parent judgments and prior payloads. Link a long reviewer report before
remediation, then supplement it with validations rather than rewriting its claims.

Retain evidence needed to verify or resume the review, including recoverable
candidate/authority snapshots when a path or hash cannot retrieve their bytes.
Create `evidence/` or `diagnostics/` only for an actual evidence, launch-failure or
requested-replay need. Full transcripts and startup scripts are not routine
deliverables; keep minimal host receipts where needed to verify invocation/cost.
Preserve existing audit records and the only reproduction evidence.

Optional views identify their source, scope and uncertainties, preserving reviewer
claims, parent judgments, rule owners and dependencies. They establish no new
outcome, ordering guarantee or gate result.

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

## Compact Review Packet

For a long candidate, send one readable artifact: candidate path or exact text,
hash, constraints, rubric, evidence scope, review kind/mode and, for a recheck,
the finding ledger. The parent may materialize a chat-only candidate where writes
are permitted. For remote review, send exact text once and reuse that reviewer
session for rechecks; exclude the parent transcript. Repository disclosure needs
its own authorization. Without it, use supplied evidence or suspend the lane,
keeping evidence-dependent criteria visible.

## Runtime And Invocation

Bind frozen `fresh-context` reviewers to the runtime's read-only agent capability
and explicitly selected `second-model` reviewers to that capability. Record identity,
independence, disclosure boundary and availability failures. Helpers default to
zero; [Helper Agents](#helper-agents) defines their eligible scope.

Use a persistent invocation handle. Before retrying, query the invocation/session,
recover results, settle descendants and establish that no invocation for this
reviewer/revision remains active. Unknown state suspends the lane. Each retry gets
a new handle and receipt.

An unavailable explicitly selected second-model reviewer permits at most one
diagnostic fresh-context round. Keep its frozen identity, use
`reviewer_role: diagnostic`, `independence_level: fresh-context`, and link
`diagnostic_for_invocation_id` to its earlier FAILED or TIMED-OUT required invocation.
The diagnostic never substitutes for that reviewer. Suspend the lane unless it
recovers with a later second-model complete GO on the current revision.

## Helper Agents

A helper needs a pre-declared, non-overlapping evidence lane that does not repeat
the parent reviewer's source inspection. It supplies evidence, not a required
reviewer's verdict. Count its usage exactly once in that round's receipt.

## Reviewer Return

```text
revision: <hash>
review_kind: blocker-sweep | complete
verdict: GO | CONDITIONAL-GO | NO-GO
coverage: {rubric_dimensions: [...], severities: [...]}
blockers: [{id, claim, evidence, affected_section}]
should_fix: [{id, claim, evidence, affected_section}]
optional: [{id, claim, evidence, affected_section}]
verification_gap: [{id, claim, missing_check, affected_section,
                    gap_scope, gap_scope_reason}]
```

A complete return covers every frozen rubric dimension and all four severities.
A blocker sweep covers the rubric with blocker and verification-gap severities
only. Each gap states `gap_scope: decision_blocking | outside_closing_scope` and
an evidence-backed reason. The parent preserves reviewer-returned payloads and
coverage; GO may have empty finding arrays, while non-GO needs a finding.

## Focused Recheck

A focused recheck can close findings between revisions, never the gate. It needs
finding-contained edits; unchanged goal, constraints, rubric, risk, dependencies,
permissions and public interfaces; before/after hashes and cross-impact statement;
and reviewer confirmation that the edit stayed within that scope. Uncertainty or
cross-cutting impact requires a complete review.

## Round Receipt

Record one receipt immediately after each attempt, before parent validation,
including failed, timed-out, cancelled and discarded attempts. Take the fields and
closed vocabularies from `round_receipts` in
[review-ledger-schema.json](review-ledger-schema.json), not a copied field list.

Prefer runtime counters. Otherwise measure exact submitted/returned characters
and elapsed wall-clock; use non-negative deltas for cumulative counters. The six
caller-observable measurements are required; unavailable provider telemetry is not
zero and cannot erase them. Provider token categories are optional. Show per-round
revision, kind, runtime/model, verdict, calls, input/output characters, wall time,
sessions, retries and measurement precision.

## Review-Ledger Checker

The schema owns field types and vocabularies. Keep its collection fields explicit
arrays and maintain these relationships:

- `attempted_invocations` and `round_receipts` match one-to-one. Returned GO,
  CONDITIONAL-GO and NO-GO receipts each have one `round_reports` manifest with
  matching invocation, revision, verdict and kind, `reviewer_output_disclosed: true`,
  complete finding IDs/payloads and reviewer-returned coverage.
- Each payload maps to one ledger finding and back through `source_invocation_id`.
  Key each record by (`source_invocation_id`, `id`); preserve repeated IDs and
  each round's original payload.
  Keep its claim, evidence, affected section, severity and gap scope intact;
  store parent validation and `parent_validation_disclosed: true` separately.
- `final_reviewer_verdicts` contains exactly one current complete GO per required
  reviewer, bound to its required receipt and full-rubric/all-severity report.
  Older and intermediate verdicts stay in receipt history. Full-depth closing
  receipts use distinct session handles. An explicitly selected second-model
  reviewer closes in that class; a diagnostic cannot close for it.
- Preserve the frozen author, depth, reviewer classes, rubric and resolved budget.
  A stronger independence lane is acceptable. Legacy `second_model_availability`
  does not decide the gate.

Run `node <skill>/scripts/validate-review-ledger.cjs <ledger.json>` or pipe the
ledger to stdin. It prints `{ "pass": boolean, "failures": [...] }`, exits zero
only on a pass, and checks structure and links rather than the truth of evidence.

## Verification Gap Closure

Keep the original payload, revision, source invocation and gap scope unchanged.
Update owner, validation/evidence, disposition and closed state separately.
Resolution uses `confirmed` + `fix` for supplied evidence, or `challenged` +
`rebut` with `reviewer_rebuttal_accepted: true`. Either needs a later complete GO
from the originating reviewer on the current revision, with its receipt after the
original gap. Evidence alone can leave the candidate hash unchanged; a candidate
edit cannot. Parent validation establishes what the resolving evidence proves.

An unresolved `outside_closing_scope` gap may instead use `confirmed`, `defer-gap`,
owner, next check and `closed: true`. This closes its disposition only: report the
remaining evidence limitation. Decision-blocking gaps cannot be deferred into GO.
