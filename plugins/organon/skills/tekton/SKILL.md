---
name: tekton
description: >
  Use for 实施 / 实现 / 修复 / 改进 / 重构 / 迁移 / 落地 work on new or existing
  code without breaking the callers, stored data, or tests it reaches: new
  features and modules; extraction, consolidation, or ownership moves of a rule,
  constant, or value domain (magic values, divergent copies of one rule);
  schema, API, protocol, or data migrations; adding, removing, merging, or
  relaxing a validation or guard; edits that reach more than one module or a
  published interface; landing a design document or adjudicated plan — even
  when the user only says 改一下. Delivers the change with evidence that
  affected contracts hold.
---

# Tekton — Contract-Preserving Implementation

Deliver the requested behavior and structural improvement with evidence that
affected contracts hold. Work in verifiable slices; add records or design
comparison only when they resolve a concrete decision or risk.

## Establish the contract

Identify the requested outcome, preserved contracts and evidence that would
distinguish a plausible wrong implementation. Characterization supports
preservation; a bug fix needs an expectation independent of the defect. Use a
justified invariant, comparison or replay when exact values are unavailable.

Trace the affected entry points through decisions, state changes and effects
to their consumers. Inspect the boundaries that establish identity, order,
precision and scope. Include retained guards and fallbacks whose inputs change.
Resolve assumptions that could make the next slice wrong; defer unrelated
investigation. When reachability alone cannot settle a deciding premise,
observe the relevant path in a focused run.

Preserve observation points whose freshness can change the next decision.
Preview evidence does not establish the effectful path, and an earlier
observation does not replace required enforcement at the effect boundary.

Before adding, removing, narrowing or moving a guard (a null/empty, duplicate,
range or state check, a cross-store equality, a fail-closed branch), establish
its real entry, owner and oracle:

- **Real entry:** the production path that delivers the illegal shape. A value
  that could theoretically be absent, or that a sample happens to lack, is not an
  entry; a model, database or upstream constraint may already exclude it.
- **Owner:** the database, model or constructor, input boundary or module that
  owns the invariant. Establish which operations the guard can reject or skip
  and which obligations remain on either branch. Reuse an invariant upstream
  already establishes. When a guard only keeps parallel maps, parameters or
  indexes consistent, merge them
  into one type so the contradiction cannot be expressed. Keep backfill,
  migration and repair equalities in SQL, deployment checks or a one-off gate,
  off the business path.
- **Oracle:** a production-reachable case whose test fails when the guard is
  removed or returns the wrong error code. Removing or relaxing a guard needs the
  inverse: the entry is gone or the owner enforces the rule, and the owning test
  still passes on the required behavior.

Remove a guard that lacks these answers, or reshape the interface instead.
Report the answers for each kept guard; one that can be neither justified nor
removed goes to the user's decision, including a guard the user asked for.
Investigate technical facts directly; ask for missing user intent or authority
while continuing independent work.

Put needed scratch files in `.scratch/YYYYMMDD-task-name/` in the user's timezone;
reuse the folder on resumption and honor an explicit output path.

## Implement coherent slices

Give each rule one authoritative home. Keep business subjects, relationships
and required dependencies recognizable in executable structure. Trace reused
helpers through their implementations; matching output shapes alone do not
establish those relationships. Preserve confirmed structural choices and compare
alternatives only for an unsettled, material decision.

Hide coherent complexity behind a small interface. Dependencies lead toward
the rule owner; adapters translate at that boundary. Add a seam for demonstrated
variation, isolation or migration, and justify retained state by its owner,
lifetime and need. Separate modules or intermediate values need an ownership,
validity or cost reason. Logical dependencies and observable order constrain
physical execution without prescribing incidental syntax.

Choose a slice with an observable result and keep reachable intermediate states
valid for callers and data. Distinguish preserved behavior from intentional
semantic change. Move behavioral cases with the behavior; retire old-internal
assertions after equivalent coverage exists at the relevant interface.

After each meaningful slice, inspect the diff and run focused verification.
A newly affected contract expands the scope before earlier evidence is reused.
For structural work, verify the actual ownership and caller obligations as well
as values; names and comments do not establish the requested improvement.

