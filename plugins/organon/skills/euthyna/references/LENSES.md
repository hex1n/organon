# Review Lenses

Read sections whose triggers apply. Each question is a probe, not a required
finding: establish its production path and consequence under
[SKILL.md](../SKILL.md#test-the-failure-hypothesis). Skip questions irrelevant
to the change. Headings are a shared schema/validator vocabulary; preserve them
in briefs and coverage records.

## Error handling and fallbacks

Trigger: catches, error callbacks, retries, fallbacks, defaults on failure,
or null-safe navigation that skips an operation.

- Trace the errors caught and the state carried forward. Can an unrelated
  failure, partial write, missed cleanup or defeated rollback become silent?
- Check where exhaustion and fallback reach the caller. Distinguish a valid
  default from stale, partial or fabricated success, including production paths
  falling back to test behavior.
- Check that diagnostics identify the operation, relevant identity and state,
  and that user-facing errors explain the failed action where it matters.

## Tests

Trigger: test or fixture changes, a new untested branch, or a changed harness.

- Locate the owning test for each changed behavior. Inspect its deciding
  predicates against a relevant violation and a contract-preserving change:
  the violation must fail and the valid change must pass.
- Follow each named variant into the production branch it claims to cover.
  Fixture-only variation, a mocked core, or an output supplied by the fake
  cannot establish the behavior that production owns.
- For rejection tests, remove the targeted guard conceptually or in an
  authorized probe. Another guard producing the same rejection leaves it
  untested; a shape production cannot deliver may reveal a redundant guard.
- For reproduction, reverting the fix must expose the target failure. A test
  passing both versions may protect behavior without reproducing the defect.
- Check that boundary fakes preserve the generation, storage and read semantics
  deciding the result. Identity replacement, normalization, ordering or commit
  behavior can bypass the real defect even with a real core. One identical fake
  for distinct APIs can hide a call to the wrong one.
- Reconcile deleted, skipped or weakened tests with the obligations now covered.
  Check relevant dependence on shared state, time, order and network.
- Verify fixture/schema compatibility and value provenance: a captured source,
  contract derivation or declared construction must reproduce the expected
  value. A false provenance claim is more than a coverage gap.

## Comments and documentation

Trigger: comments or docs changed, or code changed beneath existing text.

- Compare claims, examples and TODOs with current behavior, signatures,
  side effects and remaining work. Include unchanged comments whose premise
  the code change invalidates.
- Trace documented preconditions and invariants to their actual owner or
  enforcement; prose alone does not establish a runtime guard.

## Types and invariants

Trigger: types, models, enums, state machines, or values reaching a consumer change.

- Trace each consumer assumption to its producer or enforcing boundary.
  Establish the supported entry or writer before treating a constructible
  instance as a reachable defect.
- Check mutation points and exposed mutable internals as well as construction.
  Consider whether the representation carries the invariant or lets callers
  express contradictory state.
- Follow widened types, optional values and new variants to actual consumers.
  Name the affected paths; check switches and defaults for silently hidden cases.

## Dependencies and configuration

Trigger: direct or resolved dependency changes, build/CI settings, flags,
environment variables or defaults.

- Compare resolved versions and relevant release changes, including transitives;
  a manifest alone does not show what moved. Separate bundled changes when
  attribution affects diagnosis.
- Trace new, changed, renamed and removed settings through readers and
  deployments. Establish absent-value behavior and who still uses old keys;
  a changed default can affect deployments that never set it.
