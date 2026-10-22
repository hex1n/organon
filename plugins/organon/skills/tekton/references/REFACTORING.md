# Refactoring

Use this branch for structural improvement with preserved behavior. It extends
the implementation loop in [Tekton](../SKILL.md). For compatibility or data
migration alone, start at [Choose the transition](#choose-the-transition) and
apply the migration and removal guidance to the requested outcome.

## Define the targets

Establish three things before restructuring:

- **Structural target:** an observable before-to-after change, such as one rule
  owner, fewer caller obligations, a removed dependency cycle, or fewer places
  that must change together. “Cleaner code” needs a concrete interpretation.
- **Preserved behavior:** results, errors, effects, ordering, performance,
  operations, and compatibility that must continue to hold.
- **Removal target:** the obsolete path and temporary structures that should
  disappear, including any external condition that delays their removal.

Characterize preserved behavior through the current interface; the contract in
Tekton governs intended changes. Each artifact serves a target or its transition.

## Separate movement from meaning

Separate mechanical movement from changes to state meaning, errors, order,
effects, compatibility or caller obligations when that makes equivalence easier
to establish. Otherwise state and verify both obligations. A new decision owner
needs structural evidence even with unchanged behavior; moved lines alone do
not make a slice mechanical.

## Choose the transition

Select the simplest shape supported by actual callers, release boundaries,
stored data, effects, and recovery needs:

| Shape | Use when | Exit |
| --- | --- | --- |
| Direct replacement | All affected callers can move atomically | Old path removed; behavior verified at the target interface |
| Parallel change | Callers adopt an interface at different times | Callers migrated; compatibility surface removed |
| Branch by abstraction | An internal replacement must evolve behind a stable interface | Old adapter removed; temporary seam collapsed or justified by continuing variation |
| Strangler | A routed or deployable capability moves by operation or cohort | Intended traffic migrated; old route retired |
| Expand, migrate, contract | Stored or serialized representations span releases | Readers and writers converge; data verified; old representation retired |

For each meaningful stage, establish:

- which callers, versions, and data can coexist;
- which path owns each decision and effect;
- what observation demonstrates that the stage succeeded;
- how to recover if it fails, given the state it may already have written.

Verify behavior, structural obligations and recovery before advancing the stage.

Introduce compatibility before a stage relies on it. Check reachable mixed
states, including older readers and writers that may still be active. Expand
before migrating data; contract only after the remaining consumers and recovery
requirements permit it.

Shadow or differential execution is useful only when duplicate effects are
suppressed or isolated. Keep one authoritative result and effect path while
comparing observable behavior.

Track each temporary surface's purpose, accountable owner, removal condition and
safety evidence in existing task records. Keep removal pending while the owner
or exit is unknown; continue independent reversible preparations.

## Migrate and recover

After migration slices, check for duplicated rules and new consumers of the old
path. Stop advancing the affected migration on an unexplained mismatch. Resolve
it as a defect, an intended change, or a missing authority decision before moving
more consumers; continue work independent of that mismatch.

Code rollback works only while code, data and emitted effects remain compatible.
Otherwise establish a tested forward repair, restore or compensation path for
the actual state. Prepare and test recovery in the authorized environment;
deployment, destructive data changes and live recovery require authorization.

## Verify the targets and remove obsolete paths

Check the targets on final code: intended decision owners and dependency
direction, reduced caller obligations and complexity hidden by the interface.
A facade that leaves all caller knowledge in place has not met that target.
Verify preserved results, errors and effects through the target interface.

Use searches and appropriate runtime or consumer evidence to establish safe
retirement; unresolved external exits retain their compatibility surface.
Remove obsolete implementations, expired adapters and flags, generated artifacts
and tests tied solely to retired internals. Preserve behavioral cases at the
target interface and rerun affected checks after removal. Report remaining stages
and exits under Tekton's hand-off rule.
