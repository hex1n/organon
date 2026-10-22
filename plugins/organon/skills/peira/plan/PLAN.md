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

Pin intended behavior to its authority and revision. Current code and tests establish
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

Read [Coverage Models](REFERENCE.md#coverage-models) when conditions interact,
rules overlap, retries or concurrency introduce alternative transitions, a shared
change affects multiple flows, or the user requests a matrix or formal traceability.
Build only the models that explain those obligations. The reference also defines
when an explicit test-requirement ledger is useful; a simple plan needs neither
that ledger nor a table proving that unused models are inapplicable.

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

Read [Effective scenario facts](REFERENCE.md#effective-scenario-facts) when writing
the tree. Declare `Execution handoff: execution-anchors/v1` in the overview;
localize the label, preserve the token. Every executable scenario needs the eight
effective facts defined there. Present them through scoped shared context and
branch-specific detail so the business journey remains readable.

A synchronous query or calculation can finish in its complete response. Establish a
read-only footprint from the adapter and inspected call path; that alone creates no
extra runtime zero-write obligation. Mutations and asynchronous work require their
contractual state, event, or external effect; acceptance alone is insufficient. A
rejection promising unchanged state also needs that invariant observed. Add a
non-mutation probe to a read-only path only when requested or a reachable write risk
requires it. Execution-safety timeouts are not business failure thresholds.

Co-locate shared facts on the nearest parent. An omitted child field inherits the
complete parent value; a child replacement restates the whole effective field.
This atomic rule also governs execution and any derived view. A variant's changed
condition preserves the entry's other eligibility conditions and the journey's
shared assertions. Add priority, step IDs, and `Requirements` links when they aid
selection or traceability; their absence does not invalidate a complete handoff.

## 4. Close and deliver

Use an overview, the scenario tree, and coverage/gaps as the default shape. Place
sources beside the facts they support; add flow diagrams and model tables where
they explain a decision. Do not reproduce the tree as a second scenario inventory.

Walk each complete path using its stated fixture and actions: every step must accept
the state produced by the previous step and reach the asserted business outcome.
Derive entry-visible values and errors through the full adapter and translation
path, including transaction and exception wrappers that can change the response.
Resolve each executable branch's inherited facts under the atomic replacement rule.
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
an explicitly accepted temporary premise and the accepting owner. Keep unresolved
items and missing lower-layer tests visible without inflating the E2E tree.

Save Markdown as `.scratch/{feature}/e2e/{date}-{feature}-e2e-test-plan.md` unless the
user specifies a path, and link it in the reply. Produce its HTML view through
[../READER-VIEW.md](../READER-VIEW.md). A ready business plan can hand off authorized
execution while its view is being prepared; presentation work does not gate that
handoff. Planning alone authorizes neither test execution nor test-code changes.

## 5. Hand off to execution (run mode only)

Continue to execution only when the selected mode includes it.
Honor the user's scenario selection; otherwise begin with the first slice and
continue ready in-scope obligations under the same authorization. Execute only
scenarios carrying no `NEEDS-DECISION` or `BLOCKED` item. Report the missing decisions
or evidence for the others while continuing independent ready work.

Use [the execution handoff](../run/HANDOFF.md) for fresh context, the brief,
parent/executor responsibilities and the no-subagent fallback.
