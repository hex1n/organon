# Review-and-revise

These steps apply only to `review-and-revise`. Keep the shared finding
validation and closing rules in [SKILL.md](SKILL.md#evidence-loop).

## Revise from evidence

Use two disciplines when writing the fix.

**Verify before you write.** Check every existing-system claim the revision adds
or sharpens against its source. Open the file and cite the line before shipping
the revision. An unchecked claim can become the next round's finding and require
another full-cost review. Limit the claim to the scope needed to close the finding.

**Re-derive a disproven mechanism.** When a finding falsifies a mechanism the
candidate invented, rebuild that section from authoritative sources.
Check the domain record for an existing answer. Repair the underlying derivation;
patching an unsupported mechanism can leave the same blocker for the next round.

Batch compatible fixes. A focused recheck may close findings but cannot close
the gate. Use it only for edits contained by finding-linked scope; uncertainty
or cross-cutting change requires a complete review. See
[REFERENCE.md](REFERENCE.md#focused-recheck).

For implementation-authorization scope, a revision that materially changes the
frozen BUILD decision's cost, benefit, mechanism, scope, or key assumptions
invalidates that envelope: suspend that authorization gate for a renewed user
or upstream decision. For correctness-only scope, report the changed assumption
and continue technical review while it remains useful and authorized. Ask only
when the technical target itself needs a user decision.

Completion: every finding is validated, owned, and dispositioned; every
existing-system claim the revision adds carries a source verified this round;
a new hashed revision exists or every rebuttal has returned to its reviewer.

## Re-review the revision

Send the complete revised candidate and ledger to this round's reviewers:
mid-loop, when one required reviewer has closed its lane (GO or optional-only
findings) on consecutive revisions while another keeps returning confirmed
defects, run only the still-falsifying lanes; the closing round still sends
the candidate to every required reviewer, and the gate is unchanged. The
final GO must cover the complete current revision. Record, disclose, validate,
and disposition every new finding, then repeat. This closing review returns the
complete set of currently known findings across all severities, grouped by root cause; it
does not stop merely because a non-GO verdict is already justified.

Then apply [Close Or Continue](SKILL.md#5-close-or-continue).
