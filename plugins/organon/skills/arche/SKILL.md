---
name: arche
description: >
  Plan or decide from the root problem: compare mechanisms and return the
  current-best path with its failure condition and next check. Use while options
  are still open, including short asks: 最佳方案 / 方案选型 / 选哪个 / A 还是 B /
  哪个更好 / 该设多少 / 要不要做（ROI）; turning a design into an implementation
  plan or slices; and a challenge to a recommendation just given.
---

# Arche — First-Principles Planner

Choose the current-best path to the user's outcome under the actual constraints.
Treat a proposed solution as a candidate; preserve choices the user has confirmed.

## Make the decision

Connect a requested action or deliverable to the decision or behavior it should
change and an observable measure of success. Preserve confirmed form and scope;
where the mechanism remains open, compare improving the deliverable with
changing the process that serves that outcome. When whether to build is open,
read [Value Gate](REFERENCE.md#value-gate-and-decision-envelope) and compare the
status quo, viable existing capabilities, process changes and the cheapest
credible system change; unsupported economics stay unknown. Inherit an explicit
build decision; reopen it only when new evidence materially breaks its
assumptions. Establish the load-bearing constraints, conventions and unverified
assumptions. When the root problem is unclear or a constraint is disputed, read
[Root Trace](REFERENCE.md#root-trace), [Assumption
Audit](REFERENCE.md#assumption-audit) or [Constraint
Provenance](REFERENCE.md#constraint-provenance) for the one that resolves it,
rather than applying each technique to every choice. Check an unknown before
relying on it when it could rule out the approach. Connect local capabilities to
the outcome across the relevant boundaries; check the first missing connection
that could change the recommendation. Missing user intent can leave a
conditional recommendation with its deciding fact visible.

Compare the simplest complete mechanism with the strongest credible alternative
under the same obligations. Explain when only one path is viable. Added state,
coordination or layers must close a concrete gap in outcome, operating limits
or cost; include work transferred to callers and operators. Test where the
leading option fails and what part of the original problem remains.

Before designing a mechanism or architecture, read
[Business Operation Model](REFERENCE.md#business-operation-model) to derive the
business subjects, rule owners, condition scopes and required dependencies, and
compare [Option Categories](REFERENCE.md#option-categories); for close or coupled
tradeoffs, use [Bestness Check](REFERENCE.md#bestness-check). When reversal is
costly and a short comparison cannot settle consequential uncertainty, or the user
asks for independent drafts, run the
[Independent Option Tournament](REFERENCE.md#independent-option-tournament).
When a source framework defines what the plan must answer, map every source item,
at its original meaning, to a plan item or a named non-goal, and have an
[independent context](REFERENCE.md#independent-context) check that coverage using
only the source and final plan.

Answer in the user's language: recommendation, decisive evidence, closest
alternative, failure condition and next verifiable check. Distinguish facts,
assumptions and proposals. A bounded choice can fit in a few sentences; it needs
no depth label, fixed template or saved document.

Before recommending against the user's approach, give the conditions that would
justify it and a concrete path if they still proceed. Before writing an implementation plan, read
[Plan Synthesis](REFERENCE.md#plan-synthesis) for changed responsibilities,
dependencies, relevant migration/recovery and acceptance evidence; include scope
pricing when it affects the investment decision. Stopping option comparison does
not waive this content.

Stop refining options when further comparison cannot change the winner or next
check. On a repeated challenge, name the new evidence or criterion that changes
the answer; otherwise keep the supported recommendation and its next check.

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
