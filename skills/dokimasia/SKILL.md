---
name: dokimasia
description: >
  Falsify one completed design or plan through independent review, iterating on
  the exact final revision when revision is requested. Use on an explicit review
  ask: 审查到通过 / 方案评审 / 计划评审 / 证伪现有方案, or a second-model review
  before implementation.
---

# Dokimasia — Plan Review

Falsify one completed candidate — a design, plan, or artifact describing what
will be built and how. A plain review request authorizes inspection and reporting;
keep the candidate unchanged. When the user asks to revise, fix findings, or
review until passing, edit only the named candidate and iterate within the
resolved budget. Product implementation remains outside this skill.

Record `review_mode: review-only | review-and-revise` separately from review
scope. Review-only ends after the complete review and parent validation with
GO, NO_GO, or SUSPENDED plus actionable findings. It does not require findings to
be fixed before reporting NO_GO. Review-and-revise uses the correction loop
below; neither mode can report GO without satisfying the Exact Gate.

## Entry Gate

Review the named candidate on its technical merits. Default to
`review_scope: correctness-only`; missing or non-BUILD investment decisions do
not prevent technical review and require no confirmation. Preserve any upstream
decision as context. Technical GO grants no implementation authorization.

Use `review_scope: implementation-authorization` only when the user explicitly
asks for that gate. It requires a still-valid upstream BUILD decision or the
user's existing explicit decision to build. Reuse that authorization; ask only
if this requested gate lacks a user-owned decision. Without it, report NOT_READY
(or DEFERRED for a standing non-BUILD decision); do not invent BUILD.
See [entry states](REFERENCE.md#decision-envelope-and-entry-states).

Every closing report separates two tracks:

```text
technical_verdict: GO | NO_GO | SUSPENDED | NONE
implementation_decision: BUILD | DEFER | NO_BUILD | UNCHANGED
```

`GO` states only that the exact current revision passed complete review; it
carries no implementation priority or investment advice. `NONE` records that
no closing technical verdict exists: the loop was not entered (`NOT_READY`,
`DEFERRED`) or the user withdrew the review (`WITHDRAWN`). Correctness-only scope always reports
`implementation_decision: UNCHANGED`, naming any standing decision or its
absence. Authorization scope reports only a still-valid frozen decision;
after envelope invalidation it reports UNCHANGED and explicitly leaves the
authorization gate unpassed until the user or upstream decision is renewed.
Both tracks always carry exactly one of their listed
tokens; prose may qualify a token, never replace it. A `DEFERRED`,
`WITHDRAWN`, or exhausted-budget outcome is never a technical pass.

## Exact Gate

Freeze before dispatch. Required reviewers run in read-only fresh contexts.
Depth sets how many: shallow depth needs one; full depth needs at least two,
each in its own session with its own brief, because independent reads catch
different failures. A second-model reviewer joins only on the user's explicit
request, at any depth, and is then frozen as that reviewer's class. Freeze:

- the exact candidate and content hash;
- the review scope and any upstream decision resolved by the Entry Gate;
- author identity; required reviewers, their frozen classes, explicit
  second-model selections, which reviewer holds the operator-on-call walk at
  full depth, and depth;
- rubric, authority evidence, constraints, and the resolved budget;
- a ledger for rounds, findings, parent validations, and dispositions.

Resolve the budget at freeze to exactly one source: the user's explicit budget,
a calibrated default, or user-authorized `unbounded`.
Calibrate a default from the same irreversibility, blast-radius, and value
basis as depth. For a bounded budget, record its observable unit, threshold,
and basis. Units can be reviewer invocations, wall-clock, or output volume.
A missing budget never means `unbounded`.
The gate in `scripts/validate-review-ledger.cjs` fails closed without this record.

Compare the resolved budget with required coverage and the candidate's claim
surface. Resolve an inadequate budget before dispatch.

Calibrate review depth and expected rounds from irreversibility and blast radius,
and record that basis here at freeze time. Shallow depth is eligible only when
the plan is reversible and has no data-destruction,
external-interface, permission, or funds path: at least one review round.
Otherwise use full depth. When eligibility is uncertain or
contested, use full depth. Depth changes who must review, never what counts as
a pass; the gate below is identical at every depth.

The gate passes only when:

```text
all required reviewers returned GO on the same current revision
and open blockers = 0
and open should-fix findings = 0
and unvalidated findings = 0
and every optional finding has a recorded disposition
and active reviewer invocations = 0
and no material change happened after those reviews
```

The default rubric covers coherence, feasibility, compatibility,
migration/rollback, verification, and scope. Add candidate-specific dimensions
whenever the candidate carries claims the default six do not reach — fidelity to
a source record it transcribes, completeness against an upstream inventory it
compiles — and freeze them with the rest; a claim no rubric dimension names is a
claim no reviewer is asked to attack. Existing-system claims require an authority
source or become verification gaps.

At full depth, one required reviewer reads as the **operator on call** — the
change shipped this evening, they own it through the night and execute the
rollback if it goes wrong — walking the candidate from that scenario before,
never instead of, the full-rubric pass. The walk decides where that reviewer
looks first; it never narrows what any reviewer must report, and the other
reviewers read with the full rubric alone.

Set severity from consequence, independently of review cost:

- `blocker`: could make the result unsafe, wrong, unexecutable, or unverifiable.
- `should-fix`: materially changes execution behavior, compatibility,
  migration/rollback, acceptance evidence, or a key decision.
- `optional`: wording, non-material precision, readability, or convenience.

In review-and-revise mode, withdraw or suspend when a confirmed blocker or
should-fix is no longer worth fixing. That outcome is not GO.
Review-only may finish with NO_GO and the validated finding.

## Evidence Loop

### 1. Freeze

Apply the Exact Gate's freeze contract to the named candidate before dispatch.
If no candidate exists, obtain one through the appropriate planning workflow
before reviewing. Authorization scope additionally freezes the BUILD envelope.

Keep review records outside the candidate. A material edit creates a new
revision and invalidates every prior GO. Pin the versions or snapshots of
authority sources used for material claims too; changes to those sources
invalidate affected conclusions even when the candidate hash is unchanged. A post-GO translation or reformat is
`derived-unreviewed` unless byte-identical.
Choose in-band or saved delivery using
[Review artifacts](REFERENCE.md#review-artifacts); saving records does not
authorize editing the candidate.

For long or remote transfer, read
[REFERENCE.md](REFERENCE.md#compact-review-packet).

Completion: every reviewer can access the same exact revision and gate contract.

### 2. Review

Dispatch each required reviewer exactly as frozen by the Exact Gate. The author
is not an independent reviewer. For an unavailable explicitly selected
second-model reviewer, one diagnostic fresh-context round is allowed; then
suspend rather than repeatedly pre-converge.

A self-reread may prepare the packet but cannot satisfy the gate.

The reviewer returns its verdict in-band and must not create, edit, or overwrite
the candidate or review records. Helper agents default to zero. Runtime binding,
helper limits, and retry recovery are in
[REFERENCE.md](REFERENCE.md#runtime-and-invocation).

Give a first-pass reviewer only the candidate, constraints, rubric, and evidence
scope. In review-only mode, run a complete review across all rubric dimensions
and severities, even when a blocker is found early. In review-and-revise mode,
also default to a complete review; for a large candidate with unresolved
foundational assumptions or many interacting failure paths, a blocker sweep
may precede it. Record why separating that sweep will improve the review. The sweep examines
blockers and verification gaps exhaustively, deferring independent should-fix
and optional findings. Give every finding a stable ID.
Trace a system guarantee through the assumptions each boundary must preserve;
leave missing connections as verification gaps. A local check closes only the
premises it establishes. Judge claims and rebuttals under the same execution
context, preconditions, policy scope and authority priority. Incompatible
failure, partial-success or fallback outcomes for the same missing or invalid
condition remain one blocker until authority selects the behavior.

Use one finding per independently actionable root cause. Merge downstream
symptoms that share the same evidence, owner, and remediation; list those
affected sections and consequences inside that finding. Split only when the
owner, remediation, or disposition can differ. Consolidate verification gaps by
missing authority source and next check. Exhaustive means every root cause is
represented, not every symptom is duplicated. A merged finding inherits the
highest severity of any consequence it contains; consolidation never lowers a
gate.

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

For a blocker sweep, coverage lists the inspected rubric dimensions and the two
active severities. A complete review lists every frozen rubric dimension and all
four severities. The parent copies these reviewer-returned fields into the round
report; it does not infer or upgrade coverage or gap scope.

When an optional blocker sweep returns no blocker or decision-blocking verification gap,
run a complete review on that same revision across every rubric dimension and
severity. Only a complete review may return the closing GO.

Completion: a complete all-severity result, an intermediate blocker-sweep result, or an explicit availability/permission
failure is recorded for the attempted invocation.

### 3. Disclose And Validate

Immediately after every attempted review, record one round receipt containing
the runtime/model and observable cost. Read
[REFERENCE.md](REFERENCE.md#round-receipt) for the compact schema. The six
caller-observable measurements are required; missing provider-only telemetry is
unavailable, never zero.

Before remediation, show the user the reviewer's complete verdict and every
finding: stable ID, severity, claim, evidence, affected section, and missing
check where applicable. Never replace this round output with counts or a
summary. If chat length is impractical, archive the complete report under the
[artifact rules](REFERENCE.md#review-artifacts) and link it before continuing.

Then the parent validates every finding independently, validating the whole
round in one evidence pass against the frozen candidate, rubric, and authority
sources:

```text
finding_id
parent_validation: confirmed | challenged | needs_evidence
parent_evidence_and_reason
```

Show one parent-validation result for every finding. Preserve reviewer claims
separately. A challenged finding remains open until the reviewer accepts the
evidence-backed rebuttal; `needs_evidence` remains open or becomes a named
verification gap. If a rebuttal produces no new evidence or narrowing of the
disagreement, preserve both claims and suspend the disputed gate rather than
repeat persuasion. The parent cannot turn unresolved disagreement into GO.

Completion: every finding has exactly one disclosed validation record backed by
concrete evidence or a named missing-evidence check.

### 4. Adjudicate And Revise

In both modes, give findings an owner and record their disposition. Keep
unresolved findings open; proposing a remedy does not mean applying it.
Disposition choices for closing findings are:

- `fix`: revise the candidate;
- `rebut`: return concrete contrary evidence to the reviewer;
- `accept-risk`: optional findings only;
- `defer-gap`: verification gaps outside closing scope, with owner and next check;
- `needs-input`: a missing user decision or authority source.

In review-only mode, complete non-editing dispositions such as optional
`accept-risk`, an evidence-backed rebuttal, or an outside-scope `defer-gap`.
Report GO only after the Exact Gate below passes; report NO_GO for confirmed
material defects or SUSPENDED when correctness remains undecidable. Include
proposed remedies and all open findings without changing the candidate.
In review-and-revise mode, read [REVISION.md](REVISION.md) before editing
the candidate or scheduling another revision round.

For a resolved verification gap, preserve its original payload and scope.
Record the resolving evidence or rebuttal in the parent validation. Use `fix`
for supplied evidence or `rebut` for a reviewer-accepted challenge.
Close the gap only after the originating reviewer gives a later complete GO on
the current revision. Evidence-only resolution may keep the candidate hash;
changes to the candidate still require a new revision. See
[gap closure](REFERENCE.md#verification-gap-closure).

### 5. Close Or Continue

Within the resolved budget, new or narrowing findings are progress and continue
the loop. Each continued round also requires an active request for this review
and an expectation that the next round closes a gate-blocking finding or changes
the technical or implementation decision. A bare round count outside the frozen
budget never closes or suspends the gate. An expiring frozen budget is a budget
event, not a round count.

Suspend when any of these conditions holds:

- A required reviewer remains unavailable.
- Reviewers disagree.
- The same blocker survives three consecutive revisions.
- The budget expires.
- In implementation-authorization scope, the authorization envelope is invalidated.
- User input is required.

If continuing is no longer justified while the gate is unpassed, report
`SUSPENDED` or `WITHDRAWN`, never a pass.

Before reporting GO in either mode, apply the Exact Gate mechanically with
`scripts/validate-review-ledger.cjs` when Node is available. Report the two-track
outcome (technical verdict and implementation decision), the final revision,
reviewers and independence level, rounds, finding dispositions, remaining
verification gaps, and each round's model plus observable cost.

Restart all required reviews when a late material edit changes the passed
revision. There is no approximate pass.

Completion: review-only delivers a complete validated review (GO only through
the Exact Gate); review-and-revise passes that gate or suspends with the last revision,
open findings, evidence limitation, and exact next action preserved.
