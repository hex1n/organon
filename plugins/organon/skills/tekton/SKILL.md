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
affected contracts hold.

Implement verifiable slices. Add records and design comparison when they resolve
a concrete decision or risk. Use the user's language; preserve identifiers and
commands.

When task artifacts need a scratch directory, use `.scratch/YYYYMMDD-task-name/`,
with the task start date in the user's timezone and a short lowercase hyphenated
task name. Reuse that directory when resuming the task; honor a user-specified
output path.

## Establish the contract

Before editing, identify:

- the observable outcome the user wants;
- affected behavior that must remain true;
- the relevant business objects, relationships and rule owners, including requested structural improvements;
- for each affected contract, the evidence and the plausible wrong
  implementation it must reject, such as rollback omitted after a real state
  change.

Separate requirements from characterization of existing behavior. Agreement
between code and tests does not settle a disputed requirement. Existing behavior
can be an oracle for preservation; a bug fix needs an expectation independent of
the defect. When an exact answer is unavailable, use a justified invariant,
comparison, replay, or relationship between inputs and outputs.

Account for guards, errors, and effects that will be added, removed, narrowed,
merged, or relocated. Establish each obligation and its owner before the edit.
Use source-established invariants; an added defense needs a reachable failure
that the owning boundary does not already exclude.
Investigate technical unknowns directly. Ask only for missing user-owned intent
or authority decisions, and continue work that does not depend on the answer.

Before each meaningful slice, verify the unconfirmed assumptions that could
make that slice wrong: dependency results, entry guards, or available tool
capabilities. Defer unrelated investigation until a later decision needs it;
keep unresolved load-bearing assumptions visible.

## Trace the affected behavior

Follow real entry points through decisions, state changes, and effects to the
observable result. Trace the producers and consumers of values the change
affects, including the boundaries that establish their identity, order, precision
and scope. Check retained decisions against the inputs they will now receive.
An unchanged guard or fallback can behave differently when an earlier operation
changes its input. Inspect wiring, alternate entries, stored data and compatibility
where they carry that contract.

Distinguish source-level reachability from the path actually taken for the
relevant inputs and state. When this uncertainty could change the next
implementation decision, use a focused test or run to observe the relevant
branches, state changes, or effects before relying on the causal claim.

For several flows or release stages, keep a compact impact record connecting
affected contracts, evidence and unresolved assumptions. A local change needs
only a brief account.

## Improve code and architecture

Give the requested change a coherent home in the code. When refactoring or
architecture improvement is requested, structural gains are part of the
deliverable. Identify the actual source of complexity: duplicated decisions,
coordinated edits, implicit state, mixed responsibilities, unnecessary indirection,
or misleading domain concepts.

Represent the business subjects, rules, scopes and prerequisites that explain
the behavior. Choose the entry point from that subject and rule ownership.
Trace reused helpers and queries through their implementations; their output
shape alone does not establish the required relationships. Preserve confirmed
structural choices. For open choices, compare representations by how clearly
they express those responsibilities.

A combined expression can suffice when its subject, governing rules and downstream
relationships remain recognizable. Separate calls, intermediate values and
modules need a reason in ownership, validity or cost. Distinguish logical
dependencies from physical execution; preserve contractually observable order.

For repeated work, identify keys, sharing scope and invalidation conditions.
Inspect effectful and no-effect paths; relate reads, checks and retained state
to input growth. Batch or reuse within the valid scope, preserving observation
points whose freshness can change the next decision. Preview evidence alone
does not establish the effectful path's structure or cost, and an observation
does not replace enforcement at the effect boundary.

Use these criteria to shape the implementation:

- **One rule owner.** Each business decision has one authoritative home. Callers
  use its result without reproducing its conditions or reconstructing the
  decision from raw data.
- **Deep modules.** A module hides substantial coherent complexity behind a
  small interface. Group decisions that must change together; hide representation
  and policy choices from callers. Processing order alone does not determine
  module boundaries. Expose required errors, ordering, state, configuration,
  and performance obligations.
- **Clear dependencies.** Dependencies lead toward the owner of a decision.
  Adapters translate external representations and effects at that boundary.
- **Justified seams.** A seam is a replaceable boundary. Add one for demonstrated
  variation, isolation, or a migration need; collapse it when that need expires.
- **State ownership.** Distinguish authoritative facts from derived results and
  execution bookkeeping. Retained state has an owner, a required lifetime, and
  a reason to store rather than recompute it.

Judge a design by how much callers must understand, how many places a rule change
touches, and whether behavior can be tested through the relevant interface.
Line, class, and layer counts are supporting observations. For an unsettled,
material design choice, compare credible alternatives, including deletion or a
direct implementation, against the actual change pressure.

