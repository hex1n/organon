# Review-and-revise

Read only for authorized candidate edits or another revision round. Use the shared
[Evidence Loop](SKILL.md#evidence-loop) for disclosure, validation and disposition.
Entering this mode, at the start or after a review-only verdict, freezes the
[Exact Gate](SKILL.md#exact-gate) for the loop with a budget counted in complete
rounds: three at full depth and two at shallow depth, unless calibration or the
user sets another. Two is the least that lets a fix be re-reviewed.

## Revise from evidence

Batch compatible fixes. Verify every added or sharpened existing-system claim
against its source and cite its locator. When a mechanism is disproven, re-derive
it from authority and existing domain records instead of patching its unsupported
premise. Keep the revision limited to the finding's actual scope.

Hash the new candidate or return evidence-backed rebuttals to their reviewers.
An edit affecting the BUILD decision follows
[envelope invalidation](REFERENCE.md#decision-envelope-and-entry-states).
Use a [focused recheck](REFERENCE.md#focused-recheck) only for eligible contained
edits; it cannot replace complete closing reviews.

## Blocker sweep

Complete review is the default. For a large candidate with unsettled foundational
assumptions or interacting failure paths, an initial blocker sweep may save work;
record that reason. It examines every rubric dimension for blockers and verification
gaps, deferring independent should-fix and optional findings. Return the
[reviewer payload](REFERENCE.md#reviewer-return) with that coverage. Once no blocker
or decision-blocking gap remains, run a complete review on the same revision.

## Re-review and stop

Send the complete revised candidate and ledger for re-review in each required
reviewer's existing session, which already holds the evidence it verified.
When that session cannot be resumed, give a new session of the same independence
class that reviewer's prior findings and the same materials; its round receipt
carries the new session handle.
Mid-loop, a reviewer that has returned GO or optional-only findings on
consecutive revisions may pause while still-falsifying lanes continue. The
closing round includes every required reviewer on the exact final bytes, all
dimensions and severities; a justified non-GO does not end the search for other
findings.

The frozen budget authorizes its rounds: continue while the review request
remains active and the next round can close a gate-blocking finding or change a
technical/implementation decision, and return to the user at a stop condition.
A round whose gate-blocking findings all target text the previous revision added
is churn: the revision, not the candidate, is generating the work. Suspend after
two churn rounds in a row, when the same blocker survives three consecutive
revisions, or under [the shared stop conditions](SKILL.md#close-or-continue).
If a confirmed material defect is no longer worth fixing, suspend or withdraw;
never call that GO.
