# Review Lenses

Read triggered sections. Questions are probes, not finding quotas: establish the
production path and consequence under [SKILL.md](../SKILL.md#test-the-failure-hypothesis).
Skip irrelevant questions. In recorded reviews, headings are schema/validator
vocabulary: preserve them in briefs and coverage records. Ordinary prose reviews
need only the triggered sections, without an excluded-lens ledger.

## Error handling and fallbacks

Trigger: catches, error callbacks, retries, fallbacks, failure defaults or null-safe
navigation that skips an operation.

- Trace caught errors and carried state: can unrelated failures, partial writes,
  missed cleanup or defeated rollback become silent?
- Follow exhaustion/fallback to the caller. Distinguish valid defaults from stale,
  partial or fabricated success, including production falling back to test behavior.
- Check diagnostics for operation, identity and state, and user-facing errors for
  the failed action where it matters.

## Tests

Trigger: test/fixture changes, a new untested branch or changed harness.

- Locate the owning oracle. Follow each named variant into its production branch;
  fixture-only variation, a mocked core or fake-supplied output proves no core behavior.
- For rejection, remove the target guard conceptually or in an authorized probe.
  Another guard causing the same rejection leaves it untested; an unreachable input
  may expose a redundant guard. Apply SKILL.md's before/after reproduction rule.
- Check boundary fakes' generation, storage, read, identity, normalization, order and
  commit semantics. They can bypass the defect even with a real core; one fake for
  distinct APIs can hide calling the wrong one.
- Reconcile deleted, skipped or weakened tests with their owning obligations, and
  check shared-state, time, order and network dependencies.
- Check fixture/schema compatibility and value provenance: captured source, contract
  derivation or declared construction must reproduce expectations. False provenance
  exceeds a coverage gap.

## Comments and documentation

Trigger: comments/docs change, or code changes beneath existing text.

- Compare claims, examples and TODOs with behavior, signatures, effects and remaining
  work, including unchanged comments whose premises the change invalidates.
- Trace documented preconditions/invariants to their actual owner or enforcement;
  prose alone establishes no runtime guard.

## Types and invariants

Trigger: types, models, enums, state machines or values reaching a consumer change.

- Trace consumer assumptions to producers or enforcing boundaries, including the
  supported entry/writer; constructible instances alone prove no reachable defect.
- Check mutation and exposed mutable internals as well as constructors. Does the
  representation carry the invariant or permit contradictory state?
- Follow widened types, optional values and new variants to consumers, including
  switches/defaults that silently hide cases; name affected paths.

## Dependencies and configuration

Trigger: direct/resolved dependencies, build/CI settings, flags, environment variables
or defaults change.

- Inspect resolved versions and relevant release changes, including transitives;
  manifests alone do not show what moved. Separate bundled changes for attribution.
- Trace changed, renamed and removed settings through readers and deployments,
  including absent values, old-key users and untouched deployments affected by defaults.
