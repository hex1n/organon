---
name: arche
description: >
  Plan or decide from the root problem: compare mechanisms and return the
  current-best path with its failure condition and next check. Use for 最佳方案 /
  方案选型 / 要不要做（ROI） asks, and for a challenge to a recommendation just
  given. Reviewing one existing plan is dokimasia.
---

# First-Principles Planner

## Core Move

Start with the root problem. Treat the user's proposed solution as a candidate.
Recommend the current-best path under the stated constraints. Before choosing,
separate true constraints, conventions, and unverified assumptions.

## Routing Gate

Use this workflow to choose or reconstruct a path. For fact-finding, gather
evidence first; return here if the request also needs a recommendation.
An existing-plan review belongs to a review workflow unless re-planning is
requested. Implementation, tests, approval, canonical-doc capture and execution
breakdown of a converged plan need only a short assumption check; see the
conversion rule below. The same boundary applies to delegated work.
For language-specific signals, use
[localized routing](REFERENCE.md#localized-request-and-output-rules).

## Hard Gates

- If the stated solution is not tied to an outcome, rewrite the problem statement before comparing options.
- When a source framework lists items the plan must answer, include a coverage
  map. Examples include an article's claims, an audit's findings, and a review
  checklist. Map every source item to a plan item or a named non-goal. Judge
  coverage against the source item's own definition.
- Connect local capabilities to the required outcome: establish the assumptions
  each boundary must preserve. Check the first missing connection that could
  change the recommendation. Ask for missing user intent with a recommended
  default; when a safe default exists, state the current-best conditional path
  and the fact that would flip it.
- If the plan has no independently verifiable next step, shrink it to a decision plus its first check.
- **Artifact Gate:** deliver in chat unless the user asks for a file, provides a
  target path, or the result is a reusable handoff into named next work. When
  saving, use [Artifact Location](REFERENCE.md#artifact-location) and
  [Plan File Output](REFERENCE.md#plan-file-output).

## Output Mode

Use the user's language for chat and saved artifacts. For localized fixed labels,
use [REFERENCE.md](REFERENCE.md#localized-request-and-output-rules).
For Standard or deeper work, lead with the recommendation, decisive evidence,
strongest alternative, and next verification step. Use mode/depth labels when
the user needs them to understand scope. Express the Bestness Check naturally;
a fixed heading is optional. For Light decisions, keep the first line compact.
Add external sources only when they help the decision.

Choose the smallest presentation that makes the decision checkable. Clear prose
can be enough. Use a diagram when relationships are easier to inspect visually;
use an interactive comparison when changing assumptions clarifies the choice.
Weigh that benefit against creation and maintenance cost. For these views, use
[Decision Views](REFERENCE.md#decision-views). Link decisive claims to sources
and distinguish facts, assumptions and proposals. Use
[Evidence Conventions](REFERENCE.md#evidence-conventions) for material claims.

| Mode | Use when | Shape |
|---|---|---|
| Decision | The user asks whether to choose, keep, replace, or improve a path, or challenges the current best. | Compact recommendation, why, when wrong, next step; include a compressed **Bestness Check** for non-trivial recommendations |
| Plan | The user asks for a best/better plan, implementation strategy, architecture or design direction, or explicitly avoids coding while choosing a path. | Chat-first plan by default; save only through the Artifact Gate; put the Bestness Check near the top for non-trivial recommendations |

## Depth

| Signal | Depth |
|---|---|
| Narrow, well-understood choice | Light |
| Multiple viable approaches | Standard |
| User states a solution, not the problem | Standard+ (Standard with a mandatory root reframe) |
| Recurring/stuck/conventional problem | Deep |
| Consequential uncertainty, difficult reversal, or coupled tradeoffs that a short comparison cannot settle | Deep |
| The request ties the plan to a source framework | Coverage map; depth follows the actual decision risk |

## Process

1. **Preflight**: gather context for the decision. Use
   [Assumption Audit](REFERENCE.md#assumption-audit) for load-bearing unknowns
   that could change the root or rule out an approach.
2. **Root trace**: use Five Whys for a single solution-shaped statement; for systems, trace business/user, technical, historical, and operational roots.
3. **Constraint split**: classify load-bearing factors as true constraints,
   conventions, or unverified assumptions. Use
   [constraint provenance](REFERENCE.md#constraint-provenance) to separate
   required outcomes, domain facts, and implementation commitments.
   For mechanism design, derive a small
   [business operation model](REFERENCE.md#business-operation-model) before
   selecting components. Carry its business subject, rule ownership, and required
   dependencies into acceptance criteria. Keep unconfirmed mechanisms open.
4. **Value Gate**: when whether to build remains open, compare the status quo
   with viable existing capabilities, process changes, and system changes.
   Explain exclusions; no fixed candidate count is required. Use
   [Economic Evidence](REFERENCE.md#economic-evidence) to judge benefits and
   costs against the cheapest credible mechanism. Mark unsupported estimates.
   When a durable handoff needs it, record `BUILD`, `DEFER`, `NO_BUILD`, or
   `RESEARCH_FIRST` in the
   [decision envelope](REFERENCE.md#value-gate-and-decision-envelope).
   A chat answer can use a compact equivalent. `DEFER`/`NO_BUILD` ends
   investment planning. `RESEARCH_FIRST` resolves the missing fact within the
   authorized scope. If the user already decided to build, inherit that decision
   and choose how. Reopen it only for new evidence that materially breaks its
   assumptions.
5. **Reconstruct options**: start with the simplest complete allocation of
   responsibilities. Compare materially different mechanisms under the same
   obligations and assumptions. Added machinery must close a concrete gap in
   outcome, operating limits, or cost
   ([Option Categories](REFERENCE.md#option-categories)).
   When 3+ options remain or impact is high, compare them pairwise against true
   constraints. In that comparison, drop weaker or duplicate mechanisms and
   test the winner with the [inversion test](REFERENCE.md#inversion-test).
   For a Deep-depth decision whose wrong choice would be costly to reverse, or
   when the user explicitly asks for independently drafted options, use the
   [independent option tournament](REFERENCE.md#independent-option-tournament).
6. **Recommend**: pick the approach that solves the root under true constraints
   after the inversion test. When rejecting the user's approach, give its
   [justifying conditions and proceeding path](REFERENCE.md#dissenting-path).
7. **Bestness Check**: for non-trivial recommendations, including the first
   response, answer the five checks in [REFERENCE.md](REFERENCE.md#bestness-check).
   Stop comparing mechanisms when further selection cannot change the Value Gate
   decision, winner, or next verification step. This stops option refinement only.
   Complete the chosen plan's required content: rollback, permissions, migration
   safety, and acceptance evidence.
8. **Synthesize**: for Plan mode, use
   [Plan Synthesis](REFERENCE.md#plan-synthesis) to state changed responsibilities,
   required relationships, transition constraints and acceptance evidence.

## Route Examples

- `Should we replace X?` / `Is there a better path?` -> Decision.
- `Plan first; do not change code yet` / `Give an implementation strategy` -> Plan.
- `Deeply analyze why X fails` -> Research-first; plan only if the user asks for a fix path.
- `Turn the plan we converged on into an execution breakdown (slices, phases, tickets)` -> scan the conversation for facts stated since convergence and compare them with the decision's flip conditions. This is a conversation scan, not fresh analysis.
  - A broken assumption, an adverse cost or timeline shift, or an unaccepted doubt fails the check. A doubt is accepted only by naming the risk and choosing to proceed; the conversion ask itself does not accept it.
  - If any check fails, no converged plan exists, or the flip conditions are no longer visible in the conversation, run Plan mode.
  - Otherwise, hand back for execution shaping.
- `Review this plan` -> use a review skill; re-plan only if asked.
- Localized route examples live in [REFERENCE.md](REFERENCE.md#localized-request-and-output-rules).

## Acceptance Gate

Before the final answer, check:

- The root problem is named and true constraints are separated from assumptions.
- At least two mechanisms are compared, or one viable path is justified.
- The recommendation includes its failure mode and the next verifiable step.
- When the request proposes new or changed capability, the answer carries the
  Value Gate decision and its flip condition.
- For mechanism design, test the recommendation against the least-machinery path.
  Each added responsibility or state lifetime must close an identified gap
  without silently strengthening the obligation.
- For non-trivial recommendations, include the Bestness Check in the first answer
  or explain why the decision is low-risk enough to skip it. If any question
  remains, pair it with the default path and what would change the recommendation.
- When the plan carries a coverage map, verify it in an
  [independent context](REFERENCE.md#independent-context) given only the source
  material and the final plan.
