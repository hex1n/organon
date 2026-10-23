# Verification techniques

Read the section for the selected technique. These techniques supplement the
behavioral and structural verification chosen in [Tekton](../SKILL.md).

## Writing tests

A test is an oracle: it goes red for the real reason. After writing an
assertion, substitute the most plausible wrong implementation and confirm the
test goes red ([Checking the oracle](#checking-the-oracle)).

- **Real core, faked boundaries.** Execute the logic under test for real. Fake
  only data boundaries (external data access, clocks and calendars,
  configuration), and back each fake with a captured real fact. Data-reading
  fakes fail on unprepared input; an empty default return fakes a kill.
- **Real values.** Assert amounts, counts and ordering by their expected values,
  and an error by its code rather than its message. For stored effects, diff each
  business table or store against the expected final state, with a stable sort
  and non-business timestamps removed; a failure scenario asserts zero diff on
  every business store. Non-null checks and call counts are not coverage.
- **The owning boundary.** One contract has one owning test at the strongest
  boundary; another layer earns a test only for a risk the owner cannot reach,
  such as transport or lifecycle. Extend the owner's table case or shared fixture
  rather than adding a near-duplicate, and merge the setup a change duplicates.
  Test through the boundary production calls: a test that needs an export, flag,
  wrapper or hook no production caller uses moves there, while an existing test
  on such a seam stays until a change touches it. A self-test entry or export
  that a tool documents as its contract surface is a production boundary. Production code a
  change leaves with only test callers is deleted with those tests.
- **Behavior over implementation.** A test that a behavior-preserving refactor
  would break is rewritten at the owning boundary before it lands. Assert a
  detail only when it is the contract: call order a caller observes, or a
  user-facing key, byte or path a source check guards most cheaply. An existing
  implementation-shaped test stays until the contract it fails to guard is named.
- **Real samples.** When the project has a real data source, survey it for the
  target shape (existence, count, distribution) before deriving expected values,
  pick one real sample, and take its whole record set plus the prior state it
  reads. Keep real values unmodified and uncombined across samples, and give
  every fixture value its provenance: a named real record or a stated
  derivation. When a fault cannot be told apart on real data, report it as
  indistinguishable rather than inventing data to detect it.
- **Test docs.** A method-level doc in a test carries only three things: how
  the shape is built, where each expected value comes from, and why a real
  sample cannot produce the shape. Design argument and review history stay out
  of tests.

## Checking the oracle

Derive the assertion from the contract. For a structural check, identify the
required roles and relationships, then try a relevant change that preserves them.
If the check rejects incidental naming, syntax or layout, narrow it to the
required property. A spelling or representation is fixed only when the contract
fixes it. Accept a dependency-direction change by the module-level reference
graph, re-exported after the change, not by type names.

At a deciding test-double boundary, preserve generation, storage and read
semantics: identity creation, order, normalization, replaced or retained fields,
and transaction effects. Use the real boundary when the fake cannot reproduce
the deciding behavior; keep unavailable semantics explicit.

Pair the contract-preserving change with a plausible contract violation. Passing an
equivalent change alone does not show that the check detects a defect; a rejected
defect alone does not show that the check permits valid implementations.
Keep the source, inputs and controls with the verification evidence.

## Targeted mutation and fault injection

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

Reuse the successful build/test invocation, toolchain and resolved dependencies.
Preserve compile-time and runtime settings where they differ; a runtime launcher
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

## Measured numbers

Match the measurement to the claim. Reuse the repository's measurement protocol
when it establishes the relevant properties below. A requested rough estimate
may use one run: check correct output, errors, and completed work, label it
single-run, and leave variation and any unknown limiter explicit. It does not
establish which alternative is better.

- **Comparable work.** Record each side's source revision, dependency versions,
  build mode, configuration, workload, data, concurrency, and cold or warm state.
  Control differences outside the claim; different revisions are expected in a
  before/after comparison. Use production-relevant settings. An as-shipped
  comparison may intentionally retain default settings; attribute its result
  to those configurations rather than to implementation alone.
- **Correct work completed.** Check outputs, errors, and actual completed work
  on both sides. Confirm the timed region consumes lazy results and awaits
  completion; count skipped, cached, rejected, and timed-out work separately
  where they change the claim. Faster failure or omitted required work is not
  an optimization of the same operation.
- **Timing and variation.** Profile separately from reported timing. For a
  comparison, choose repetitions within the run budget, interleave the sides
  to reduce warm-up and drift bias, and report the unit, run count, median and
  spread. A noisy or insufficient sample leaves the ranking inconclusive.
- **Limiter and bounds.** Observe the resource or path limiting the result,
  including the load generator. An unknown limiter leaves the causal
  explanation open. Check the number against resource limits and the changed
  work's share, stating the assumptions. If an independently removed part took
  fraction p (0 <= p < 1) of the original time for a fixed workload and the
  rest is unchanged, time falls by at most p of its original value. Throughput
  is at most 1 / (1 - p) times its original value. An apparent violation calls
  for checking timing scope, caching, work counts and other changed factors.
- **Claim boundary.** Keep a microbenchmark result local until a representative
  user-facing workload establishes its end-to-end effect. Report a sound local
  result when that larger path is unavailable, naming the unverified impact.

Lead with the supported verdict: faster, slower, no measurable difference, or
inconclusive. Keep observed differences separate from causal explanations.
Missing correctness, completion, or comparable conditions prevents an
optimization verdict; report the observations and the unresolved condition.
