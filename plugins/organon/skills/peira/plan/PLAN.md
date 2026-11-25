# Planning stage

Produce an executable business scenario tree with justified expectations and visible
coverage gaps. Scale the supporting analysis to the behavior: a short flow and
coverage note can support a small plan; interactions and shared changes need models.
Use the user's language, preserving identifiers, commands, and quoted evidence.

## 1. Establish the outcome and evidence

Name the actor, legitimate entry, completed business outcome, requested test boundary,
and exclusions. Separate **expected-result authority** (approved requirements,
decisions, policies, external contracts, or explicit user direction) from
**implementation evidence** (code, configuration, schemas, tests, and logs).

Pin intended behavior to its authority and revision. An authority approves what it
states. For a consequence the plan derives from an approved change, such as a record,
log, or event the old path produced and the new path lacks once a step moves to
another system, the expected result stays the old path's until an authority states
otherwise. Current code and tests establish
reachability and current behavior; they define correctness only when explicitly
designated as the contract at a particular revision. With no established authority,
retain useful characterization scenarios and mark the intended result
`NEEDS-DECISION`. Agreement with the implementation does not resolve that decision.

Trace each in-scope business outcome from its legitimate entry to completion. Follow
the same actor and compatible fixture state through the journey, including a producer
flow when it creates a prerequisite the journey must exercise. For a change, follow affected
contracts through shared writers, readers, callers, and subscribers to other business
outcomes. Inspect alternate entries and asynchronous or recovery paths the change
can reach; retain unresolved impact as a gap instead of silently narrowing scope.

Check combined preconditions against the chosen entry's actual inputs and environment,
including supported test controls. If that route rejects the sample, retain the
rejection case and inspect legitimate alternate entries or controls that can exercise
the required positive behavior. Preserve the requested test boundary and state what
each route exercises; lower-layer execution establishes only that layer's coverage.
Mark a coverage gap after checking these routes, naming the missing data or capability
and retaining the original coverage obligation.

## 2. Identify coverage and choose its layer

Partition inputs and prior state by their observable effects, including accepted
changes and accepted no-change cases. Account for requested rules, rejected inputs,
boundaries, transitions, and affected flows. A short mapping to scenarios or gaps
is sufficient when the obligations are direct.

