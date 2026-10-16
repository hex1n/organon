# organon

> English | [简体中文](README.zh-CN.md)

Portable agent skills and user-level tools for Codex, Claude Code, and
compatible agent runtimes. The skills ship as the `organon` plugin
(ὄργανον, "instrument"): instruments of method for coding agents.

Each directory under [`plugins/organon/skills/`](plugins/organon/skills/) is a
self-contained source skill with task-facing instructions and optional
references, scripts, or templates.

## Install

Codex:

```bash
codex plugin marketplace add ./
codex plugin add organon@organon
```

Claude Code:

```bash
claude plugin marketplace add ./
claude plugin install organon@organon
```

From GitHub, replace `./` with `hex1n/organon`. Installed skills are
namespaced: `organon:tekton` in Claude Code. In this checkout,
`node scripts/install-skills.cjs --apply` does both installs and removes the
per-skill links an earlier link install left. Claude Code reads a local
directory marketplace in place, so source edits apply at the next session or
`/reload-plugins`. Codex runs a cached copy: re-run the installer after editing
a skill, and the gate's installed-copies check reports a stale copy.

## Skills

Skills are authored once as source assets and can be distributed into one or
more agent runtimes as managed installed skills. See [CONTEXT.md](CONTEXT.md)
for the distribution vocabulary.

| Skill | Focus | Purpose |
| --- | --- | --- |
| [`arche`](plugins/organon/skills/arche/) | plan | Plan or decide from the root problem: separate constraints from assumptions, compare mechanisms, and return the current-best path with its failure condition and next check; also answers whether to build at all and challenges to a recommendation just given. |
| [`dokimasia`](plugins/organon/skills/dokimasia/) | review | Independently falsify one completed design or plan revision: review-only ends after one complete round with GO, NO_GO, or SUSPENDED; on request, review-and-revise iterates on the exact final revision until every required reviewer returns GO or the review suspends. Depth follows the candidate's risk and decides reviewer strength. |
| [`historia`](plugins/organon/skills/historia/) | investigate | Evidence-backed investigation whose deliverable is written findings, not a fix: what is true, why behavior occurs, which option the evidence supports. |
| [`tekton`](plugins/organon/skills/tekton/) | implement | Implement, fix, refactor, or migrate code that already has callers, stored data, or tests to keep working, or land an adjudicated plan; delivers the change with evidence that affected contracts hold, structural improvement when requested, and verification matched to risk. |
| [`euthyna`](plugins/organon/skills/euthyna/) | review | Review code and changes through evidence-backed counterexamples; separate defects, unverified risks, decision items, and optional improvements without editing the candidate. |
| [`peira`](plugins/organon/skills/peira/) | verify | Plan, execute, and present end-to-end tests: source-backed scenario trees, evidence-backed execution reports that hand defects back for separately authorized fixes, with a capped iterate-until-green loop on explicit request, and HTML reader views. Typed first, `plan`, `run`, `render`, `brief`, or `harness` selects the mode: plan and render it; run, planning first when no plan exists, and render; render an existing artifact; brief a finished report for readers outside the run, delivered with it; or write the project's verification harness under `docs/verify/`, proved by one end-to-end run. |
| [`horos`](plugins/organon/skills/horos/) | land/verify | Generate backend API docs across RPC and HTTP protocols from code-backed contracts, for one interface, one requirement's backend API, or a branch's API changes. |
| [`scholion`](plugins/organon/skills/scholion/) | navigate | Record why current code is implemented this way and find the reason by file path or code snippet; keep records personal and Git-ignored, with worktree handoff. |

## Naming

