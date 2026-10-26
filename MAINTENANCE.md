# Repository maintenance

Execution details for the conditional workflows in
[AGENTS.md](AGENTS.md). Source ownership, required checks and completion rules
remain there.

## Trigger trials

For changes to skill selection or invocation boundaries, use verbatim user
prompts from both sides of each affected boundary. Run them in the repositories
where they were typed, on Claude Code and Codex, before and after the change.
Apply the behavioral-trial controls below when comparing outcomes.

## Behavioral trials

Run trials under the instructions the skill meets in use: the global rules at
the revision under test, and a consuming repository's instructions instead of
this repository's. A Codex agent reads the installed rules copy as it stands
at launch.

When comparing revisions, keep inputs and conditions fixed where possible and
disclose differences that limit attribution. Count prompted repairs separately
from first-attempt success. Report each arm's run count and spread, and rule out
other readings of a gap, including skipped tasks, unequal conditions and noise,
before crediting it to the revision.

For generalization claims, probe contrasting task shapes and limit conclusions
to what ran.

## Script conventions

The gate is named `gate.mjs` rather than `check-all` because it deliberately
leaves `contract-*` checks out. A name promising "all" would imply coverage its
run does not provide. `assert-*` runs with Node alone; external-toolchain checks
such as JDK, Maven or Git-fixture contracts run separately.

Importable CLI scripts use CommonJS so `require.main === module` identifies
direct execution. Comparing `import.meta.url` directly with `process.argv[1]`
has silently skipped execution through symlink or junction entry points in this
repository. A successful exit without running the command does not establish
that its contract holds. Top-level-only scripts need no such entry-point test.
