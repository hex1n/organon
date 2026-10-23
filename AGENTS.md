# Repository Contract

This repository owns portable skills under `plugins/organon/skills/`, shipped
as the `organon` plugin for Claude Code and Codex, user-level tools under
`tools/`, and their maintenance scripts under `scripts/`. This file defines
shared repository rules for every agent runtime.

## Before Working

Inspect the target files and relevant Git status or diff. Preserve pre-existing
and concurrent changes.

Use the requested deliverable to determine the work:

- Information-only audit, review, or explanation: inspect and report.
- Implementation: make focused changes and verify the affected behavior.
  An accompanying audit or review does not cancel an implementation request.

Read [CONTEXT.md](CONTEXT.md) when working on distribution terminology or behavior.

## Source Ownership

Edit repository-owned source assets. Managed installed skills must resolve to,
or remain byte-identical with, their source. Personal divergence belongs in a
separate override skill.

Install managed skills as the `organon` plugin with
`node scripts/install-skills.cjs`. The default invocation previews changes;
`--apply` performs them. Claude Code reads this checkout in place; Codex runs a
cached copy that the installer refreshes. A release that changes the plugin
raises `version` in both plugin manifests together.

Keep user-level tool implementations and runtime hook configuration out of
business repositories. Install tools by link and merge runtime configuration
while preserving unrelated settings. Each tool's README owns its external
requirements and contract commands.

## Skill Changes

Keep each skill independently distributable: standard Markdown instructions,
standard-library-only helper scripts, and no required sibling skill or
orchestration runtime. Core skills carry no runtime-specific workflow scripts,
external dependencies, or broad maintenance checklists unless the user
explicitly requests an exception. Tools may integrate runtimes at their
configuration boundary.

Keep `SKILL.md` task-facing. Put optional execution detail in referenced files
and repository maintenance procedures outside installed skill bodies.

**Create or improve a skill:** use the current runtime's official
`skill-creator` — Codex's built-in skill or Claude Code's official plugin.
Follow that workflow for evaluation and iteration while preserving this
repository's source, distribution, and verification constraints. Use the
current runtime's official guidance for invocation settings and metadata.

**Portable text:** skills here are installed into many repositories, so rules
and examples under `plugins/organon/skills/` state the general class and use invented
placeholders, never an identifier, code, table, or domain term from a real
project. Before committing, search the diff for names and domain terms from the
repositories the session read.

**Descriptions:** a model-invoked description states, in positive terms, the
requests the skill serves. It carries no exemption clause and names no sibling
skill; scope words such as "while options are still open" mark a boundary. Check
a description change with trigger trials: verbatim user prompts from both sides
of each boundary, run in the repository where each was typed, on both runtimes,
before and after.

