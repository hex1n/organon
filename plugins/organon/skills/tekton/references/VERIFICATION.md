# Verification techniques

Read the section for the selected technique. These techniques supplement the
behavioral and structural verification chosen in [Tekton](../SKILL.md).

## Checking the oracle

Derive the assertion from the contract. For a structural check, identify the
required roles and relationships, then try a relevant change that preserves them.
If the check rejects incidental naming, syntax or layout, narrow it to the
required property. A spelling or representation is fixed only when the contract
fixes it.

Inspect a test double at the boundary whose behavior the conclusion depends on.
Preserve the relevant generation, storage and read semantics: identity creation,
ordering, normalization, the fields a write replaces or keeps, or transaction
effects. Run that boundary
for real when the fake cannot reproduce the deciding behavior. Keep unavailable
semantics explicit rather than treating the substitute's result as proof.

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

For each selected fault:

1. Run the baseline on the unmutated code and confirm the intended checks
   execute and pass. Only a passing check can detect a fault.
2. Introduce one representative fault in an isolated copy or test harness.
3. Confirm the code under test includes the fault and the intended observation
   detects its consequence.
4. Remove or restore only that experimental change, then rerun the check on the
   actual implementation.

Keep experiments out of shared installations, live data, and live services.
Preserve concurrent edits when restoring a local experiment. A compile failure,
unrelated exception, or harness failure does not show that a behavioral check
detects the intended defect.

Interpret each result by cause. A verdict is differential and per test: the
test passed on the baseline and fails on the fault, on the assertion for the
property under test; an exit code only locates a failure. A scripted batch
records this for every fault.

- **Detected:** the intended check fails for the affected property.
- **Missed:** the fault is reachable and behaviorally meaningful, but the checks
  pass. Strengthen the observation or case and investigate the uncovered risk.
- **Not exercised:** the faulted path was not reached; coverage remains open.
- **Equivalent or irrelevant:** explain why the fault cannot violate this
  contract under supported inputs. Do not count it as detected.
- **Invalid or inconclusive:** the fault or execution failed before the intended
  behavior could be observed, including a harness or test double lacking the
  input the fault now reaches. Correct the experiment or report the limitation.

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
  is at most 1 / (1 - p) times its original value. For p = 0.10, those are
  10% less time and about 11% more throughput. An apparent violation calls for
  checking timing scope, caching, work counts, and other changed factors.
- **Claim boundary.** Keep a microbenchmark result local until a representative
  user-facing workload establishes its end-to-end effect. Report a sound local
  result when that larger path is unavailable, naming the unverified impact.

Lead with the supported verdict: faster, slower, no measurable difference, or
inconclusive. Keep observed differences separate from causal explanations.
Missing correctness, completion, or comparable conditions prevents an
optimization verdict; report the observations and the unresolved condition.
