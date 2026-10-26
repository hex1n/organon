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
and examples under `plugins/organon/skills/` state the general class and use
invented placeholders for business-project-specific identifiers, code, tables
and domain terms. Public API, protocol and tool names may be used when needed.
Before committing, search the diff for business-project-specific names and terms
from repositories the session read.

**Descriptions:** a model-invoked description states, in positive terms, the
requests the skill serves. It carries no exemption clause and names no sibling
skill; scope words such as "while options are still open" mark a boundary. Check
changes to skill selection or invocation boundaries with
[trigger trials](MAINTENANCE.md#trigger-trials) on both runtimes, before and after.
Purely mechanical wording changes that preserve those boundaries need no trigger
trials.

**Wording and structure:** use `writing-for-agents` when writing or editing
skills and shared agent instructions. Apply its wording, information hierarchy,
context-pointer, and pruning guidance while preserving the intended behavior.
Write for a capable model: keep outcomes, non-obvious context, decision criteria
and required constraints. Use clear, direct prose with consistent terms; keep
conditions and exceptions with their actions. Keep essential conditions visible
and load branch-specific detail when needed. Preserve exact schema, command and
interface contracts.

Choose writing, diagrams or interactive HTML by the understanding gained and
creation and maintenance cost; a short answer can be enough. Honor the requested
form, scope and authorization. Before producing a diagram or interactive view,
read [Instruction views](INSTRUCTION-VIEWS.md) for source fidelity, layout
and visual acceptance.

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
appending rules. Review the complete instruction path, including references.
Remove generic tutorials, repetition and obsolete rules; use fixed steps only
for a real dependency or demonstrated risk. Check which behavior each retained
or removed instruction changes; preserve required contracts and keep evidence
proportional to the change. Brevity alone is not evidence of improvement.
This method adds no document, approval, or evaluation format.

**Evaluate behavior:** define the intended change and acceptance evidence before
the trial; inspect actual work products against that criterion. Format checks
and passing tests do not establish an untested property such as structural fit.
For comparisons or generalization claims, use
[behavioral trials](MAINTENANCE.md#behavioral-trials) for representative conditions,
attribution and reporting. When revisions repeatedly fail the same criterion,
revisit the diagnosis and evaluation setup.

## Scripts

`scripts/gate.mjs` discovers scripts by prefix: it runs `assert-*` repository
gates and lists `contract-*` external-toolchain checks for direct execution.
Use neither prefix for a script that must stay outside that discovery.
`validate-<record>` ships inside a skill and checks an agent-authored record
against its sibling `<record>-schema.json`.

A script that is both importable and runnable as a CLI uses `.cjs` with
`require.main === module`; top-level-only scripts use `.mjs`. See
[script conventions](MAINTENANCE.md#script-conventions) for the rationale.

A skill's record schema is declarative and lives at the skill root, next to
`SKILL.md`. A reference that supplies a record template must agree with its
schema. Where more than one skill needs the schema interpreter, each carries
its own copy — an import reaching outside the skill directory resolves in this checkout and
nowhere else — delimited by the `shared-validator-helpers` markers that
`scripts/assert-validator-helpers.mjs` pins byte-identical.

## Target-Specific Requirements

When changing these targets:

- `tools/java-formatter/` or its installation behavior: read
  [tools/java-formatter/README.md](tools/java-formatter/README.md) and run
  `node scripts/contract-java-formatter.mjs`.
- `plugins/organon/hooks/`: run `node scripts/contract-organon-hook.mjs`, then
  refresh the Codex copy with `node scripts/install-skills.cjs --apply` and
  re-trust the changed hook in Codex.
- `plugins/organon/skills/scholion/`: read
  [its README](plugins/organon/skills/scholion/README.md) and run
  `node scripts/contract-scholion.mjs`.
- `USER-AGENT-RULES.md`: run `node scripts/install-agent-tools.cjs --apply` so a
  Codex copy made where a file symlink was unavailable follows the source.

## Verification And Completion

For any skill change or shared maintenance-rule change, run
`node scripts/gate.mjs` before and after the change, plus relevant focused
checks. It discovers local `.test.mjs` and `.test.cjs` suites and runs every
`assert-*` gate. It does not replace the `contract-*` checks it names on exit,
or behavioral validation selected by the official `skill-creator`.

For tool or installer changes, run relevant maintenance tests and the documented
contract checks for affected behavior. Select shared-installer checks by affected
assets and shared installation paths.

A new mechanical gate or refusal is exercised once on a real artifact before it
ships. Its synthetic cases are written by whoever wrote the rule and inherit that
author's blind spot; the first true consumer is what finds the rule's edge.

A portability claim names the platforms actually executed; source-level path
tests do not establish runtime execution on another platform.

Before reporting completion, inspect the final diff and report verification
results and material gaps. Distinguish introduced failures from pre-existing
or environmental ones.
