# Review Probes

Read the sections the operation or change reaches. These questions support the
two perspectives in [SKILL.md](../SKILL.md); use their answers to establish a
consequence or an explicit unknown. They are neither a finding quota nor a
mandatory checklist for every review.

## System behavior

**Selection and calculation:** distinguish the population selected from the
records used to calculate its result. Trace identity, units, precision, time,
ordering and aggregation grain through transformations. For alignment work,
compare equivalent inputs/state and preserve the target's semantic distinctions;
include affected outputs and retained branches, even after the first mismatch.

**State and effects:** identify the operation's commit boundary and observable
order. Follow partial writes, messages, external calls and cleanup through
failure, retry and cancellation. Establish which effects survive a reported
failure and which repetitions can repeat them. In concurrent paths, find the
actual enforcement point and test an allowed interleaving that could break it.

**Access and shared scope:** carry actor, object and tenant identity to the
effectful operation. Trace widened query scopes, shared caches and asynchronous
work; an earlier check protects the effect only while its assumptions remain
valid. Select scale or performance checks from the supported cardinality and
resource lifetime.

**Stored data and versions:** identify existing shapes from actual writers,
schema history or available records. Follow old data into new readers and new
writes into retained readers. Where deployment permits mixed versions, include
their coexistence, migration ordering and rollback compatibility. Distinguish a
guarantee for new writes from an invariant established for historical rows.

**Errors and defaults:** trace catches, retries, fallback values and skipped
operations to the caller and affected stores. A default may turn an unknown,
stale or partial result into apparent success. A later rejection cannot undo an
earlier effect; inspect the actual rollback and recovery boundary.

## Implementation and tests

**Rule ownership:** follow the same rule across entry points and consumers.
Determine whether similar code represents one obligation or independent rules
that happen to agree. Check where a future supported rule change would require
coordinated edits, caller knowledge or contradictory updates. An extraction earns
its cost when it hides coherent complexity or gives a rule one authoritative home.

**Representation and defense:** inspect constructors, mutation and exposed
internals as well as static types. Parallel maps, flags or parameters can allow
mutually inconsistent states. Compare enforcing the invariant at its owner with
reshaping the representation. Validate a claimed upstream guarantee on every
supported writer or entry the consumer accepts.

**Abstraction and cost:** identify the variation, lifecycle or caller obligation
that each layer, cache, intermediate state and extension point serves. Compare
removing it under the same requirements, including costs transferred to callers
and operators. Check resolved dependencies and effective configuration when
their semantics decide the behavior.

**Test oracles:** derive expected values from business rules or supported data,
then trace assertions into the real production branch. Distinguish exact values
from formatted output, final state from call counts, and failure behavior from
setup errors. Limit test conclusions to the decisive behavior actually exercised.
If a fake omits boundary semantics the claim needs, resolve that gap with other
applicable evidence or leave the claim unverified. Fakes must reject unprepared
reads. Where provenance rules permit constructed cases, name their derivation and
limits.

**Ablation and mutation:** state the disputed necessity or plausible mistake
before changing the validation copy. Preserve required observations and vary the
deciding mechanism. A second guard producing the same rejection can hide an
untested first guard; deletion passing tests can reveal either redundancy or a
missing oracle. A failure caused by missing data, compilation or harness setup
does not show detection of the intended business fault.

**Comments and contracts:** compare documented claims and preserved comments
with current signatures, behavior and remaining work. A stated precondition
needs an actual enforcing owner when correctness depends on it.
