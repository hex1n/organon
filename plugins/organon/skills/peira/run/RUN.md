# Execution stage

Run the selected scenarios, establish their verdicts, and leave enough evidence to
understand and repeat them. Prefer the project's existing harness or adapter. Product
fixes require their own authorization. Record defects in local issue files linked
from the report; this workflow never creates issues on a remote tracker.

Keep each scenario this run executes as a runnable file under
`docs/verify/scenarios/{feature}/`, named by its ID, that calls the harness's drive
and state-read recipes, so the next run repeats it with one command. Write it for
the strictest target: it asserts only on records it created, found by the run's own
marker, never on a table's or a list's total, so the same file runs on a local
target and on the shared environment; one that needs a capability some target
lacks, such as restarting the service, says so in its first lines. Adding it to the project's own test suites or
committing it needs the user's authorization; a plan's coverage or automation label
is not that authorization.

Use the user's requested language, otherwise the plan's language, then the prior
report's, then the user's prompt. Localize headings and prose; preserve IDs, commands,
status tokens, and raw evidence. Delegation-message language does not change the
intended audience.

## 1. Select and pin the run

Read the upstream plan or report and the latest user constraints before touching the
system. A selected scenario with a kept file under `docs/verify/scenarios/` runs
from that file on the chosen target; where the file and the plan differ, record a
plan gap before the run. Resolve an `execution-anchors/v1` plan's fields and variants with
[scenario-tree inheritance](#scenario-tree-inheritance) below. For a continuation,
read [CONTINUE.md](CONTINUE.md).

Honor an explicit scenario subset. Otherwise select the plan's obligations at the
requested execution boundary, begin with the first slice it names, and continue
ready scenarios by priority when the plan states one, otherwise in tree order. The
first slice sets execution order; it is not the whole request's
completion boundary. Keep unavailable in-scope obligations visible as gaps.
Record selected IDs and exclusions before execution. Lower-layer test mappings,
operation-map rows, and unimplemented follow-ups are coverage context, not extra
E2E scenario nodes. Selecting
a subset preserves its shared prerequisites and safety gates.

Select by the plan's scenario and variant IDs. Establish each selected ID's
Capabilities before finalizing selection.
If the plan lacks that anchor, derive the capabilities from its preconditions,
observations, and footprint.
Hold an ID that carries a plan `NEEDS-DECISION` or `BLOCKED` item or needs a missing
capability, and every ID whose path runs through it, before running its trigger; a
base scenario and sibling variants whose own paths are complete stay selected. A
held ID the user selected is recorded `blocked` with no trigger run; otherwise it
is listed with the exclusions and what it is missing.
If the reachable evidence establishes only part of an expectation, narrow the
claim to that part and keep the rest as a gap. A narrowed claim does not pass
the whole scenario.

Resolve each selected scenario's starting inputs/state, legitimate trigger, final
observation/completion predicate, expected result and authority, and resources it
reads or changes. `execution-anchors/v1` plans supply these as Preconditions, Actions,
Observes, State Footprint, and Capabilities plus verdict facts: the trigger comes
from Actions, probe and wait from Observes, inputs and dependencies from
Preconditions, ownership and lifecycle from State Footprint. Mark derived mechanics
in the report. Missing business authority or a missing or contradictory marked
anchor is a plan gap, never repaired silently from current code; missing live
commands, credentials, probes, or fixtures is an execution blocker. Derive
mechanics from available sources before asking for facts; keep unresolved facts
explicit.

An entry named in a plan is proposed mechanics, not proof of the caller's route.
For a user journey, establish how that actor and starting state reach the selected
entry from caller or dispatch evidence. When several entries reach shared business
logic, compare the prerequisites they enforce before that common path; tracing only
downstream effects cannot establish their equivalence. An unresolved caller mapping
leaves the journey unverified; a scoped lower-layer run can still establish its own
results. Choose an oracle that proves the requested property: matching stored values
does not establish the caller's response contract. For migration equivalence, compare
old and new observations at that boundary, or use an independently specified contract;
normalize only approved differences.

**Preserve expected-result authority.** Pin approved expectations and completion
predicates to their source/revision. Code changes can refresh stale locators and
commands, never approve their own changed behavior. Change an expectation only from
a new approved authority or explicit user override; record old/new values, source,
and affected scenarios. If code is the designated contract, use its approved revision.
Unknown authority permits characterization, not a business-correctness pass.

Pin the upstream artifact, and each inventory file it names, by path and content
hash in the report's run context. Retain the consumed expectations in each
scenario's record in the report; the hash stands for the rest of the plan. Create
a fresh run directory under the user's output path, or use
`.scratch/{feature}/e2e/runs/{yyyymmdd-hhmm}/` by default, with an optional short
`-{slug}` after the timestamp; if it exists, choose the next free `-2`, `-3`
suffix. Keep historical runs immutable.

Record these facts as work proceeds in
`{yyyy-mm-dd}-{feature}-e2e-test-report.md` inside the run directory, in the format
[REPORTING.md](REPORTING.md) names.

### Scenario-tree inheritance

This is the one statement of how a plan's facts resolve; the planner writes to it.

Resolve shared fields from root to leaf: an omitted field inherits the value of
the nearest ancestor that defines it; a defined field replaces the whole value.
Partial append/delete inside an inherited field is invalid; a field that only
points at its parent inherits like an omitted one. A reference to a named fixture,
route, footprint, or assertion set with parameter values is a complete value:
resolve it from that definition with those values, together with any condition
the field states beside it.

A variant row is the base scenario's whole path with one change: the base's
effective facts, with the row's changed condition applied at the step it names (an
input replaced, a step replaced, or a step inserted) and the row's expected
results replacing the base's Expected Results. The other steps still run, so the
base's Observes still completes it. A row that names another variant as its
starting state resolves from that variant first. A variant written as its own
block resolves like any child of the base. A row whose step, input, or starting
state cannot be told, or whose change makes the base's Observes unreachable, is a
plan gap.

