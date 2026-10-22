# Planning reference

The planning workflow lives in `PLAN.md`. Read Coverage Models for interacting
coverage obligations and Effective scenario facts when writing the scenario tree.

## Coverage Models

Use explicit models when interactions make omissions hard to see in a short tree.
Choose the applicable rows below and state the reason for the added analysis. Leave
unused models absent; unknown behavior remains a named gap, not proof of absence.

| Model | Build for | Record |
|---|---|---|
| State graph | Alternative transitions, async work, recovery, concurrency, or affected flows sharing state. | Entry, transitions and their conditions, produced/consumed state, completion observations, and source-backed dependency edges. A short ordered flow suffices for a linear path. |
| Input space | Several characteristics or partitions whose interactions can change outcomes or must preserve an invariant. | Characteristic, affected observable, feasible accepted/rejected blocks, boundaries and interior values, and constraints. |
| Decision logic | Overlapping rules, independent conditions, error precedence, or competing outcomes. | Rule/error, conditions, expected outcome, and judgment order. Each independent condition of an OR rule needs its own obligation. |

Each row distinguishes the expected authority from implementation evidence. Cite
shared sources once and link rows to them. Model business outcomes rather than
internal call stacks. A changed contract may span files, and a shared file may
affect several contracts; direct-flow coverage does not close neighboring flows.

Trace a shared change as:

`changed contract/state/data → writers/readers/callers/subscribers → affected flow → outcome`

Include relevant modes and alternate entry, scheduled, callback, retry, recovery,
administrative, reporting, and compatibility paths. Make unresolved reachability or
scope explicit. Concurrent flows belong at the shared transition; recovery belongs
at the failure it repairs. Independent outcomes may use separate tree roots.

Partition relative to the observable: an input can preserve one field and change
another. Different views of one characteristic are not separate variables to
cross-combine. Distinct account classes, business modes, or settlement timings need
distinct blocks when their contractual outcomes differ.

### Coverage criteria

Choose a criterion for each built model and state any weakening with its residual
risk. Start with these defaults:

| Model | Default obligations |
|---|---|
| State graph | Every trunk edge and affected flow; the Happy Path exercises the producer flow for prerequisites it creates. Include identified ordering, recovery, and consistency risks. |
| Input space | Base-Choice: a feasible accepted base tuple, then each accepted non-base block with other characteristics held at compatible base values. Cover rejected blocks separately. For source-backed interactions, use All-Combinations for up to three coupled characteristics, Pairwise for larger interaction sets. |
| Decision logic | Each rule, error code, and independently firing condition, plus precedence where rules overlap. |

Represent each instance selected under the criterion with its conditions and
observable: Base-Choice tuples, feasible pairs for Pairwise, complete feasible tuples
for All-Combinations, or rule/transition assertions. Give each a coverage reference
or explicit gap; a criterion name or rule summary is not that mapping. Mark infeasible
combinations with their constraint. A negative assertion cannot close an accepted
outcome. Merge obligations one test can satisfy, preserving which ones it proves and
the independent expected result.

### Test-requirement ledger

Use a ledger when a selected criterion generates combinations or many-to-many
mappings that are hard to inspect in the tree, or when the user/consumer requires
formal traceability. A small model with direct mappings can use annotated scenarios
and coverage notes. Recording more tables is not itself stronger coverage.

| Requirement | Model / criterion | Obligation and observable | Layer | Coverage reference | Disposition |
|---|---|---|---|---|---|
| TR-001 | ... | ... | unit / integration / e2e | Scenario ID, inspected test assertion, or follow-up | covered / planned / infeasible / NEEDS-DECISION / BLOCKED / OUT-OF-SCOPE |

`covered` means mapped to a defined scenario or an inspected lower-layer assertion,
not executed. `planned` identifies a missing or uninspected lower-layer test, its
needed assertion, and next step. Keep it in gaps. Framework names and file paths
alone do not prove coverage. Preserve the requested boundary and distinct system
risks when allocating local permutations to lower layers.

Every covered ledger row resolves to a scenario that cites it or an inspected test
that asserts it; every scenario requirement link resolves back to its row. Keep IDs
stable when revising a referenced plan; document retired obligations when existing
references need them. Consecutive numbering is unnecessary. Old plans without layer
columns or a ledger remain valid; preserve their established coverage mappings.

## Effective scenario facts

Each executable scenario has a purpose and these effective facts. They describe
the business case; their headings are not a template to repeat at every tree node.

| Fact | Required content |
|---|---|
| Preconditions | Concrete starting state and inputs, or deterministic construction/selection rules; predecessor scenario IDs only where genuinely required. |
| Actions | Ordered business actions through a source-backed entry or adapter, naming the stable operation and its inputs. |
| Observes | Final contractual observation and completion predicate. Record an approved product time threshold, or `business threshold: none specified`. |
| State Footprint | Resources read, written, and external effects; `none` for an empty class. Every writable/external target names provenance or ownership and allowed lifecycle: `retain`, `restore`, or `delete`. |
| Capabilities | What judging this scenario needs beyond the entry under test — the probes its observations read and the access they require; `entry only` when the response settles it. Execution selects against this, so a session lacking one blocks that scenario by name instead of discovering it mid-run. |
| Expected Results | Concrete values, errors, or invariants that distinguish correct from incorrect behavior. |
| Oracle / Expected Authority | `specified` for approved expected values, or `derived` for an independent reference/relation; name the governing source, revision, and calculation. |
| Implementation Evidence | Locators supporting the entry, state, observation, and footprint; these establish mechanics, not business correctness. |

The first five facts are the execution anchors. Resolve business facts here; the
execution stage resolves live targets, credentials, commands, safety wait bounds,
owner markers, and cleanup implementations. Keep a known project command when it
is the stable entry interface. Missing business decisions stay `NEEDS-DECISION`;
missing source anchors stay `BLOCKED`. Either can be planned, but neither is
execution-ready.
