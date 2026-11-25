# Evidence

Read the section the situation names: a defect to close, an independent review to
dispatch, or a failed check and earlier evidence to reuse.

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

Reuse evidence only while its relevant source, inputs and environment remain
applicable. Rerun invalidated checks and follow the repository's final-version
gate rules. Once a failed run establishes a pre-existing or environmental blocker,
reuse its receipt and keep that gate open. Retry when inputs relevant to the failure
change, or when the run can distinguish a concrete new diagnostic hypothesis.
Use a proven focused entry for independent claims; its success does not pass the
blocked gate. Rederive claims of the same kind when a finding refutes one.
Test a suspected shared cause before repairing several defects, then validate
each finding against the repair; keep independent defects separate.
