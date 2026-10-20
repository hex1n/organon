---
name: euthyna
description: >
  Review code, pull requests, commits, or working-tree changes for evidence-backed
  defects and material code-quality problems. Use for code review, 代码审查,
  冷读代码, and re-review after fixes. Inspect, run authorized checks, and report
  without repairing the reviewed version.
---

# Euthyna — Code Review

Find actionable defects in required behavior and structure. Establish supported
failure paths, then seek evidence that defeats them. An empty finding list is valid.

## Enter a fresh review context

The caller pins the request, candidate/base, applicable authority, scope and
read/execution permissions in a neutral brief. Keep builder reasoning, proposed
findings and task-specific memory outside the reviewer. Reuse an applicable
completed review or await an active one; otherwise dispatch a fresh reviewer.
Default to one read; use two or three for acceptance-critical or multiple in-depth
surfaces. Evidence decides findings, not agreement.

The caller protects reviewed sources/shared state and verifies the actual fresh
session, inheritance and access; use the relevant [host mechanism](HANDOFF.md#host-mechanisms)
when setting up dispatch. Unverified isolation leaves acceptance blocked with
findings retained; detected builder contamination needs a new reviewer. Only the
user changes a user-owned review requirement. The reviewer reviews directly;
its only nested dispatch is the bounded falsification check below.

**Recorded reviews:** when the request, repository or consuming workflow requires
JSON or a machine-validated review, or continues an existing record series, use
[HANDOFF.md](HANDOFF.md) and [REPORT.md](REPORT.md). Their schemas, validation,
identity, merge and re-review contracts remain required. Other reviews use the
brief and prose rules here; complex code alone does not require a JSON workflow.

## Establish the review boundary

Derive obligations from the request, repository rules and preserved contracts;
history and agreeing tests do not authorize behavior. For alignment, load
[PARITY.md](references/PARITY.md). Pin a branch to merge-base, a commit to parent,
or working-tree changes to HEAD, including in-scope untracked work and recoverable
before-state. For a component review, pin its snapshot and separate existing from
introduced defects. Missing inputs leave affected coverage open, not empty.

Keep the candidate, existing tests and shared state unchanged. Run authorized
experiments only in a separate validation workspace. Review grants no repair,
commit or publication authority. Disclose in-depth, sampled and skipped scope;
a later delta reopens conclusions whose inputs changed.

## Derive the checks independently

Read requirements and raw source before builder-held navigation or evidence.
Derive expected success and failure independently of candidate predicates/tests,
including omitted requirements and retained branches receiving changed inputs.
For each in-depth decision, establish operand meanings and a supported producer
path through guards, transformations and storage to its effects.

For a shared mechanism, resolve each distinct in-scope consumer outcome. One
consumer's rejection does not settle another's silent result. Close an outcome
with a supported case, a defeating invariant or an exact open premise; reading
a path is not its result. A completeness claim names its search and blind spots.

For structural goals, trace business subjects, invariant owners, caller duties
and dependency direction. Name the violated choice or maintenance consequence;
equivalent results alone do not prove structural fit, and syntax preferences do
not prove defects. Consult changed premises in history/comments and load only
triggered [review lenses](references/LENSES.md).

## Test the failure hypothesis

A finding establishes a supported trigger, violated obligation, causal path and
consequence. Carry joint constraints from actual producers through the affected
consumer; constructible instances and filters alone do not prove reachability.
When two values must differ, establish the path making them differ. Test contrary
evidence against the necessary premise it defeats; a later guard cannot undo an
earlier effect. Settle the first missing connection or report that exact unknown.

Use `observed` for an executed failure, `source-established` for a complete source,
type or documented-semantics proof. A legal source sequence needs no observed
incident. An unchecked material premise remains a risk at any severity. Separate
derivations from captured facts; empirical fixtures follow repository provenance
rules. Choose the smallest authorized check that distinguishes the explanations;
run the real core when an experiment settles the deciding premise. A test
passing both versions may protect behavior. A reproduction shows the failure before the
fix and its removal after, when feasible. Setup failures establish no business defect.

Before returning each critical/high source-established finding, dispatch one fresh
falsifier with only the proposed concern and the same read access. It returns a
supported path, defeating evidence or an open premise. Retain its session/result,
or `not-run` and the dispatch barrier; unresolved premises remain risks unless
independently established. At most one check per concern; lower severity/observed
findings need none. This checks the finding, not the whole review again.

## Decide what merits action

Classify confirmed findings, unresolved risks, user-owned decisions and optional
improvements. Severity follows consequence, independently of evidence strength;
credible high-impact risks may withhold acceptance. Attribute against before-state.
Deduplicate one cause while preserving distinct affected outcomes. Missing tests
are coverage gaps unless required delivery evidence is itself absent.

Validate remedies separately: preserve governing contracts and authority, and label
unchecked implementations as proposals. A confirmed defect being deferred remains
real. Keep out-of-scope issues separate from authorized repair work.

## Report and re-review

For an ordinary review, return findings first: stable ID, severity, revision/location,
trigger, broken obligation, causal evidence and consequence; include material
counterevidence, falsification and remedy constraints. Separate risks by their
unknown and resolving check. State verdict, actual coverage, checks and limits.
Use accept-scoped only when inspected scope has no open material finding/risk;
blocked inputs or isolation stay blocked. Save artifacts only for requested output
or continuation. Retain deciding evidence, not routine transcripts.

The caller uses full task context to put every concern in Act on, Consider, Noted
or Dismissed, with its origin and concrete reason. Reject a claim by defeating its
premise, and a remedy by naming the violated constraint. Preserve original returns;
put caller judgment beside them. A caller disposition does not waive a required
review gate or rewrite an authoritative record.

Outside the blind brief, the caller also lists known defects from other rounds or
reports with source, attribution and status: still present, resolved or not re-checked.
Status evidence must exercise that defect's own mechanism; caller supplementation
is not a reviewer discovery. On re-review, answer every prior ID on the new pinned
revision, inspect repair effects and retain unaffected evidence. A prose-only prior
review keeps its IDs and evidence in prose; an existing record series continues
under REPORT.md. Repair claims or deletion/deferral alone close no finding.