**Wording and structure:** use `writing-for-agents` when writing or editing
skills and shared agent instructions. Apply its wording, information hierarchy,
context-pointer, and pruning guidance while preserving the intended behavior.
Apply the [instruction design constitution](global-agent-rules.md#instruction-design-constitution)
to the complete skill and its instruction references. Choose writing, diagrams,
interactive HTML, or video where it improves understanding. Keep clear text
and exact schema, command, and interface contracts intact.

### Improvement Method

**Diagnose the decision:** trace a reported failure through the original request,
relevant instructions, and actual artifacts. Separate the observed mismatch from
its hypothesized cause. Consider missing guidance, execution omissions, and
misleading inherited assumptions before deciding what the skill should change.

**Generalize with evidence:** target the reasoning or observable property that
should transfer across tasks. When the method is uncertain or wording changes
repeatedly fail, consult primary engineering sources; check their problem,
assumptions, and limits, and distinguish their findings from the proposed
adaptation. Preserve confirmed requirements and governing contracts; keep
proposals and replaceable technical choices open.

**Revise and prune:** prefer replacing, merging, or removing guidance over
appending rules. Apply the instruction design constitution to the complete
path. Check which behavior each retained or removed instruction changes;
preserve required contracts and keep evidence proportional to the change.
This method adds no document, approval, or evaluation format.

**Evaluate behavior:** define the intended change and acceptance evidence before
the trial; inspect actual work products against that criterion. Format checks
and passing tests do not establish an untested property such as structural fit.
When comparing revisions, keep inputs and conditions fixed where possible and
disclose differences that limit attribution. Run trials under the instructions
the skill meets in use: the global rules at the revision under test, and a
consuming repository's instructions instead of this one's. A Codex agent reads
the installed rules copy as it stands at launch. Count prompted repairs
separately from first-attempt success. Report each arm's run count and spread,
and rule out other readings of a gap (runs that skipped the task, unequal
conditions, noise) before crediting it to the revision. For generalization
claims, probe contrasting task shapes and limit conclusions to what ran. When
revisions repeatedly fail the same criterion, revisit the diagnosis and
evaluation setup.

## Scripts

A script's prefix decides what runs it, and `scripts/gate.mjs` discovers both
prefixes rather than listing them. Name a repository gate `assert-*` and the
gate runs it — that is the whole registration step. Name an external-toolchain
check (JDK, Maven, git fixtures) `contract-*` and the gate names it on exit
instead of running it, so it stays runnable anywhere Node is. A script that
must stay out of the gate says so by taking neither prefix.
`validate-<record>` ships inside a skill and checks an agent-authored record
against its sibling `<record>-schema.json`.

The gate is `gate.mjs`, not `check-all`, because it deliberately leaves
`contract-*` out: a name promising "all" licenses a completeness claim its run
does not support.

A script that is both importable and runnable as a CLI is `.cjs`, so
`require.main === module` decides whether it executes. The ESM alternative
compares `import.meta.url` against `process.argv[1]`, which silently exits 0
without running when the script is reached through a symlink or junction —
which is exactly how skills and tools are installed. A script that only ever
runs top-level stays `.mjs`.

A skill's record schema is declarative and lives at the skill root, next to
`SKILL.md`. A reference that supplies a record template must agree with its
schema. Where more than one skill needs the schema interpreter, each carries
its own copy — an import reaching outside the skill directory resolves in this checkout and
nowhere else — delimited by the `shared-validator-helpers` markers that
`scripts/assert-validator-helpers.mjs` pins byte-identical.

## Target-Specific Requirements

When changing these targets:

- `tools/java-formatter/` or its installer: read
  [tools/java-formatter/README.md](tools/java-formatter/README.md) and run
  `node scripts/contract-java-formatter.mjs`.
- `plugins/organon/hooks/`: run `node scripts/contract-organon-hook.mjs`, then
  refresh the Codex copy with `node scripts/install-skills.cjs --apply` and
  re-trust the changed hook in Codex.
- `plugins/organon/skills/scholion/`: read
  [its README](plugins/organon/skills/scholion/README.md) and run
  `node scripts/contract-scholion.mjs`.
- `global-agent-rules.md`: run `node scripts/install-agent-tools.cjs --apply` so a
  Codex copy made where a file symlink was unavailable follows the source, then
  `node scripts/gate.mjs`, whose installed-copies check reports a stale copy.

## Verification And Completion

For any skill change or shared maintenance-rule change, run
`node scripts/gate.mjs` before and after the change, plus relevant focused
checks. It discovers local `.test.mjs` and `.test.cjs` suites and runs every
`assert-*` gate. It does not replace the `contract-*` checks it names on exit,
or behavioral validation selected by the official `skill-creator`.

For tool or installer changes, run the affected tool's documented contract
checks and relevant maintenance tests.

A new mechanical gate or refusal is exercised once on a real artifact before it
ships. Its synthetic cases are written by whoever wrote the rule and inherit that
author's blind spot; the first true consumer is what finds the rule's edge.

A portability claim names the platforms actually executed; source-level path
tests do not establish runtime execution on another platform.

Before reporting completion, inspect the final diff and report verification
results and material gaps. Distinguish introduced failures from pre-existing
or environmental ones.