## Verify the affected properties

Derive checks from the user's outcome and governing contracts; proposed control
flow is a candidate, not the oracle. When conditions interact, use a combined
case that distinguishes their scopes and exposes required work skipped by an
early exit. Use the smallest surface that exercises the relevant logic and
observes its result. Add or strengthen a test for a missing case; routine
reversible edits need no new test that repeats the implementation.

Select tests by changed contracts and their callers and dependencies. Run the
narrowest set covering the affected behavior, integrations and configuration.
Include committed effects, recovery, repeated execution, concurrency and
version/data compatibility where affected. Keep that scope for final verification;
expand only for an explicit repository gate or a concrete coverage or diagnostic
need. A repository's default full-suite command alone does not establish that need.
For work spanning boundaries, verify the requested outcome at its final consumer
after the change. A successful intermediate command or acknowledgement establishes
only that step. Continue the remaining authorized work; when a needed capability,
access or user decision is unavailable, report completed and open parts separately,
with the missing connection and next action.

A defect closes where it was reproduced: establish failure before and success
after through the same entry, inputs and environment, using
`docs/verify/HARNESS.md` when present. A different surface, a unit test alone,
or an inconclusive run leaves the original defect open. A check passing both
versions may protect behavior without reproducing the defect. Keep unavailable
or intermittent reproduction explicit; revert a change whose motivating
hypothesis the evidence refutes, preserving concurrent work.

Use targeted mutation or fault injection when a plausible critical mistake
could escape the selected checks, especially after guard changes; read its
branch below before selecting a fault.

Obtain independent review when the task or repository requires it, or for changes
to concurrency, authorization, data spanning versions, hard-to-recover effects,
or deletion/consolidation of a shared guard. Follow governing delegation and model
authorization. Use the named reviewer's protocol; if using installed
[euthyna](../euthyna/SKILL.md#enter-a-fresh-review-context), read its caller
instructions before dispatch or remediation. No sibling skill is required.
Unavailable required review leaves acceptance open; other work is self-reviewed.

Reuse evidence only while its relevant source, inputs and environment remain
applicable. Rerun invalidated checks and follow the repository's final-version
gate rules. Once a failed run establishes a pre-existing or environmental blocker,
reuse its receipt and keep that gate open. Retry when inputs relevant to the failure
change, or when the run can distinguish a concrete new diagnostic hypothesis.
Use a proven focused entry for independent claims; its success does not pass the
blocked gate. Rederive claims of the same kind when a finding refutes one.
Test a suspected shared cause before repairing several defects, then validate
each finding against the repair; keep independent defects separate.

## Load branch details when needed

- **Writing or changing a test:** read
  [Writing tests](references/VERIFICATION.md#writing-tests) before writing it.
- **Structural refactoring:** read [Refactoring](references/REFACTORING.md) before
  choosing the transition. For compatibility/data migration alone, start at
  [Choose the transition](references/REFACTORING.md#choose-the-transition).
- **Structural assertions or deciding test doubles:** read
  [Checking the oracle](references/VERIFICATION.md#checking-the-oracle).
- **Mutation or fault injection:** read
  [Targeted mutation](references/VERIFICATION.md#targeted-mutation-and-fault-injection)
  before selecting or applying a fault.
- **Performance work:** inspect operation counts, sharing scope, invalidation and
  retained state on effectful and no-effect paths at relevant scale. Reuse may
  change cost only within its valid observation scope. Before reporting measured
  numbers, read [Measured numbers](references/VERIFICATION.md#measured-numbers).
- **Diagrams or interactive views:** before delivering one, read
  [Derived views](references/DERIVED-VIEWS.md).

## Close the requested outcomes

Check the final diff for scope and unintended changes. Report outcomes, decisive
checks and material gaps in the user's language. Judge behavior, structure and
cost separately. Explain structural gains in rule ownership, caller knowledge
or coordinated edit points; name any remaining migration stage and exit condition.

Bind verification and required review, with findings dispositioned, to the final
material revision. Classify failed checks as introduced, pre-existing or
environmental. A missing essential check or required review leaves the affected
acceptance open; report what is implemented and locally verified, and continue
independent work.
