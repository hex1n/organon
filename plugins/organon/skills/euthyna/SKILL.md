---
name: euthyna
description: >
  Review code, pull requests, commits, or working-tree changes for evidence-backed
  defects and material code-quality problems. Use for code review, 代码审查,
  冷读代码, and re-review after fixes. Inspect, run authorized checks, and report
  without repairing the reviewed version.
---

# Euthyna — Code Review

Judge whether the code fulfills a justified business intent, preserves affected
system obligations, and expresses its rules with reasonable implementation cost.
Review business behavior and implementation structure independently, then resolve
their evidence into an actionable account.

## Establish what correct means

Start with the user's objective, confirmed decisions and relevant business or
interface rules. Separate the desired outcome, the proposed approach and the
implementation: faithfully implementing an approach does not establish that it
achieves the objective. Existing code and agreeing tests describe behavior;
derive expectations from an independent source.

Identify the subjects, operations, rules and observable success/failure conditions
the change affects, including obligations it must preserve. Explain unresolved
business assumptions and conflicts with their sources. Investigate discoverable
facts; leave a genuine policy choice with the user while reviewing the independent
parts. With no specification, use supported caller/data contracts and state what
business intent remains unknown.

Before the detailed review, show a brief starting point in the user's language:
the supported business intent and its sources, the outcomes and preserved
obligations to judge, the comparison scope, and material open assumptions.
Distinguish confirmed rules from reconstruction. Continue the review and update
this starting point when investigation changes its basis.

## Enter a fresh review context

Coordinate two fresh reviewers on the current model: **Business and system
behavior** and **Implementation and structure**. Give each the request, relevant
source material, code scope and its perspective below. Each derives expectations
before reading the other's conclusions. Keep builder reasoning and proposed
findings outside their initial context. An assigned reviewer performs its
perspective directly; it does not restart this coordination workflow.

Use the requested comparison. Otherwise compare a branch with its main-branch
merge-base, a commit with its parent, or working-tree changes with HEAD, including
in-scope untracked files. For a component review, inspect its current snapshot.
Inspect beyond changed lines along affected contracts. Preserve the reviewed
sources; run experiments in a separate copy within existing authorization.

Honor a deliberately narrower review request. When delegation is unavailable,
perform both perspectives as separate passes and disclose the lost independence;
a user- or repository-required independent review remains unmet. Keep the scope
stable across readers and checks; changed inputs reopen affected conclusions.

## Business and system behavior

Reconstruct the business operation: who acts on what, under which conditions,
which rule owns the decision, and what results and effects should follow. Check
whether the chosen approach can achieve that intent under the actual business
facts. Expose an unsupported assumption or contradiction; distinguish it from a
confirmed choice that requires the user's decision to change.

Trace supported inputs through decisions, transformations, stored state and
effects to affected callers and consumers. Check each distinct outcome, including
unchanged branches receiving new inputs. Correct final values also require valid
intermediate states, side effects, rejection behavior and recovery.

Follow the change's impact into upstream assumptions, downstream readers and
shared rules. Select boundary and lifecycle cases from those paths: partial
failure, retries, concurrency, authorization, scale, historical records and
coexisting versions matter when the operation reaches them. Close a path with a
supported outcome, an enforcing invariant, or the exact missing premise. Use the
triggered [system probes](references/PROBES.md#system-behavior) for deeper checks.

## Implementation and structure

Independently check how the code represents the business subjects and rules.
Locate each invariant's owner, the knowledge callers must carry, and the actual
dependency direction. Judge structural requirements in executable relationships;
matching values, renamed types and explanatory comments alone do not establish
that responsibilities moved or became simpler.

Investigate smells as hypotheses about concrete cost: duplicated rule ownership,
contradictory state, needless coordination, speculative abstraction or complexity
transferred to callers. Describe a supported change or failure that exposes the
cost and compare a simpler implementation under the same obligations. A syntax
preference or smell label alone is insufficient.

For defensive code, trace the real entry that can violate the invariant, its
authoritative owner and the behavior the guard protects. Check whether it enforces
a necessary boundary, repeats an established guarantee, hides a broken contract,
or compensates for a representation that permits contradictory state. Inspect
the owning test's ability to distinguish those explanations. Use the triggered
[implementation probes](references/PROBES.md#implementation-and-tests).

## Resolve decisive questions

For each concern, connect the expected obligation to a supported trigger, causal
path and consequence. Carry joint constraints from actual producers to consumers;
a constructible input alone does not prove a reachable defect. Seek evidence that
defeats the concern, including upstream invariants and downstream effects. Source
reasoning can establish a complete path; an unverified material premise stays an
explicit risk. A structural finding needs a concrete ownership or maintenance
consequence, even when outputs currently agree.

Run the smallest authorized experiment that distinguishes the competing
explanations. Execute the real core and derive expected observations independently
of candidate predicates. Respect fixture provenance and observe effects at the
boundary the claim concerns. A setup failure establishes no business defect.

Use ablation when necessity is disputed: remove or simplify the suspect guard,
branch, state or layer in the validation copy, then compare required behavior and
caller duties. Passing existing tests alone leaves redundancy unproven. A test
passing both versions may protect behavior; try a plausible wrong implementation
when its ability to detect the relevant fault is uncertain. Separate an observed
result from the broader claim the experiment cannot establish.

## Independently falsify material conclusions

After both independent returns, have each reviewer try to falsify the other's
material conclusions: claims that affect acceptance, business scope or a required
remedy. Challenge agreement and favorable judgments as well as reported defects.
Test business authority, reachability, invariant ownership and claimed structural
cost against the strongest supported alternative explanation.

For a decisive conclusion based on a shared unchecked premise, or where a wrong
verdict could cause serious business or system harm, obtain a fresh falsifier on
the current model. Supply the claim, its necessary premises and relevant raw
sources at the same reviewed scope, within existing access constraints. The
falsifier tests the claim without restarting the full review or inheriting an
expected verdict. Genuine business-policy choices remain with the user.

Resolve each challenged conclusion as defeated, still supported by named
evidence, or unresolved with its deciding gap. Finding no counterexample alone
establishes no claim. Merge common causes while retaining distinct affected
outcomes, counterevidence and coverage gaps. Validate proposed remedies against
the obligations separately from establishing defects.

## Deliver and re-review

Lead with the material findings, ordered by consequence. Give each a stable ID,
location, trigger, broken obligation or concrete structural cost, deciding evidence
and consequence. Attribute introduced and existing problems against the comparison
where available. Distinguish confirmed defects, unresolved risks with their next
deciding check, user-owned decisions and optional improvements.

State what the review established about business intent, system behavior and
implementation quality, with actual checks and material coverage limits. An empty
finding list is valid. Acceptance applies only to inspected scope with no open
material defect or risk; missing business authority limits the affected claim.
Return concise prose in the user's language and honor requested output formats.
Review reports findings; repair work needs its own authorization.

On re-review, answer each prior concern on the current code, inspect the repair's
effects and reuse evidence only while its inputs remain applicable. Close a
concern with evidence that its mechanism is removed or its premise was false;
deferral, deletion and repair claims alone do not establish resolution.
