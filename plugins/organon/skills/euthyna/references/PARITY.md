# Alignment and Parity Review

Use for requested alignment to a reference implementation, specification, migrated
system or earlier version. [SKILL.md](../SKILL.md) still applies.

## Authoritative target

Identify the authoritative target and explicit exceptions before deriving checks.
An unresolved conflict with a preservation requirement is a user decision, not an
assumed exemption for old behavior.

## Obligation ledger

Derive affected observable outputs from the request and target contract, including
unchanged fields and branches. Compare equivalent inputs/state while retaining
the target's semantic distinctions: absent/default, instantaneous/cumulative and
identity/display values are not interchangeable.

Record each obligation in the report's parity ledger: expected, actual, and deciding
evidence or gap. One corrected field or first finding leaves other obligations open.
A pre-existing mismatch the requested alignment must remove is still an unmet
delivery requirement; report origin separately from that obligation.

## Acceptance

Review and re-review reconcile every obligation, unchanged output and remaining
gap before acceptance. An open obligation is a coverage limit, not a pass.
