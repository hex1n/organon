# Continue a prior run

Read for a continuation of an earlier run or an authorized repair loop. Selection,
inheritance, expected authority, source pinning, and run-directory rules live in
`RUN.md`.

Read the previous report and the original plan before acting. Create a fresh
continuation directory under `RUN.md`'s path rules; never rewrite historical
reports, evidence, or helpers. Back-link both sources and pin the current consumed
source revision. Carry forward applicable user overrides and retained-state facts.

## Choose and validate the continuation

Without an explicit scenario selection, resume the requested
outcome's outstanding obligations, including in-scope scenarios never selected or
executed in the previous slice. For focused fix verification, select previous
`failed`, `blocked`, and `unverified` scenarios plus dependents that consumed the
fixed behavior. Explain affected dependents excluded by the requested scope; do not
claim their regressions were checked. Expand to the entire plan only when impact or
the user requires it.

Re-derive only mechanics invalidated by changed code, environment, or evidence.
Resolve a never-executed dependent from the
same anchors as any other scenario, preserving the safety edges its plan records.

Prove the fix is loaded in the actual command/process before judging it. Use the
expected version, loaded source/build identity, or a discriminating behavioral
fingerprint. Reuse prior metadata only
when it still describes the effective target.

Read retained identifiers, ownership, TTL, cleanup commands, and do-not-clean items
before creating or reusing fixtures. A previous failure becomes passed
only with this run's fresh outcome and retained proof. Record the new disposition
and evidence here while preserving the original verdict.

## Authorized repair loops

For an explicit iterate-until-green request, retain each
iteration's report as an immutable handoff. Continue from actionable defects and
affected dependents; stop when no actionable defects remain, an external decision
blocks progress, or the user's cap is reached (default eight full E2E rerun cycles).
When a scenario still fails after two fixes that share one premise, write that
premise as one sentence. Before the next fix, test it with an observation that
comes out differently if the premise is false.
