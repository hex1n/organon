# Fault injection

Read before selecting or applying a fault.

Ask whether the checks would detect a plausible wrong implementation of an
affected property. Select faults from the behavior and its dependencies,
including relocated logic and retained guards, rather than changed lines alone.

Use an available native mutation tool when its operators fit the risk. A small
manual mutation is sufficient when it answers the question without introducing
tooling overhead. For recovery, retries, and concurrency, inject the relevant
dependency failure or controlled interleaving instead of forcing a source edit.
Place the fault where the correct and faulty implementations leave different
observable state. For rollback, the operation must change business state before
the failure; after an idempotent rerun or other no-op, omitted rollback leaves
the same state, so the check cannot detect it.

Reuse the successful build/test invocation, toolchain and resolved dependencies,
narrowed to the tests that observe the affected property; when that run still
takes minutes, batch the selected faults into as few runs as their isolation
allows. Preserve compile-time and runtime settings where they differ; a runtime launcher
shortcut does not establish that a separate compiler resolves the same dependencies.
Change only the fault and the source/output locations required by isolation.

Establish a passing unmutated control under the experiment's relevant settings.
Reuse a still-applicable receipt; a changed build/test entry needs its own control.

For each selected fault, introduce it in an isolated copy or test harness, confirm
the executed code includes it, observe its consequence, then remove or restore
only that experimental change. Preserve concurrent edits and keep experiments out
of shared installations, live data and live services. Confirm the actual
implementation passes after the experiments; an isolated batch can share this
final run while its source, inputs and environment remain applicable.

Compare each test's passing baseline with its fault result and the affected
property's assertion. Classify by cause; an exit code alone is insufficient.
A scripted batch records this for every fault.

- **Detected:** the intended check fails for the affected property.
- **Missed:** the fault is reachable and behaviorally meaningful, but the checks
  pass. Strengthen the observation or case and investigate the uncovered risk.
- **Not exercised:** the faulted path was not reached; coverage remains open.
- **Equivalent or irrelevant:** explain why the fault cannot violate this
  contract under supported inputs. Do not count it as detected.
- **Invalid or inconclusive:** compilation, an unrelated exception, the harness
  or a test double prevents observing the intended behavior, including an
  unprepared input the fault now reaches. Correct the experiment or report the
  limitation; this does not count as detection.

Investigate meaningful survivors rather than optimizing a score. A result
belongs to the exact test and implementation it ran against: editing,
renaming, or retargeting a test afterwards invalidates it, so rerun the fault
against the final test before citing it. Keep the property, decisive command
and result, and remaining gap with the task's evidence.
