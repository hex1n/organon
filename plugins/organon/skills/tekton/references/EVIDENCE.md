# Evidence

Read the section the situation names: defect closure, independent review, or build and evidence reuse.

## Closing a defect

A defect closes where it was reproduced: establish failure before and success
after through the same entry, inputs and environment, using
`docs/verify/HARNESS.md` when present. A different surface, a unit test alone,
or an inconclusive run leaves the original defect open. A check passing both
versions may protect behavior without reproducing the defect. Keep unavailable
or intermittent reproduction explicit; revert a change whose motivating
hypothesis the evidence refutes, preserving concurrent work.

## Independent review

Follow governing delegation and model
authorization. Use the named reviewer's protocol; if using installed euthyna, read
[its reviewer setup](../../euthyna/SKILL.md#enter-a-fresh-review-context) before
dispatch and [its re-review rule](../../euthyna/SKILL.md#deliver-and-re-review)
before remediation.
Other work is self-reviewed.

## Reusing evidence and retrying

Reuse a healthy process whose loaded code matches the relevant checkout inputs
(including uncommitted source, resources, build settings and resolved dependencies).
Establish the match through build provenance or distinguishing behavior. Otherwise
start a matching artifact, or build the target and prerequisites with valid outputs and start it
when the check needs a service.
Honor required clean builds and fresh starts.

Rerun checks invalidated by source, input or environment changes and follow
final-version gates. Keep a pre-existing or environmental blocker open with its
receipt. Retry when relevant inputs change or a run tests a new hypothesis.
A proven focused check can verify independent claims while the blocked gate stays open. If a finding refutes similar claims, rederive
them. Test a suspected shared cause before repairs and verify each finding afterward. Keep independent defects separate.
