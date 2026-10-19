---
name: dokimasia
description: >
  Falsify one completed design or plan through independent review, iterating on
  the exact final revision when revision is requested. Use on an explicit review
  ask: 审查到通过 / 方案评审 / 计划评审 / 证伪现有方案, or a second-model review
  before implementation.
---

# Dokimasia — Plan Review

Falsify one completed design, plan, or proposed artifact. A plain review is
`review_mode: review-only`: inspect and report, keeping the candidate unchanged.
An explicit request to revise or review until passing selects
`review-and-revise` and authorizes edits only to that candidate. Product
implementation remains outside this skill.

## Entry Gate

Default to `review_scope: correctness-only`. Record any upstream investment
decision as context; its absence or a non-BUILD decision does not block technical
review or require confirmation. Technical GO grants no implementation authority.

Use `implementation-authorization` scope only when explicitly requested. Consume
the existing upstream BUILD decision or the user's explicit decision to build;
ask only for a missing user-owned decision. Without it, report NOT_READY, or
DEFERRED for a standing non-BUILD decision. Read
[the decision envelope and entry states](REFERENCE.md#decision-envelope-and-entry-states)
for that branch. If no candidate exists, obtain one before review.

## Exact Gate

Before dispatch, freeze:

- candidate and content hash; versions or recoverable snapshots of material
  authority sources;
- mode, scope, constraints, any applicable upstream decision, and rubric;
- author identity, depth and its basis, required reviewers and their independence
  classes; at full depth, the reviewer assigned the operator-on-call walk;
- resolved budget and a ledger for attempts, results, validations and dispositions.

Required reviewers use read-only fresh contexts; the author cannot be one.
Shallow depth needs one reviewer and is eligible only for a reversible plan with
no data-destruction, external-interface, permission or funds path. Otherwise,
including uncertain eligibility, use full depth with at least two distinct
reviewer sessions and separate briefs. A second model joins only on the user's
explicit request; freeze that selection as the reviewer's class.

Resolve the budget from the user's limit, a calibrated default, or explicitly
user-authorized `unbounded`. A bounded budget records its observable unit,
positive threshold and basis. Calibrate depth, expected rounds and default budget
from irreversibility, blast radius and value; check that the budget can cover the
candidate. Missing budget never means unbounded.

The rubric covers coherence, feasibility, compatibility, migration/rollback,
verification and scope. Add dimensions for claims these do not reach, such as
source fidelity or inventory completeness. Existing-system claims need authority
evidence or become verification gaps. At full depth, one reviewer first walks
the candidate as the operator shipping it tonight and owning failure and rollback,
then performs the full-rubric review.

GO requires all of the following:

```text
every required reviewer returned a complete GO on the same current revision
open blockers = 0; open should-fix findings = 0; unvalidated findings = 0
every optional finding has a disposition
verification gaps satisfy their closure or outside-scope deferral contract
active reviewer invocations = 0; no material change after those reviews
```

A material candidate edit invalidates prior GO. Changed authority evidence
invalidates affected conclusions even if the candidate hash is unchanged.
Post-GO translations or reformats are `derived-unreviewed` unless byte-identical.

## Evidence Loop

### Review

Give each first-pass reviewer the candidate, constraints, rubric and evidence
scope, without the author's reasoning. The reviewer returns in-band and writes
neither the candidate nor review records. Self-rereading cannot satisfy the gate.
Use [the compact packet](REFERENCE.md#compact-review-packet) for long or remote
transfer and [invocation handling](REFERENCE.md#runtime-and-invocation) for
runtime binding, retries, unavailable reviewers or helper agents.

Default to a complete review of every frozen dimension and all severities,
including findings beyond the first blocker. Only review-and-revise may use the
optional [blocker sweep](REVISION.md#blocker-sweep) before that complete review.
Return [the reviewer payload](REFERENCE.md#reviewer-return) with stable finding IDs
and explicit coverage; the parent preserves these fields without inferring or
upgrading them.

Trace guarantees through the assumptions each boundary must preserve. A local
check proves only its own premises; missing connections are verification gaps.
Judge claims and rebuttals under the same execution context, preconditions,
policy scope and authority priority. Contradictory failure, partial-success or
fallback outcomes for the same condition remain a blocker until authority settles
the behavior.

Use one finding per independently actionable root cause. Merge symptoms sharing
evidence, owner and remediation, retaining affected sections and the highest
severity. Split when owner, remediation or disposition can differ; group gaps by
missing authority and next check. Classify by consequence, independently of cost:

- `blocker`: unsafe, wrong, unexecutable or unverifiable result;
- `should-fix`: material execution, compatibility, migration/rollback,
  acceptance-evidence or decision defect;
- `optional`: non-material wording, readability, precision or convenience;
- `verification_gap`: missing evidence, with its missing check, scope and reason.

### Disclose and validate

Immediately after every attempted invocation, record its
[round receipt](REFERENCE.md#round-receipt), including failures. Before remediation,
disclose the complete verdict and every finding with ID, severity, claim, evidence,
affected section and any missing check. Use a linked complete report when too long
for chat; counts or summaries do not replace it.

The parent independently validates the whole round in one evidence pass against
the frozen candidate, rubric and authority. Disclose one `confirmed`, `challenged`
or `needs_evidence` result per finding, with `parent_evidence_and_reason`; preserve
the reviewer's claim separately. A challenge stays open until the reviewer accepts
the evidence-backed rebuttal. Missing evidence stays open or becomes a named gap.
When a rebuttal adds no evidence or narrows no disagreement, preserve both claims
and suspend the disputed gate.

Assign each finding an owner and disposition: `fix`, `rebut`, `accept-risk`
(optional only), `defer-gap` (outside closing scope, owner and next check), or
`needs-input`. A proposed remedy is not an applied fix. Preserve original gap
payloads and follow [gap closure](REFERENCE.md#verification-gap-closure) when
resolving or deferring one.

Review-only ends with the complete validated review and proposed remedies:
NO_GO for confirmed material defects, SUSPENDED for undecidable correctness,
or GO through the Exact Gate. It can settle non-editing dispositions without
changing the candidate. For authorized revisions, read
[REVISION.md](REVISION.md) before editing or scheduling another revision round.

### Close or continue

Suspend for an unavailable required reviewer, unresolved disagreement, exhausted
budget, required user input, or an invalidated implementation-authorization
envelope. Withdrawal is not a pass. Review-and-revise's additional continuation
and stopping rules live in [REVISION.md](REVISION.md#re-review-and-stop).

Before reporting GO, run `node <skill>/scripts/validate-review-ledger.cjs <ledger>`
when Node is available. This mechanical check supplements parent validation and
reviewer judgment. Restart all required closing reviews after a late material edit.

Every delivery includes the exact final revision, reviewers and independence,
rounds and per-round model/cost, complete findings and parent validations,
dispositions, remaining gaps and next action. Choose chat or saved records under
[Review Artifacts](REFERENCE.md#review-artifacts). Report both closed-vocabulary
tracks, with prose qualifications kept separate:

```text
technical_verdict: GO | NO_GO | SUSPENDED | NONE
implementation_decision: BUILD | DEFER | NO_BUILD | UNCHANGED
```

Correctness-only always uses `UNCHANGED`, naming the standing decision or its
absence. Authorization scope reports only a still-valid frozen decision; after
invalidation use `UNCHANGED` and leave that gate unpassed pending renewal.
`NONE` means review was not entered (NOT_READY or DEFERRED) or was WITHDRAWN.
Budget exhaustion, deferral and withdrawal never establish technical GO.
