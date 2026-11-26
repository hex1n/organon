# Coverage reference

## Coverage Models

Choose the applicable rows below and state the reason for the added analysis.
Unknown behavior remains a named gap, not proof of absence.

| Model | Build for | Record |
|---|---|---|
| State graph | Alternative transitions, async work, recovery, concurrency, or affected flows sharing state. | Entry, transitions and their conditions, produced/consumed state, completion observations, and source-backed dependency edges. A short ordered flow suffices for a linear path. |
| Input space | Several characteristics or partitions whose interactions can change outcomes or must preserve an invariant. | Characteristic, affected observable, feasible accepted/rejected blocks, boundaries and interior values, and constraints. |
| Decision logic | Overlapping rules, independent conditions, error precedence, or competing outcomes. | Rule/error, conditions, expected outcome, and judgment order. Each independent condition of an OR rule needs its own obligation. |

Cite shared sources once and link rows to them. Model business outcomes rather than
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
formal traceability.

| Requirement | Model / criterion | Obligation and observable | Layer | Coverage reference | Disposition |
|---|---|---|---|---|---|
| TR-001 | ... | ... | unit / integration / e2e | Scenario ID, inspected test assertion, or follow-up | covered / planned / infeasible / NEEDS-DECISION / BLOCKED / OUT-OF-SCOPE |

`covered` means mapped to a defined scenario or an inspected lower-layer assertion,
not executed. `planned` identifies a missing or uninspected lower-layer test, its
needed assertion, and next step. Keep it in gaps.

Keep IDs
stable when revising a referenced plan; document retired obligations when existing
references need them. Consecutive numbering is unnecessary. Old plans without layer
columns or a ledger remain valid; preserve their established coverage mappings.

### Operation coverage map

Use when the requested scope is a set of operations (endpoints, commands, jobs),
each of which must be accounted for. The map answers one question per operation:
which scenarios cover it.

| Operation | Positive coverage | Rejection, partial, and boundary coverage |
|---|---|---|
| `OP-07` cancelOrder | ORD-02 step 1 | ORD-02.B1, ORD-02.B2 |

A row holds the operation's stable ID, a short name, and scenario, step, or
variant IDs; an operation nothing covers names its gap. Expected results and
variants stay in the scenario blocks. A map that restates them hands the executor
a second, flatter list, and it runs that list instead of the journeys.

Write per-operation reference detail once, keyed by the same operation IDs:
qualified names, request and response types, legacy route signatures, source
locators. By default it is one reference table in the plan's coverage section, so
the plan stays a single file. Move it to an inventory file beside the plan when
the table would run longer than the scenario tree or a script generated it; name
the file and its contents in the overview so the run pins it with the plan. The
inventory holds reference detail only; behavior and expected results stay in the
scenario blocks. Write source locators relative to the repository root; the
plan's pinned revision fixes what they point at.
