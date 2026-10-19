---
name: tekton
description: >
  Use for 实施 / 实现 / 修复 / 改进 / 重构 / 迁移 / 落地 work on code that already
  has callers, stored data, or tests to keep working: extraction, consolidation,
  or ownership moves of a rule, constant, or value domain (magic values,
  divergent copies of one rule); schema, API, protocol, or data migrations;
  removing, merging, or relaxing a validation or guard; edits that reach more
  than one module or a published interface; landing a design document or
  adjudicated plan — even when the user only says 改一下. Delivers the change
  with evidence that affected contracts hold.
---

# Tekton — Contract-Preserving Implementation

Deliver the requested behavior and structural improvement with evidence that
affected contracts hold. Work in verifiable slices; add records or design
comparison only when they resolve a concrete decision or risk.

## Establish the contract

Identify the requested outcome, what must remain true, and the evidence that
could distinguish a plausible wrong implementation. Separate requirements from
characterization: existing behavior can guide preservation, while a bug fix
needs an expectation independent of the defect. When exact values are unavailable,
use a justified invariant, comparison or replay.

Trace the affected entry points through decisions, state changes and effects
to their consumers. Inspect the boundaries that establish identity, order,
precision and scope. Include retained guards and fallbacks whose inputs change.
Resolve assumptions that could make the next slice wrong; defer unrelated
investigation. When reachability alone cannot settle a deciding premise,
observe the relevant path in a focused run.

Preserve observation points whose freshness can change the next decision.
Preview evidence does not establish the effectful path, and an earlier
observation does not replace required enforcement at the effect boundary.

For a guard added, removed, narrowed or moved, establish the obligation and its
owner. Reuse upstream invariants; a new defense needs a reachable failure the
owning boundary does not already exclude. Investigate technical facts directly;
ask for missing user intent or authority while continuing independent work.

A local change needs only a brief account. Keep a compact contract/evidence/gap
record when several flows or release stages make it useful. When scratch files
are needed, use `.scratch/YYYYMMDD-task-name/` in the user's timezone, reuse it
on resumption, and honor an explicit output path.

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

Use the smallest surface that decides the claim. Derive assertions from the
contract and confirm that they execute the real relevant logic and observe its
result. Add or strengthen a test for a missing case that matters; routine
reversible edits need no new test that repeats the implementation.

Select checks for the actual risks: committed effects and recovery, repeated
execution, controlled concurrency, or old/new callers and stored data. A local
result reaches an end-to-end conclusion only if intervening boundaries preserve
its assumptions; check the first missing connection or leave that claim open.

A defect closes where it was reproduced: establish failure before and success
after through the same entry, inputs and environment, using
`docs/verify/HARNESS.md` when present. A different surface, a unit test alone,
or an inconclusive run leaves the original defect open. A check passing both
versions may protect behavior without reproducing the defect. Keep unavailable
or intermittent reproduction explicit; revert a change whose motivating
hypothesis the evidence refutes, preserving concurrent work.

Use targeted mutation or fault injection when a plausible critical mistake
could escape the selected checks, especially after guard changes. Before using
one of these techniques, read its branch below. Mere compile failure or harness
failure is not evidence that a behavioral oracle detected the intended defect.

Obtain independent review when the task or repository requires it, or for changes
to concurrency, authorization, data spanning versions, hard-to-recover effects,
or deletion/consolidation of a shared guard. Follow governing delegation and model
authorization. Use the named reviewer's protocol; if using installed
[euthyna](../euthyna/SKILL.md#enter-a-fresh-review-context), read its caller
instructions before dispatch or remediation. No sibling skill is required.
Unavailable required review leaves acceptance open; other work is self-reviewed.

Reuse evidence only while its relevant source, inputs and environment remain
applicable. Rerun invalidated checks and required repository gates on the final
version. If a finding refutes an evidence claim, rederive claims of the same kind
in the slice. Test a suspected shared cause before repairing several defects;
validate each finding against the repair and keep independent defects separate.

## Load branch details when needed

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

Check the final diff for scope and unintended changes. Report the requested
outcome, decisive checks and material gaps in the user's language; prose can
suffice. Judge behavior, structure and cost separately. Explain structural gains
in rule ownership, caller knowledge or coordinated edit points; for migration,
close the removal target or name the remaining stage and exit condition.

Bind verification and any required completed review to the final material
revision, with findings dispositioned. Keep failed checks classified as
introduced, pre-existing or environmental. An essential missing check or review
leaves the affected acceptance claim open; report implementation and local
verification separately, and continue work independent of the blocker.
