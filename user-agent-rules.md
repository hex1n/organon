# Global Agent Rules

User-level working rules for any repository. Install as the runtime's global
instruction file (Claude Code `~/.claude/CLAUDE.md`, Codex `~/.codex/AGENTS.md`)
by link, by `@import`, or as a copy kept byte-identical. A repository's own
instructions add project facts on top of these.

## Precedence

On conflict, decide in this order: the current task's explicit instruction >
the repository's own instructions and the documents they point to > external
skills and plugins. A skill supplies general method; it never grants authority
the repository withholds, and it never waives a verification gate, staging
rule, or confirmation. A second model or external review service runs only on
the user's explicit request. A fresh-context subagent on the current model is
neither; dispatch one whenever a skill or the task calls for it.

When documentation and implementation disagree, distinguish descriptions of
current behavior from explicit requirements. If a description is confirmed stale,
use the current code, configuration and verification results; avoid rewriting
working code to match it. Existing code does not waive explicit requirements,
permission boundaries or verification gates. In the final reply, list each
conflict found and the basis for its resolution.

When information is missing, check the repository and existing context first.
State reasonable defaults and their basis. If a material uncertainty remains,
ask while continuing independent work.

## Autonomy boundary

**Proceed without asking:**

- Read-only work: code, docs, Git history, read-only queries against test
  data sources, test-environment logs.
- Creating or editing source and tests inside the working tree; writing task
  scratch files.
- Builds, tests, formatters; `git status/diff/log/add`; dry runs; read-only
  calls the user already asked for.
- Read-only subagents.
- A spec ambiguity whose readings all converge on one change: state the
  assumption and continue. When readings diverge, finish the parts that do not
  depend on the answer and carry the question in the delivery.
- A "which approach" question that a prototype, focused run, or measurement
  can settle: run it and report the answer. Ask only for product or preference
  decisions no experiment settles.

**Confirm first:**

- `git commit`, push (requested in the current turn), branch deletion, and any
  `reset`/`checkout` that discards work.
- Deleting or rewriting ignored or untracked files this session did not
  create; Git cannot restore them.
- Writes to shared test environments: database writes, triggering write jobs,
  side-effecting real calls, restarts, configuration changes.
- Changes to hooks or runtime settings, and any expansion beyond the task's
  scope. For extra robustness not required by the task or existing contracts,
  weigh the concrete failure path, likelihood and impact against added
  complexity. Keep merely theoretical risks as recommendations; explain the
  evidence and cost and obtain approval before implementing extra measures.
- Decisions a design review left pending or marked NO-GO.

The current request and prior valid authorization count as confirmation; ask
only for actions they do not cover.

Report a blocked part on its own and finish everything else.

## Guards and tests

Before changing a runtime guard, apply the organon `tekton` skill's guard rules,
even in a small edit. Before changing test expectations, verification boundaries,
fixtures or test-double behavior, read its Writing tests reference. Purely
mechanical import, naming or formatting changes need not load that reference.

## Code conventions

- **Comments are protected by the diff:** doc comments and comments that
  predate this session stay as written. Change one only on explicit request,
  or when this session's behavior change made it false; then make the minimal
  fix and report it.
- **Reuse the helpers the project already depends on** for null-safe
  collections, maps, and strings instead of adding local `nullSafe`-style
  wrappers.
- **Import, then use simple names;** a fully qualified name in a method body
  only disambiguates two same-named types.
- **Java class header:** use the following Javadoc on top-level types added
  this session (Git `A` or untracked relative to the task baseline), time in
  `Asia/Shanghai`, one sentence in the repository's comment language, at most
  6 lines:

  ```java
  /**
   * @author hex1n
   * @date yyyy/MM/dd HH:mm
   * @description <what the type is responsible for>
   **/
  ```

  Comments explain public contracts, algorithm prerequisites and non-obvious
  constraints; use method Javadoc or multi-line comments when useful. Avoid
  restating code; broader design arguments belong in the commit or review.
  An edited existing file gets no new header and keeps its original `author`.
- **Java:** Lombok for passive value carriers only; constructors or methods
  that validate, normalize, copy defensively, derive fields, or enforce
  invariants stay explicit, and `@Data` never adds equality, setters, or
  mutability the type lacked. Streams for stateless filter, map, group, find,
  and reduce; explicit loops for mutable carried state, stable or error
  ordering, remainder allocation, short-circuiting across several outputs, and
  side effects.

Before delivery, check this session's changes against the code conventions above.

## Verification and delivery

Establish the relevant facts before changing behavior, then verify the final
revision against affected contracts with the narrowest sufficient checks and each
required repository gate. Use the repository's verification guidance when present;
broaden checks for a concrete coverage or diagnostic need. Report results and what
stays unproven. Apart from the decision trail below, write process documents only
when asked. Detailed reproduction and verification methods belong to the selected
workflow.

When two fixes that share one premise fail the same check, write that premise
as one sentence. Before the next fix, make an observation that comes out
differently if the premise is false. A refuted premise moves the search
elsewhere; a confirmed one asks the next "why".

1. Format only files changed for the task unless the repository requires a
   broader scope. Review the formatted diff.
2. Stage the production source and shared build or run configuration this
   session created or changed, together with related edits to already-tracked
   tests. Local hooks, tools, docs, scratch, generated output, and machine
   configuration stay unstaged; new untracked test files stay untracked unless
   the user asks to include them.
3. Use a single-line Conventional Commits subject `type(scope): subject` with no
   AI attribution trailer. Read `git log -1` before committing, because a
   concurrent session may have committed.
4. When the working tree shows diffs, staged changes, or leftovers from outside
   this session, leave them in place, check whether they overlap this change,
   and report them.

A finding from a review bot or scanner gets one of three dispositions: fix it,
dismiss it with the concrete reason it does not apply here, or ask when the
decision is the user's. Leaving it unanswered is none of these.

## Decision trail

Keep task-generated material in the task's `.scratch/` folder. Use organon
`ichnos` when consequential choices, pivots, blockers or handoffs need reasons
and evidence beyond the diff, native logs and delivery, or when the user asks
for a trail. Routine reversible edits, checks and Git operations use those
existing records; changing a file or finding an existing trail does not by
itself require a row. Reuse the task folder and record material changes only.

## Parallel work

Read-only parallel tasks share the checkout. A parallel task that edits files,
stages, builds, or changes test state gets its own worktree with a single
writer, built in isolation and integrated serially. A parallel agent without
its own worktree does read-only analysis.
