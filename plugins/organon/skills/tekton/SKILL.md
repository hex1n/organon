---
name: tekton
description: >
  Use for 实施 / 实现 / 修复 / 改进 / 重构 / 迁移 / 落地 work on new or existing
  code without breaking the callers, stored data, or tests it reaches, including
  short change asks (改成 / 加个 / 补一个 / 改名): new features, fields and
  modules; extraction, consolidation, or ownership moves of a rule, constant, or
  value domain (magic values, divergent copies of one rule); schema, API,
  protocol, or data migrations; adding, removing, merging, or relaxing a
  validation or guard; edits that reach more than one module or a published
  interface; landing a design document or adjudicated plan — even when the user
  only says 改一下. Start here before searching the code for the change. Delivers
  the change with evidence that affected contracts hold.
---

# Tekton — Contract-Preserving Implementation

Deliver the requested behavior and structural improvement with evidence that
affected contracts hold. Add records or design comparison only when they
resolve a concrete decision or risk.

## Establish the contract

Identify the requested outcome, preserved contracts and evidence that would
distinguish a plausible wrong implementation. Characterization supports
preservation; a bug fix needs an expectation independent of the defect. Before
fixing a defect, read [Closing a defect](references/EVIDENCE.md#closing-a-defect);
it closes where it was reproduced. Use a
justified invariant, comparison or replay when exact values are unavailable.
For a replaced entry, the oracle is what the old entry sends and does,
captured first, not a declared type; the new entry declares its own inputs and
outputs as specifically as the old one did.

Name the footprint before editing: what the request changes and what code stays
untouched (existing entries, published interfaces, shared build and run
configuration; verification-only needs stay out of it). An edit outside it, or
an interpretation that changes scope, observable behavior or operating
responsibilities, is the user's decision: raise it with basis and consequence
first. When the user corrects one such decision, apply the correction to every
decision of the same kind in this task, not only the instance raised.

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
range or state check, a cross-store equality, a fail-closed branch), read
[Guards](references/GUARDS.md): each guard needs a real entry, an owner and an
oracle.

Put needed scratch files in `.scratch/YYYYMMDD-task-name/` in the user's timezone;
reuse the folder on resumption and honor an explicit output path.

## Implement coherent slices

Within the footprint, give each rule one authoritative home; a home that needs
code outside it is a proposal. Keep business subjects, relationships
and required dependencies recognizable in executable structure. Trace reused
helpers through their implementations; matching output shapes alone do not
establish those relationships.

When moving a rule leaves an old entry point for callers that cannot move yet,
record in the task folder `.scratch/YYYYMMDD-task-name/` the entry point, its
owner, its removal condition and the evidence that removal is safe, then read
[Refactoring](references/REFACTORING.md) before choosing how callers move. For
any other moving, merging or splitting of existing code, or a compatibility or
data migration, read the same file first.

Hide coherent complexity behind a small interface. Dependencies lead toward
the rule owner; adapters translate at that boundary. Do a job the way the
project, or the reference the user names, already does it. A seam, type, layer or switch needs variation,
isolation or migration this change demonstrates; retained state and
intermediate values need an owner, lifetime and need. Logical dependencies and observable order constrain
physical execution without prescribing incidental syntax.

Before writing or changing a test, a test double or a slice, read
[Tests](references/TESTS.md).

Choose a slice with an observable result and keep reachable intermediate states
valid for callers and data. Distinguish preserved behavior from intentional
semantic change. Move behavioral cases with the behavior; retire old-internal
assertions after equivalent coverage exists at the relevant interface.

After each meaningful slice, inspect the diff and run focused verification.
When a check fails or earlier evidence is being reused, read
[Reusing evidence](references/EVIDENCE.md#reusing-evidence-and-retrying).
A newly affected contract expands the scope before earlier evidence is reused.
Once a slice verifies, start the next authorized one. Stop only for a user
decision, a blocker or the end of scope, and report done, remaining and blocked
with its next action, in the plan's units.
For structural work, verify the actual ownership and caller obligations as well
as values; names and comments do not establish the requested improvement.

## Verify what the delivery will claim

List the claims the delivery will make: the requested outcome, each preserved
contract and, unless the user narrows it, that the whole application still
builds and starts. Give each claim the cheapest check that fails if the claim
is false, and run no check that supports no claim. Run it where the project's
verification notes (`docs/verify/`) place that kind of change, otherwise in the
smallest assembly that preserves the conditions deciding the outcome, and
verify the requested outcome at its final consumer. A claim left unchecked is
reported as unverified.

For performance work, inspect operation counts, sharing scope, invalidation and
retained state on effectful and no-effect paths at relevant scale. Reuse may
change cost only within its valid observation scope. Report each side's
source revision (commit, plus any uncommitted change) and cold or warm state
alongside the measured numbers; before reporting them, read
[Measured numbers](references/MEASURES.md).

Run fault injection ([Fault injection](references/FAULTS.md)) and independent
review ([Evidence](references/EVIDENCE.md#independent-review)) for changes to
concurrency, authorization, data spanning versions, hard-to-recover effects or
a shared guard, and when the task or repository requires either.

## Close the requested outcomes

Check the final diff against the footprint and for unintended changes. Before
delivering a diagram or interactive view, read
[Derived views](references/DERIVED-VIEWS.md). Lead with the user-visible
outcome, its verification boundary and material gaps in the user's language.
Carry still-material choices and scope interpretations into delivery, distinguishing
user decisions from implementation assumptions. A progress record establishes what
was done, not who accepted its scope; keep an interpretation provisional when its
authority is unresolved. Give the reason, practical effect
and the concrete change to a deciding assumption or dependency that would warrant
revisiting them. Keep the facts needed for that judgment in the reply and link
supporting detail. Scale this explanation to the task: routine changes need no
invented tradeoff or reconsideration condition. Judge behavior, structure and cost
separately. Explain structural gains in rule ownership, caller knowledge or
coordinated edit points; name any remaining migration stage and exit condition.

Bind each claim's check, and required review with findings dispositioned, to the
final material revision; name each claim left unverified. Classify failed checks as introduced, pre-existing or
environmental. A missing essential check or required review leaves the affected
acceptance open; report what is implemented and locally verified, and continue
independent work.
