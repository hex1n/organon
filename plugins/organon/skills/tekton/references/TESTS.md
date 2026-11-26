# Tests

Read before writing or changing a test, and before judging a structural check,
a test double or a reduced context such as a slice.

## Writing tests

A test is an oracle: it goes red for the real reason. See a new or changed
test fail without the change it covers, in either order of writing.

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

At a deciding test-double or reduced-context boundary, preserve the conditions
that select behavior as well as its data semantics: competing implementations,
lifecycle and interception, identity creation, order, normalization, replaced or
retained fields, and transaction effects. Check what the substitution removes from
the production path. Use the real boundary when the reduced one cannot preserve
the condition under test; keep unavailable semantics explicit.

Pair the contract-preserving change with a plausible contract violation. Passing an
equivalent change alone does not show that the check detects a defect; a rejected
defect alone does not show that the check permits valid implementations.
Save the source, inputs and controls in the task folder `.scratch/YYYYMMDD-task-name/`.
