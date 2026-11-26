# Measured numbers

Read before reporting a measured number.

Match the measurement to the claim. Reuse the repository's measurement protocol
when it establishes the relevant properties below. A requested rough estimate
may use one run: check correct output, errors, and completed work, label it
single-run, and leave variation and any unknown limiter explicit. It does not
establish which alternative is better.

- **Comparable work.** Report each side's source revision, dependency versions,
  build mode, configuration, workload, data, concurrency, and cold or warm state
  alongside the numbers in the delivery.
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
