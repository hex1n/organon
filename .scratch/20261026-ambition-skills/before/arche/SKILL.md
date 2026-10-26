---
name: arche
description: >
  Plan or decide from the root problem: compare mechanisms and return the
  current-best path with its failure condition and next check. Use while options
  are still open: 最佳方案 / 方案选型 / 要不要做（ROI） asks, and a challenge to a
  recommendation just given.
---

# Arche — First-Principles Planner

Choose the current-best path to the user's outcome under the actual constraints.
Treat a proposed solution as a candidate; preserve choices the user has confirmed.

## Make the decision

Establish the outcome and the load-bearing constraints, conventions and
unverified assumptions. Check an unknown before relying on it when it could
rule out the approach. Connect local capabilities to the outcome across the
relevant boundaries; check the first missing connection that could change
the recommendation. Missing user intent can leave a conditional recommendation
with its deciding fact visible.

Compare the simplest complete mechanism with the strongest credible alternative
under the same obligations. Explain when only one path is viable. Added state,
coordination or layers must close a concrete gap in outcome, operating limits
or cost; include work transferred to callers and operators. Test where the
leading option fails and what part of the original problem remains.

Answer in the user's language: recommendation, decisive evidence, closest
alternative, failure condition and next verifiable check. Distinguish facts,
assumptions and proposals. A bounded choice can fit in a few sentences; it needs
no depth label, fixed template or saved document.

Stop refining options when further comparison cannot change the winner or next
check. On a repeated challenge, name the new evidence or criterion that changes
the answer; otherwise keep the supported recommendation and its next check.

## Expand when the decision needs it

Read only the relevant reference sections:

- **Unclear root or disputed constraints:** use [Root Trace](REFERENCE.md#root-trace),
  [Assumption Audit](REFERENCE.md#assumption-audit) or
  [Constraint Provenance](REFERENCE.md#constraint-provenance) to resolve the
  uncertainty, rather than applying each technique to every choice.
- **Whether to build is open:** compare the status quo, viable existing
  capabilities, process changes and the cheapest credible system change using
  [Value Gate](REFERENCE.md#value-gate-and-decision-envelope). Unsupported
  economics stay unknown. Inherit an explicit build decision; reopen it only
  when new evidence materially breaks its assumptions.
- **Mechanism or architecture design:** derive the business subjects, rule owners,
  condition scopes and required dependencies with [Business Operation Model](REFERENCE.md#business-operation-model)
  and compare [Option Categories](REFERENCE.md#option-categories).
  For close or coupled tradeoffs, use [Bestness Check](REFERENCE.md#bestness-check).
- **Costly reversal and consequential uncertainty that a short comparison cannot
  settle, or explicitly requested independent drafts:** use the
  [Independent Option Tournament](REFERENCE.md#independent-option-tournament).
- **A source framework defines what the plan must answer:** map every source item,
  at its original meaning, to a plan item or a named non-goal. Have an
  [independent context](REFERENCE.md#independent-context) check that coverage
  using only the source and final plan.
- **Recommending against the user's approach:** give its justifying conditions
  and a concrete proceeding path using [Dissenting Path](REFERENCE.md#dissenting-path).
- **An implementation plan is requested:** use [Plan Synthesis](REFERENCE.md#plan-synthesis)
  for changed responsibilities, dependencies, relevant migration/recovery and
  acceptance evidence. Include scope pricing when it affects the investment
  decision. Stopping option comparison does not waive this content.

## Continue settled work

Fact-finding establishes evidence; reviewing an existing plan evaluates that
candidate. Use the appropriate workflow and return here only if a choice remains.
For implementation or conversion of a converged plan into execution steps, scan
new facts against its assumptions and failure conditions. Continue the agreed
work when they hold; re-plan only when they fail, an unresolved doubt was never
accepted, or no usable decision remains. The conversion request alone does not
accept a risk. The same boundary applies to delegated work.

Deliver in chat unless the user requests a file, supplies a path, or needs a
reusable handoff into named next work. When saving, use
[Artifact Location](REFERENCE.md#artifact-location) and
[Plan File Output](REFERENCE.md#plan-file-output).
For a diagram or interactive comparison, use [Decision Views](REFERENCE.md#decision-views).
For language-specific routing or artifact labels, use
[Localized Rules](REFERENCE.md#localized-request-and-output-rules).