For requested structural work, or structural migration needed by the authorized
implementation, read [Refactoring](references/REFACTORING.md) before choosing the
transition. For compatibility or data migration without a structural redesign,
read its [transition section](references/REFACTORING.md#choose-the-transition).

## Implement coherent slices

Choose a slice with an observable result that can be verified. Distinguish
behavior-preserving movement from intentional changes to semantics. Keep
intermediate states valid for the callers and data that can encounter them.

Inspect the changed execution paths against the required business relationships
and owners above. Correct missing or misrepresented relationships even when result
tests pass; names and comments alone do not establish structural fit.

Run focused verification and inspect the diff after each meaningful slice.
Confirm in those runs that each new check rejects the wrong implementation named
for its contract.
If a new affected path or contract appears, update the scope and design before
relying on earlier evidence. Move behavioral cases with the behavior. Retire
assertions about old internals only after equivalent behavioral coverage exists
at the relevant interface.

## Select verification by risk

Choose the smallest surface that can decide the claimed property. Local
correctness carries to an end-to-end result only when intervening boundaries
preserve its assumptions on the supported paths. Check the first missing
connection, or leave that part of the outcome open. The following are options,
not a universal checklist:

| Property | Useful evidence |
| --- | --- |
| New or corrected behavior | Requirement-based examples and failure cases; the original reproduction on its own surface when feasible |
| Preserved behavior | Focused regressions, characterization, differential checks, or replay |
| Integration and effects | Real wiring, committed state, observable effects, and relevant recovery paths |
| Compatibility | Old and new callers, payloads, and stored data, including reachable mixed states |
| Retry and idempotency | Repeated execution and failures around effects; observe duplicates or omissions |
| Concurrency | Controlled interleavings that can expose the suspected race |
| Performance | The slice's operation counts and retained state at representative scale, plus measured workloads against required thresholds; a measured number is reported only as [measured numbers](references/VERIFICATION.md#measured-numbers) allows |
| Operations | Actionable diagnostics and demonstrated recovery at the affected boundary |
| Structure | Business rules and relationships recognizable in executable structure; rule ownership, state lifetime, caller knowledge and obsolete path removal |

Discover the repository's actual commands and test entry points. Confirm the
relevant tests execute and observe the claimed result. For new or changed tests,
derive expected behavior from the contract rather than the proposed patch.
A defect closes on the surface where it was reproduced: confirm the target
defect on the before-state and its absence after the fix through the same
entry, inputs, and environment, taken from the project's verification harness
(`docs/verify/HARNESS.md`) when the repository keeps one. A reproduction on
another surface, a unit test alone, or an inconclusive run leaves the defect
open, and the delivery says so. A check passing both versions can protect
behavior but does not establish reproduction. Revert changes whose motivating
hypothesis the evidence refuted, and list them. The delivery carries the
failing and passing outputs verbatim or by evidence path. Keep the limits of
intermittent or unavailable reproduction explicit.

Add or strengthen tests where a missing case matters; routine reversible edits
do not need new tests that merely repeat the implementation.

For structural assertions or a test double whose boundary semantics decide the
result, read [checking the oracle](references/VERIFICATION.md#checking-the-oracle).
Check that it rejects a relevant contract violation and accepts a relevant
contract-preserving change.

Use targeted mutation or fault injection when confidence depends on whether
checks detect a plausible critical mistake, especially after guards are
narrowed, consolidated, moved, or receive different inputs. Before selecting a fault, writing a mutation
script, or applying a fault by hand, read
[targeted mutation and fault injection](references/VERIFICATION.md#targeted-mutation-and-fault-injection)
for the selection, passing-baseline, isolation, and differential-verdict rules.

Obtain independent review when required by the task or repository, or when
changing concurrency, authorization, data spanning versions, hard-to-recover
effects, or a shared guard being deleted or consolidated. Follow governing
authorization for delegation and model selection. If required review cannot
run, leave acceptance open. Label verification for other changes self-reviewed.

Use the named reviewer's protocol. When using installed
[euthyna](../euthyna/SKILL.md#enter-a-fresh-review-context), read its caller
instructions before dispatch or remediation. No particular sibling skill is
required. Review supplements execution evidence.

Reuse evidence only while its relevant source, inputs, and environment remain
unchanged. Rerun invalidated checks and all required repository gates.

If a finding refutes an evidence claim, rederive every claim of the same kind
in the current slice before citing it. When several confirmed defects may share
one cause, or repair would choose between competing authorities or mechanisms,
test that explanation before repairing. Recheck each finding against the repair;
keep independent defects separate.

## Close the requested outcomes

Close the requested behavior and structural target using evidence applicable
to the final code. Confirm preserved contracts and the intended decisions and
effects. Report a property as verified with its check and the wrong
implementation that check was seen to reject; report the rest as unverified.
Judge behavior, structure and cost separately; equivalent results alone
establish neither structural fit nor acceptable cost. Correct unexplained
in-scope mismatches or report their consequences.
When review is required, acceptance also needs a completed review whose evidence
applies to the final material revision, with every finding dispositioned. If that
review is pending or blocked, report implementation and local verification
separately, without claiming complete acceptance.
For refactoring, also close the removal target or state the remaining migration
stage. Inspect the final diff for scope and unintended changes.

Describe structural gains concretely: a decision now has one owner, callers know
fewer details, or a rule change requires fewer coordinated edits. Classify failed
checks as introduced, pre-existing, or environmental. If an essential check could
not run, report the implementation as not fully verified and leave the affected
claim open. Continue independent work when one part is blocked.

Hand off the outcome, concrete structural gains, decisive verification and
material gaps in the requested form. Prose can be enough. Use a diagram when
roles, boundaries or dependencies are easier to inspect visually; use an
interactive view when changing inputs or exploring branches clarifies a decision.
Before delivering either, read [Derived views](references/DERIVED-VIEWS.md).