Read [Coverage Models](COVERAGE.md#coverage-models) when conditions interact,
rules overlap, retries or concurrency introduce alternative transitions, a shared
change affects multiple flows, or the user requests a matrix or formal traceability.
Build only the models that explain those obligations; a simple plan needs neither
a ledger nor a table proving that unused models are inapplicable.

Instantiate each chosen criterion before claiming coverage: identify the feasible
input tuples, competing conditions, or transitions and the assertion each needs.
Map each instance to a scenario, an inspected lower-layer assertion, or a named gap.
For precedence, the selected fixture must make the competing rules apply together.

Allocate each obligation to the lowest layer that exposes the fault: unit for local
calculations and validation; integration for component contracts, persistence, and
adapters; E2E for the requested journeys and system-level propagation. Preserve the
user's requested boundary. Local permutations may share an E2E representative only
with source-backed equivalence at that boundary and a stated residual risk.

An existing lower-layer test counts as mapped coverage only after inspecting its
inputs and assertions. Missing tests remain explicit follow-ups. A coverage mapping
is a plan fact, never an executed-pass claim, and never authorization to write tests.

## 3. Write the scenario tree

Start with the shortest complete Primary Happy Path: one coherent fixture's ordered
actions from entry through the final business observation. Attach variants at the
step where that path diverges, showing the common prefix and changed condition.
Give independent outcomes their own complete paths, including affected-flow
regressions. Queries, submission, and asynchronous completion belong to the journey
they advance; each is a separate outcome only when the requested contract makes it
one. A negative-only contract starts with its canonical verification path and states
why no positive Happy Path applies.

Keep definitions under those business branches, with stable scenario IDs. Grouping
nodes hold shared context; executable scenarios identify their complete route and
terminal assertion. A list of endpoint probes or a later success case using a
different incompatible fixture does not establish the Primary Happy Path. Missing
live data can block a path; still define its compatible selection or construction
conditions and retain the missing capability.

A synchronous query or calculation can finish in its complete response. Establish a
read-only footprint from the adapter and inspected call path; that alone creates no
extra runtime zero-write obligation. Mutations and asynchronous work require their
contractual state, event, or external effect; acceptance alone is insufficient. A
rejection promising unchanged state also needs that invariant observed. Add a
non-mutation probe to a read-only path only when requested or a reachable write risk
requires it. Execution-safety timeouts are not business failure thresholds.

### Effective scenario facts

Declare `Execution handoff: execution-anchors/v1` in the overview; localize the
label, preserve the token. Each executable scenario has a purpose and these
eight effective facts.

| Fact | Required content |
|---|---|
| Preconditions | Concrete starting state and inputs, or deterministic construction/selection rules; predecessor scenario IDs only where genuinely required. |
| Actions | Ordered business actions through a source-backed entry or adapter, naming the stable operation and its inputs. |
| Observes | Final contractual observation and completion predicate. Record an approved product time threshold, or `business threshold: none specified`. |
| State Footprint | Resources read, written, and external effects; `none` for an empty class. Every writable/external target names provenance or ownership and allowed lifecycle: `retain`, `restore`, or `delete`. |
| Capabilities | What preparing, judging, and cleaning up this scenario needs beyond the entry under test: access to build its fixtures, the probes its observations read, and what its footprint's lifecycle requires; `entry only` when the entry and its response settle all three. Execution selects against this, so a session lacking one blocks that scenario by name instead of discovering it mid-run. |
| Expected Results | Concrete values, errors, or invariants that distinguish correct from incorrect behavior. |
| Oracle / Expected Authority | `specified` for approved expected values, or `derived` for an independent reference/relation; name the governing source, revision, and calculation. |
| Implementation Evidence | Locators supporting the entry, state, observation, and footprint; these establish mechanics, not business correctness. |

The first five facts are the execution anchors. Resolve business facts here; the
execution stage resolves live targets, credentials, commands, safety wait bounds,
owner markers, and cleanup implementations. Keep a known project command when it
is the stable entry interface. Missing business decisions stay `NEEDS-DECISION`;
missing source anchors stay `BLOCKED`. Either can be planned, but neither is
execution-ready.

When the repository keeps a harness (`docs/verify/HARNESS.md`), cite it for the
entry address, authentication, and identity mapping. State in the plan only the
mechanics the harness lacks or this plan overrides, marked as such, so the next
harness refresh can absorb them.

### Scenario block layout

The plan's first reader is the executor, a fresh-context agent. It derives its
trigger from Actions, its probe and wait from Observes, and ownership from State
Footprint, selects and reports by ID, and resolves each block with the
[inheritance rule](../run/RUN.md#scenario-tree-inheritance). A fact it cannot find
by name is a fact it guesses, and a case without an ID is a result it cannot
record.

- **One label per fact.** Label each field with its fact name exactly as the
  table spells it. The names are identifiers the executor matches, so they stay
  in English whatever language the plan's prose uses. Two facts are two fields.
- **A field is a list item** under the scenario heading. Consecutive label lines
  without list markers render as a single paragraph.
- **Actions is a numbered list**, one operation per step. A condition or
  intermediate check sits on the step it gates; a limit on judging sits in
  Expected Results beside the result it qualifies.
- **Each variant has its own stable ID** (`ORD-02.B1`) whenever it is executed or
  recorded separately. A table row is the base path run in full with one change:
  the changed condition and its complete Expected Results. The condition names the
  base step it replaces or follows and gives the whole changed input; a variant
  that starts from another variant's end state names that variant. A variant
  that stops early, uses a different fixture, or changes what is observed,
  written, or needed (Actions, Preconditions, Observes, State Footprint,
  Capabilities) is a child block that states those fields. A
  held variant carries its `NEEDS-DECISION` or `BLOCKED` token beside its ID.
- **A scenario states only the fields it defines, each in full.** Inheriting is
  leaving the field out, so a one-step scenario is a heading and a few lines. A
  field that adds to its parent's value restates the whole value; "same as the
  parent, plus…" leaves the executor to merge it.
- **Shared facts sit on the nearest parent, named when reused.** Name a fixture,
  route, footprint, or assertion set that several scenarios share, with the
  parameters its variants change, and reference it with those values, as in
  `F1(sync=off)`, beside any condition the field adds. A reference keeps the
  entry's other eligibility conditions and the journey's shared assertions in
  effect where retyping would drop them.
- **A revision edits the field that owns the fact**, including a repair from the
  delivery check.

```markdown
### ORD-02 Cancel a paid order → refund → stock restored

- **Preconditions**: F1(paid=true); one order line of SKU-A, quantity 2
- **Actions**:
  1. `cancelOrder(orderId)` through the customer gateway
  2. Poll `getOrder(orderId)` until the status leaves `CANCELLING`
- **Observes**: order `CANCELLED`, refund record `SETTLED`; business threshold:
  none specified
- **Expected Results**: refund equals the paid amount; SKU-A stock rises by 2

| Variant | Changed condition | Expected Results |
|---|---|---|
| ORD-02.B1 | step 1 sent twice | one refund record equal to the paid amount; SKU-A stock rises by 2 once |

#### ORD-02.B2 Cancel a shipped order

- **Preconditions**: F1(paid=true, shipped=true)
- **Actions**:
  1. `cancelOrder(orderId)` through the customer gateway
- **Observes**: the response; order still `SHIPPED`; business threshold: none
  specified
- **Expected Results**: rejected with `ORDER_SHIPPED`; refund records and SKU-A
  stock unchanged
```

Here State Footprint, Capabilities, authority, and evidence come from the `ORD`
parent node.

Add priority, step IDs, and `Requirements` links when they aid selection or
traceability; a handoff is complete without them.

## 4. Close and deliver

Use an overview, the scenario tree, and coverage/gaps as the default shape. Place
sources beside the facts they support; add flow diagrams and model tables where
they explain a decision. The tree is the plan's one scenario inventory; other
sections refer to its scenarios by ID.
When the scope is a set of operations to account for one by one, use the
[operation coverage map](COVERAGE.md#operation-coverage-map): it maps each
operation to scenario IDs and keeps per-operation reference detail in one place.
The plan carries business facts for the executor. Verdict statuses, evidence
retention, and report layout are [RUN.md](../run/RUN.md)'s, which the executor
reads itself; a plan that needs one of them different states only that override.

Walk each complete path using its stated fixture and actions: every step must accept
the state produced by the previous step and reach the asserted business outcome.
Then walk the paths in the order one run executes them: each accepts what earlier
scenarios and sibling variants leave behind, uniqueness constraints included.
Derive entry-visible values and errors through the full adapter and translation
path, including transaction and exception wrappers that can change the response.
Resolve each executable branch's inherited facts under the inheritance rule.
Check the resulting conditions, footprint, capabilities, and assertions together:
could a fixture satisfy them yet be rejected before the intended branch, or could a
required invariant be broken while all its assertions pass? Repair the definition
or expose the missing fact as a gap.

Reconcile the instantiated coverage obligations with the tree, inspected lower-layer
assertions, and gaps. Check that all referenced IDs resolve; when using a ledger,
reconcile both mapping directions. Model headings and filled fields alone do not
establish these properties.
End with the smallest useful first slice: the Happy Path and highest-risk required
branches, identified by scenario ID. This orders the initial execution; it narrows
the requested coverage only when the user selected that subset. Keep remaining
in-scope obligations and their readiness visible.

Use `NEEDS-DECISION` for unresolved authority, `BLOCKED` for unavailable execution
evidence or capability, and `OUT-OF-SCOPE` for a stated exclusion. `ASSUMED` requires
an explicitly accepted temporary premise and the accepting owner. Give an undecided
or blocked case its own variant ID, so the executor holds that ID while the base
scenario and its other variants stay ready. Keep unresolved
items and missing lower-layer tests visible without inflating the E2E tree.

Save Markdown as `.scratch/{feature}/e2e/{yyyymmdd}-{feature}-e2e-test-plan.md` unless the
user specifies a path, and link it in the reply. Planning alone authorizes neither
test execution nor test-code changes.

Before delivery, have a fresh-context checker try to break the saved plan; a fork of
the planning context does not qualify. The author's own walk shares the blind spots
that wrote the plan, and an independent reader with source access is what finds a
wrong entry-visible error, a dropped inherited condition, or an uninstantiated
partition. Brief it with the plan path, the request and its authority sources, and
the pinned source revision; its checklist, for every executable scenario, is §3's
Primary Happy Path rule plus this section's walk and reconciliation questions, and
whether its five execution anchors resolve by label and each separately recorded
variant carries an ID. It
returns each finding with the scenario it breaks and the source location that
decides it, and names the questions that found nothing. Repair each supported
finding in the field that owns it or record it as a gap, then have the checker
confirm the repairs. Without
subagents, or for a plan with one executable scenario and no inherited facts, run
the checklist here; the delivery then says the check was not independent. The
check's record (who checked, what was found and repaired) goes in the reply; the
plan keeps the repaired fields and the gaps.

## 5. Hand off to execution (run mode only)

Continue to execution only when the selected mode includes it. Pass on the user's
scenario selection when there is one; otherwise the executor applies RUN.md's
default selection, which holds every ID carrying a `NEEDS-DECISION` or `BLOCKED`
item. Report what each held ID is missing while ready work continues.

Use [the execution handoff](../run/HANDOFF.md) for fresh context, the brief,
parent/executor responsibilities and the no-subagent fallback.
