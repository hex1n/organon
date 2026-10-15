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
the user's explicit request.

When a skill asks for a value the task does not give, infer the project default
and state it: a review's fixed point is the merge-base with the main branch; a
spec is looked for in the repository's plans or task scratch folder, and the
axis is skipped when none exists; a failure that cannot be reproduced is
marked "no loop" and analysis continues statically.

## Instruction design constitution

Apply this constitution when creating, auditing, or editing skills,
`AGENTS.md`, `CLAUDE.md`, prompts, and referenced rule documents.
Write for a capable model: keep outcomes, non-obvious context, decision
criteria and required constraints. Prefer the shortest sufficient instruction.
Remove generic tutorials, repetition and obsolete rules; use fixed steps only
for a real dependency or demonstrated risk. Keep essential conditions visible
and load branch-specific detail when needed. Review the complete instruction
path, including references. Check behavior after pruning; brevity alone is not
evidence of improvement.

Adapted from [Karpathy's four explanation formats](https://x.com/karpathy/status/2105819303471976479):

- **Writing:** use clear, direct prose as the default. Borrow
  [ASD-STE100](https://www.asd-ste100.org/STE_faq.html): prefer short sentences,
  explicit actions, and consistent terms. Keep conditions and exceptions with
  their actions. "About 80%" means flexible adoption, not a compliance score.
  Apply these principles to prose, headings, labels, legends and annotations.
  Write naturally in the document's language; use longer wording when clearer.
  Shorten wording without omitting required information.
- **Diagrams or images:** use them when relationships, boundaries, order, or
  state are easier to inspect visually. Show the relevant subjects, rule
  owners, and dependencies. Mark unknown relationships where they appear.
  Separate overview from reference detail. Each node represents one role, state
  or action. Put field lists, predicates and caveats in keyed adjacent notes;
  keep conditions that change a relationship with that relationship. Make the
  reading path clear. Choose grouping and direction for the relationships;
  align related items, give them space and reduce crossing or backtracking edges.
  If the overview is still dense, revise its abstraction or split complementary
  views rather than shrink the text. Use restrained colour with sufficient
  contrast; convey status in text too.
- **Interactive HTML:** use it when changing inputs, comparing alternatives,
  or exploring branches helps the reader understand a decision. Make inputs,
  assumptions, and resulting behavior visible. Check the interactions used
  to support the explanation.
- **Explainer videos:** use them when a paced sequence, movement, or narration
  adds material understanding, or when requested. Keep scenes and narration
  consistent with the source. Inspect the rendered sequence; disclose any
  unverified playback or narration.

Choose and combine formats by the reader's question, understanding gained,
and creation and maintenance cost. A short answer can be enough. These formats
are options; every task need not produce all four. Honor the requested form,
artifact scope, available tools, and existing authorization.

For visual explanations, prefer a suitable installed skill such as `show-me`
when available. Pass it the source model, scope and unknowns. The originating
workflow retains factual correctness, required formats and visual acceptance,
and supplies the view directly when no suitable helper is available.

Keep executable instructions and authoritative facts in their canonical text
or record. Each derived view carries its source identity, scope, and material
uncertainties. Separate observed behavior, assumptions, and proposals.
Preserve technical terms, identifiers, permissions, rule strength, business
intent, and required dependencies. A view must not imply an order or guarantee
the source does not establish. Check content and inspect the rendered view at
its intended reading size, including dense branches and long labels. Fix
unreadable text, collisions, clipping and connections that are hard to trace;
a successful render alone is insufficient. Revise grouping, layout or format
when needed. State what remains unverified. Explanation quality does not
substitute for evidence that the required behavior and structure hold.

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

**Confirm first:**

- `git commit`, push, branch deletion, and any `reset`/`checkout` that discards
  work.
- Deleting or rewriting ignored or untracked files this session did not
  create; Git cannot restore them.
- Writes to shared test environments: database writes, triggering write jobs,
  side-effecting real calls, restarts, configuration changes.
- Changes to hooks or runtime settings, and any expansion beyond the task's
  scope.
- Decisions a design review left pending or marked NO-GO.

Report a blocked part on its own and finish everything else.

## Defensive code admission

Before adding a runtime guard (null/empty check, duplicate key, range or state
check, cross-table equality, fail-closed branch), answer three questions; a
guard that cannot answer them is deleted, or the interface is reshaped instead:

- **Real entry:** which production path delivers the illegal shape here.
  "Could theoretically be null" and "the current sample lacks it" are not
  evidence; a model constraint, database constraint, or upstream code path may
  prove the invariant already holds.
- **Single owner:** whether the database, the model or constructor, the input
  boundary, or this module owns the invariant. Use an invariant the upstream
  already establishes. When a guard only keeps parallel maps, parallel
  parameters, or mutually contradicting indexes consistent, merge them into
  one type so the illegal combination cannot be expressed. Backfill,
  migration, and data-repair equalities belong in SQL, deployment checks, or a
  one-off gate, off the business hot path.
- **Killable oracle:** a kept guard has a production-reachable fixture whose
  test goes red when the guard is removed or returns the wrong error code.

At delivery, list the three answers per guard; a guard that can neither be
explained nor removed is listed for the user's decision.

## Tests

Every test is an oracle: it goes red for the real reason.

- **Run the real core.** Tests of the logic under test execute it for real;
  fakes sit only at data boundaries (external data access, clocks and
  calendars, configuration), and each fake is backed by a captured real fact.
- **Assert real values.** Amounts, counts, and ordering assert expected
  values; non-null checks and call counts are not coverage.
- **Assert the error `code`;** message text may change.
- **Diff final state per table or store** with a stable sort and non-business
  timestamps removed; a failure scenario asserts zero diff on every business
  store.
- **Design assertions from how the code goes wrong:** after writing one,
  substitute the most plausible wrong implementation and confirm the test goes
  red.
- **Assert behavior, not implementation:** a test that a behavior-preserving
  refactor would break is rewritten at the owning boundary before it lands.
  A detail is asserted when it is itself the contract: call order a caller
  observes, or a user-facing key, byte, or path a source check guards most
  cheaply. An existing test that resembles implementation stays until the
  contract it fails to guard is named.
- **One contract, one owning test** at the strongest boundary; another layer
  earns a test only for a risk the owner cannot reach, such as transport or
  lifecycle. Extend the owner's table case or shared fixture instead of adding
  a near-duplicate, and merge the setup the change duplicates.
- **Test through the production boundary:** a test the change adds or edits
  that needs an export, flag, wrapper, or hook no production caller uses moves
  to the boundary production calls; an existing test on such a seam stays
  until a change touches it. A self-test entry or export that a tool documents
  as its contract surface is itself a production boundary. Production code the
  change leaves with only test callers is deleted with those tests.
- **Fixtures start from a real sample** when the project has a real data
  source: before deriving expected values, survey that source for the target
  shape (existence, count, distribution), pick one real sample, and take its
  whole record set plus the prior state it reads. Keep real values unmodified
  and uncombined across samples; when a mutation-test fault cannot be told
  apart on real data, report it as indistinguishable rather than inventing
  data to kill it. Make data-reading fakes fail on unprepared input; an empty
  default return fakes a kill.
- **Fixture values carry provenance:** each comes from a named real record or
  a stated derivation.
- **Dependency-direction refactors are accepted by re-exporting the
  module-level reference graph,** not by type names.

Method-level docs in tests carry only three things: how the shape is built,
where each expected value comes from, and why a real sample cannot produce the
shape. Design argument and review history stay out of tests.

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
- **Java class header:** Javadoc only on top-level types this session added
  (Git `A` or untracked relative to the task baseline), time in
  `Asia/Shanghai`, one sentence in the repository's comment language, at most
  6 lines:

  ```java
  /**
   * @author hex1n
   * @date yyyy/MM/dd HH:mm
   * @description <what the type is responsible for>
   **/
  ```

  In a new production file this is the only Javadoc: fields and methods carry
  none, and a `//` comment is a single line explaining the line below it; the
  argument itself goes in the commit or review. An edited existing file gets no
  header and keeps its original `author`.
- **Java:** Lombok for passive value carriers only; constructors or methods
  that validate, normalize, copy defensively, derive fields, or enforce
  invariants stay explicit, and `@Data` never adds equality, setters, or
  mutability the type lacked. Streams for stateless filter, map, group, find,
  and reduce; explicit loops for mutable carried state, stable or error
  ordering, remainder allocation, short-circuiting across several outputs, and
  side effects.

Before delivery, review this session's new null/empty helpers, qualified names,
boilerplate accessors, and collection loops: each follows the rules above or
has one of the listed semantic reasons.

## Verification and delivery

Change first, then gather evidence; write process documents only when asked.
When the repository keeps a verification registry, select its gates by
behavior and every consumer chain, not by file name or test count. A focused
run shortens feedback; only the gate's handoff run closes delivery. A change
matching no gate still gets focused tests plus one handoff run covering its
domain, and the delivery says what ran and what stays unproven.

1. Format only the files this task names, review the formatted diff, and run
   the chosen checks on that final version.
2. Stage the production source and shared build or run configuration this
   session created or changed, together with related edits to already-tracked
   tests. Local hooks, tools, docs, scratch, generated output, and machine
   configuration stay unstaged; new untracked test files stay untracked unless
   the user asks to include them.
3. Commit when the user asks: a single-line Conventional Commits subject
   `type(scope): subject` with no AI attribution trailer. Read `git log -1`
   first, because a concurrent session may have committed. Push only when
   asked in the same turn.
4. When the working tree shows diffs, staged changes, or leftovers from outside
   this session, leave them in place, check whether they overlap this change,
   and report them.

## Parallel work

Read-only parallel tasks share the checkout. A parallel task that edits files,
stages, builds, or changes test state gets its own worktree with a single
writer, built in isolation and integrated serially. A parallel agent without
its own worktree does read-only analysis.