Match a fact by its English name. An older plan may use one fixed localized label
per fact, and a merged label there supplies each fact it names. Priority,
business-step IDs, requirement links, layer-allocation tables, and a formal ledger
are optional annotations.

## 2. Resolve the execution context

Confirm a local or test target from effective configuration and actual connectivity,
not a profile name. Start from the project's harness (`docs/verify/HARNESS.md`),
written first in [harness mode](../harness/HARNESS.md) when the repository has
none, on the cheapest target it lists where everything deciding the selected
outcomes is real. When no listed target can run them, the place this
run builds is the next run's target, whatever module that run covers: take its
parts from the application's own configuration, with the module to load as a
parameter, write its launch, drive, and teardown scripts under `docs/verify/` from
the first file, with paths, ports, and the operation to drive as parameters and
the scenario's steps kept out of them, start it once for every scenario it can
serve, and add its
[row](../harness/HARNESS.md#2-write-docsverifyharnessmd) to the harness with this
run as its record. Where the run contradicts an existing harness entry, record
harness drift in the report's run context and the delivery, naming harness mode as
the refresh; the run changes no existing entry. Restricted staging or
production requires explicit instructions for that environment before proceeding.
Record the actual entry/harness, relevant
runtime identity, and proof that the tested process/artifact is the intended build.
A reachable endpoint alone is insufficient; a local command can use the source bytes
it actually loads, while a service needs deployed-version or discriminating evidence.

Name reached dependencies as real or declared doubles and make their effect on the
verdict visible. A short context note suffices for a simple command. Only inspect
capabilities and environment fields the selected scenarios use.

Read the applicable sections of [EXECUTION.md](EXECUTION.md) before business writes,
asynchronous work, inter-scenario dependencies, retained-state cleanup, or environment
repair beyond an already-ready harness. Those branches add ownership, setup, waits,
and scheduling detail. Default to serial; independent read-only scenarios need no
DAG table, ownership ledger, seed script, or cleanup script.

## 3. Execute, observe, and classify

Judge the completed contractual outcome. A synchronous query/calculation can finish
in its full response. Compare it with an independently computed approved expectation;
the response cannot supply its own expected value. For persistent writes, read the
required committed state before cleanup; for async effects, observe the completion
predicate. Acceptance alone cannot prove those outcomes. A rejection promising
unchanged state also requires that invariant checked by a before/after or other
independent probe, even when the error response is correct. An absence claim — no write, no
log line, no event — is proven by the probe that would have found it and that probe's
empty result, retained like any other observation. A path established as read-only
needs no invented datastore or zero-write probe unless requested or a write risk exists.

For each executed scenario retain, together:

- exact trigger/probe commands or adapter invocations and concrete inputs;
- raw output, inline or in a linked attachment, with relevant entity/correlation IDs;
- expected versus actual, the governing authority or independent derivation, and the
  observed assertion result. Persistent-state proof includes the pre-cleanup read and
  output; response-only proof includes the independent calculation/reference context.

On a target the run owns and can start again, the rerun command stands in for
retained raw output: keep expected versus actual for each assertion, what the
driver records by itself, and failure scenes. Hashes, process and network
snapshots, and receipts are for what a rerun cannot reproduce: a shared
environment's state, asynchronous timing, an intermittent result.

Capture volatile failure scenes immediately, before retries or cleanup can destroy
them. Include the state, events, logs, and configuration needed to reproduce the
observed mismatch; redact secrets while preserving usable reproduction identifiers.
A batch command/output may serve several scenarios when each assertion points to its
own slice. A child exit code alone is not proof of all its scenario outcomes.

| Status | Meaning |
|---|---|
| `passed` | The established expected outcome and required evidence are satisfied. |
| `failed` | Valid observation proves a violation of an established expectation. |
| `blocked` | A required starting condition, capability, authority, or completion observation prevents a verdict; say whether a trigger occurred. |
| `skipped` | A selected scenario deliberately not executed, with a reason. |
| `unverified` | Execution occurred but retained evidence or a valid oracle is insufficient. Never use for an unexecuted case. |

Each selected ID has its own record and status: a base scenario's covers its own
Expected Results, and each variant is judged separately. A status aggregates its
ID's Expected Results one by one: `passed` needs every
result satisfied with its own evidence; one violated result makes the scenario
`failed`; one result lacking a valid observation or oracle caps it at `unverified`.
An expectation corrected under §1 is judged by its corrected value.

Name the oracle `specified` (approved expected value), `derived` (independent
reference, invariant, differential, or metamorphic calculation), or `implicit`
(only no-crash/no-error). An implicit or circular oracle is at most `unverified`.
Classify deficits as `product`, `plan`, `environment`, `tooling`, or `unknown` and
retain their actionable cause once. A process failure or inaccessible dependency is
not automatically a product defect. Retry an intermittent result at most once for
diagnosis, preserving both outcomes; later success never erases the first failure.
When a supported finding needs correction or resolution, follow
[Defect Handoffs](ISSUES.md#defect-handoffs) to persist its local issue record.

## 4. Deliver the result

Read [REPORTING.md](REPORTING.md) when assembling the report and before cleanup: it
sets the report's contents and final reconciliation.

Completion means every selected ID has an honest terminal status and proof or an
explicit deficit; any retained data has an allowed lifecycle; evidence, current
source/build identity, and rerun instructions agree. State whether the requested
business outcome is covered and name remaining obligations; a completed slice with
gaps is a partial result.
