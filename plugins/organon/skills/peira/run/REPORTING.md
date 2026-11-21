# Report and delivery

Keep one canonical report, `{yyyy-mm-dd}-{feature}-e2e-test-report.md` in the run directory,
mirroring the plan's name; it is the default home for the run's facts.
Apply the language policy in [RUN.md](RUN.md); only identifiers, closed status
vocabularies, commands, and quoted evidence retain their original spelling.

Give each selected scenario or variant ID one heading carrying its ID and status.
Keep the business conclusion and full evidence in this Markdown, without a second
data model.

## Canonical report

### Conclusion and counts

Lead with the observed business outcome: what works, fails, or remains unknown,
the affected object and material impact, then the next action or decision. A reader
should understand this opening without knowing the test's formulas or assertion
vocabulary. Explain the scope and authority of passing checks after that outcome;
matching a planned formula establishes that check, not the formula's business
correctness. When later evidence reveals a defect, lead with it while preserving
the earlier check results and their original expectations.

Account for `passed`, `failed`, `blocked`, `unverified`, and `skipped` from the
selected-scenario records and state the counts in the opening. An all-pass conclusion requires a
nonempty selection with every selected scenario passed; zero selected scenarios and
all-skipped runs are never successful runs. Scope that conclusion to the selection.
State which requested business outcomes remain untested or blocked, even when every
executed case passed; scenario counts do not establish feature coverage.

### Contents

Group the following facts into a short report. They are required information;
their grouping is yours: merge small groups and leave out details that do not
apply.

| Information | Content |
|---|---|
| Run context | Selected IDs and exclusions, local/test target and actual build/source identity, relevant harness/runtime and real/double boundary, source plan path/hash, timing, and prior run/overrides when present. |
| Scenario results | One record per selected scenario or variant ID: ID, terminal status, oracle, expected, actual, evidence link, and diagnosis when there is a deficit. Distinct assertions within a bundled case remain distinguishable. |
| Evidence and findings | Per-scenario proof from `RUN.md`, raw output or its attachment unless `RUN.md` lets the rerun command stand in, and each root cause once with affected IDs, disposition, and next step. Shared command output is retained once and referenced by assertion. |
| Continuation and state | Exact rerun command or recorded adapter sequence, next actionable work, and actual cleanup/retention state. A read-only run can state that no business data changed; writes name owner, retained IDs/TTL, recovery/cleanup invocation, and observed cleanup receipt. |

Link artifacts inside this feature's `e2e/` tree. Cite outside artifacts as path
text, including the recorded hash when consumed.

A verdict row should explain the expected/actual difference without joining multiple
documents. Link its detail directly. Source and deployment facts need one home; reuse
that record for provenance and state resumption instead of copying it into several
ledgers. If an existing downstream consumer requires a named schema, retain that
schema for this handoff and name the consumer.

Before delivery, recheck the upstream hash. If it changed, keep the consumed revision
and expectations explicit; reconcile changed source facts without rewriting the
observed result.

## Rerun of kept scenarios

When every selected scenario ran from its kept file and passed, the report is
short and in the previous report's language: the opening with the counts, the
source revision that ran, the rerun command, one line per scenario linking the
file's own output, what differs from the previous run, and any data the run left
behind. A scenario that failed, was blocked, or ran against a
changed expectation gets its full record as above.

## Issue records

Reconcile findings with the local files required by
[Defect Handoffs](ISSUES.md#defect-handoffs). Link each issue from the report's
finding summary and affected scenario results; each issue links back to its source
run and evidence. Keep the report's business conclusion and expected/actual summary
readable without opening the issue file. Finding counts and scenario counts differ.

## Additional artifacts

Create only artifacts with a concrete consumer or payload need:

- `attachments/` for large raw output, screenshots, or binary evidence that would
  obscure the proof chain; retain an inline summary and precise pointer.
- `plan-snapshot.md` for otherwise unavailable source facts or complex derived mechanics
  that must be reused. Ordinary resolved commands and inputs fit in the report.
- Machine-readable metadata/results only for a named machine consumer; they project
  the canonical facts, not a second independent verdict.

A rerun uses a fresh continuation directory. Its instructions are the project's
existing commands or the recorded adapter sequence, replayed step by step with each
result inspected before dependent actions or cleanup.

## Final reconciliation

Check selection → results and results → selection, resolving every cited scenario,
root-cause, issue, or evidence reference. Mark references to upstream-only scenarios
as such. Preserve attempted failures and blockers even if later attempts passed.
Every finding requiring resolution has an existing issue file with matching ID,
affected cases and disposition; verify report-to-issue and issue-to-source links.
Cleanup claims require their observed receipt and independent absence/restoration
proof; unresolved evidence or lifecycle obligations remain visible.

Read the opening on its own: it must identify the business outcome and impact,
retain material uncertainty, and agree with both the scenario results and later
findings. Counts or statements that assertions passed do not satisfy this check.

In the reply, link the report and useful raw attachments, and state every nonzero
status count, each problem found, each difference normalized or excluded from a
comparison, blockers, and retained data.