Each skill takes the classical Greek word for its core move. The former names
survive only in history and in install links made before the rename; see
[Compatibility](#compatibility).

| Skill | Former name | Original sense | Why it fits |
| --- | --- | --- | --- |
| `arche` (ἀρχή) | `first-principles-planner` | origin; first principle | plans from the root problem |
| `dokimasia` (δοκιμασία) | `assayer` | Athenian scrutiny of an official before taking office; its verb also named the testing of coin | a plan is falsified before it is built |
| `tekton` (τέκτων) | `arborist` | builder, carpenter; the root of *architect* | builds on code that already has callers, stored data, and tests |
| `euthyna` (εὔθυνα) | `scrutineer` | Athenian accounting of an official at the end of a term; its examiners dismissed a charge or referred it to a court | code is examined after it is built, and findings go back without repairs |
| `historia` (ἱστορία) | `deep-research` | inquiry; Herodotus called his work the display of his inquiry | investigation delivered as written findings |
| `scholion` (σχόλιον) | `rationale-records` | marginal note on a manuscript, keyed to one passage | a personal note anchored to one code snippet, outside the project docs |
| `horos` (ὅρος) | `generating-api-docs` | boundary stone; Athenian horoi publicly declared the obligation on a plot | the caller contract at the boundary, never the implementation |
| `peira` (πεῖρα) | `e2e-test-workflow` | trial, attempt; the root of *empirical* | scenarios are tried against a real environment |

`dokimasia` and `euthyna` were the two scrutinies an Athenian official faced, on
entering and on leaving office. Here they split review into the plan before
implementation and the code after it.

## Methods behind the skills

Each skill encodes a small number of established methods rather than a house
style. Knowing which ones explains why a skill insists on a step, and where to
look when extending it.

### `arche`

- **First-principles reasoning:** separate true constraints from conventions and unverified assumptions, then work from the root problem.
- **Five Whys (Toyota):** for a single solution-shaped ask; a system traces its business, technical, historical, and operational roots instead.
- **Value Gate:** the status quo is the baseline against existing capability, process adaptation, and system change, so design starts only when building is worth it.
- **Option tournament and inversion (Jacobi, popularized by Munger):** compare fundamentally different mechanisms, then ask when the winner would be the worst approach and what remains unsolved after it lands.
- **Pre-registration (experimental science) with an explicit stopping rule (Simon's satisficing):** the Bestness Check writes down fit criteria, closest alternative, defeat condition, and marginal-gain stop before recommending.

### `dokimasia`

- **Popperian falsification:** independent reviewers attack the candidate, with a second model as a stronger falsifier for same-model blind spots.
- **Fail-closed gating (safety engineering):** the exact gate refuses on anything missing or unreconciled; there is no approximate pass.
- **Consequence-based severity:** fixed by consequence, never by review cost.
- **Perspective-based reading (Basili):** at full depth one reviewer walks the candidate as the operator on call, the single perspective an A/B trial found worth its cost.
- **Decision Envelope:** the technical verdict stays separate from the value decision, which review never recomputes.

### `historia`

- **Evidence hierarchy:** primary sources outrank non-primary ones.
- **Triangulation:** claims are cross-checked across independent evidence lanes.
- **Strong inference (Platt; Chamberlin's multiple working hypotheses):** rival explanations stay alive until a distinguishing check separates them.

### `tekton`

- **Contract thinking:** define the change as an observable outcome, the behavior that must stay true, and evidence that separates success from a plausible wrong result; a bug fix's oracle is independent of the defect.
- **Change impact analysis (Bohner & Arnold):** trace producers and consumers from real entry points, separating source-level reachability from the path actually taken.
- **Legacy-code technique (Feathers):** characterization tests preserve existing behavior; seams exist only for demonstrated variation.
- **Deep modules (Ousterhout):** substantial coherent complexity behind a small interface that states everything callers must know.
- **DRY in its original sense (Hunt & Thomas):** one authoritative owner per rule; callers use the decision without reproducing its conditions.
- **Evolutionary refactoring patterns (Fowler's catalog):** parallel change, branch by abstraction, strangler, expand-migrate-contract, each exiting on obsolete-path removal.
- **Incremental delivery:** load-bearing assumptions are checked before each slice, every slice is verifiable, and intermediate states stay valid for callers and data.
- **Verification matched to risk:** mutation analysis (DeMillo) and focused independent review when warranted.

### `euthyna`

- **Popperian falsification, in both directions:** challenge the implementation with counterexamples, then seek evidence that refutes each candidate finding.
- **Contract-based review:** the object under challenge is a threatened requirement or compatibility contract, never historical behavior alone.
- **Consequence-based severity:** kept separate from evidence strength.
- **Findings and remedies validated separately:** a confirmed defect does not show that a fix preserves the contracts.
- **Revision-bound evidence:** every finding is reproducible at the reviewed revision.
- **Independent reads over one deeper read:** a review that gates acceptance runs two or three fresh reads with different entries and merges them without dropping or voting; each finding stands on its own evidence.

### `peira`

- Planning
  - **Model-based test design (Ammann & Offutt):** coverage criteria over the input space (Base-Choice, Pairwise), the state graph, and decision logic; a rule firing on several independent conditions owes one obligation per condition, the deciding-condition idea from MC/DC.
  - **Independent oracle:** expected-result authority is separated from implementation evidence.
  - **Change impact analysis (Bohner & Arnold):** follow affected contracts through shared writers, readers, callers, and subscribers.
- Execution
  - **RIPR model's shape:** per scenario, a reachable trigger, propagation to a system-level outcome, and a bounded observable completion predicate.
  - **Order of volatility (digital forensics):** volatile failure scenes are captured before retries or cleanup can destroy them.
  - **PROV-style provenance:** plan, run, and artifacts reconstruct from the artifacts alone.
  - **Explicit SUT boundary:** every real dependency and double is declared.
- Presentation
  - **Single source of truth:** Markdown is canonical; HTML is a checked projection of it.
  - **A derived view restates, never computes:** a brief carries only values the canonical report already states, each linked back to the case or finding that established it.

### `horos`

- **Design by contract (Meyer) and information hiding (Parnas):** document the caller contract, never the implementation.
- **Target contract:** the intended external contract, never a current defect.
- **Authority separated from evidence:** the approved contract decides what the interface promises, the inspected revision fills in what the contract leaves open, and a disagreement between them is reported as a defect.

### `scholion`

- **Chesterton's fence:** record why code is implemented this way and what behavior a seemingly simpler rewrite would break.
- **DRY in its original sense (Hunt & Thomas):** one invariant, one current owner.
- **Code-to-reason lookup:** each record pairs a file path with a code snippet that matches exactly once in that file, so a maintainer can find the implementation rationale from the code.
- **A record is an interruption:** its title names what a natural rewrite would break, because the reader arrives mid-edit and the anchor has already answered whether the record applies to them.

## Lifecycle placement

```
plan         arche → dokimasia   ← decide the plan, then falsify it
implement    tekton              ← trace the roots, then shape the smallest safe change
review-code  euthyna             ← challenge the code and the findings; report without editing
verify       peira (plan → run → render · brief) · horos
investigate  historia            ← answer questions from evidence
              ↑ discovered unknowns feed the next plan
```

These skills keep the work itself correct. Stress-testing a plan the user
already holds (interview/grill-style skills) sits between planning and review
and lives outside this repository.

## Compatibility

These skills are independent of any orchestration runtime, and each is
independently distributable.
`dokimasia` binds the same portable workflow to each host's read-only reviewer:
a fresh-context reviewer uses the runtime's read-only agent capability, a
second-model reviewer uses the read-only second-model capability the runtime
offers, and availability is resolved and recorded once at freeze time.

`peira` is model-invoked in both hosts; typed by hand, a leading `plan`,
`run`, `render`, or `brief` selects the mode: `/organon:peira plan …` in Claude Code,
`$organon:peira plan …` in Codex. It replaces the retired `e2e-test-planner` and
`e2e-test-executor`.

The eight skills were renamed from `first-principles-planner`, `assayer`,
`arborist`, `scrutineer`, `deep-research`, `rationale-records`,
`generating-api-docs`, and `e2e-test-workflow` (see [Naming](#naming)).
`node scripts/install-skills.cjs --apply` removes every per-skill link into
this repository, including those a renamed skill left behind, and installs the
plugin. Real directories and links elsewhere stay. `scholion` keeps its state
under `~/.agents/state/rationale-records`, so existing indexes and pending
worktree handoffs carry over.

`euthyna` can run directly or in a fresh-context reviewer delegated by an
implementation workflow. It owns code review, `tekton` owns implementation,
and `dokimasia` owns design/plan review; none requires the others to be installed.

## Repository layout

```
plugins/organon/       # the plugin: Claude and Codex manifests plus skills/
  skills/              # source skills, one directory per skill
.claude-plugin/        # Claude Code marketplace
.agents/plugins/       # Codex marketplace
tools/                 # portable user-level agent tools
scripts/               # installers and contract checks
docs/                  # research notes and plans (local-only, Git-ignored)
evals/                 # eval run artifacts (local-only, Git-ignored)
tests/                 # test suites run by the gate (local-only, Git-ignored)
AGENTS.md              # shared repository contract
CONTEXT.md             # canonical domain terms for skill distribution
CLAUDE.md              # Claude Code entry: one @AGENTS.md import
global-agent-rules.md  # portable user-level rules for any repository
```

Each skill directory contains a task-facing `SKILL.md` (with `name` / `description`
routing frontmatter), optional `REFERENCE.md` and other detail files loaded on
demand, and optional `scripts/` and local-only `tests/`.

## Agent tools

The organon plugin carries one Stop hook, [`hooks/stop.mjs`](plugins/organon/hooks/stop.mjs),
registered for Claude Code in `hooks/hooks.json` and for Codex in its plugin
manifest. Before an agent stops it runs the [scholion](plugins/organon/skills/scholion/)
check when the repository has `docs/rationale`, and the repository's own
`docs/tools/run-agent-gates.mjs` when present; a repository with neither is left
untouched. Codex asks you to trust the hook once, and again after it changes.
Business repositories may carry Git-ignored personal records under
`docs/rationale`, but never formatter/checker executables, runtime hooks, or rationale state.

The [portable Java formatter](tools/java-formatter/) stays a user-level tool that
repository dispatchers call:

    node scripts/install-agent-tools.cjs
    node scripts/install-agent-tools.cjs --apply
    node scripts/contract-java-formatter.mjs
    node scripts/contract-organon-hook.mjs
    node scripts/contract-scholion.mjs

The installer links the formatter into `~/.agents/tools`. It also removes what
earlier installs placed for the hook: the global Stop handler in each runtime's
settings and the `~/.agents/tools/scholion` link, keeping unrelated hooks and settings.

It also installs [`global-agent-rules.md`](global-agent-rules.md), the user-level
rules for every repository: `~/.codex/AGENTS.md` becomes a file symlink to it, or
a byte-identical copy where a file symlink needs elevation (Windows without
Developer Mode), and `~/.claude/CLAUDE.md` gets one `@import` line pointing at it.
The installer preserves unrelated Claude content and refreshes its own managed
Codex copy. A Codex file the installer did not write is reported, never replaced.
`node scripts/assert-installed-copies.cjs` re-checks the copy, so re-run the
installer after editing the rules file.

## Testing

Follow the verification requirements in [AGENTS.md](AGENTS.md#verification-and-completion).

## Contributing

Read [AGENTS.md](AGENTS.md) before repository work. It owns source ownership,
portability, authoring, and verification requirements for skills and tools.
Skill creation and improvement use the current runtime's official
`skill-creator`, with `writing-for-agents` for wording and information structure.
Repository-specific constraints remain in `AGENTS.md`.
