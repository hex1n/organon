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
`node scripts/install-plugin.cjs --apply` does both installs and removes the
per-skill links an earlier link install left. Claude Code reads a local
directory marketplace in place, so source edits apply at the next session or
`/reload-plugins`. Codex runs a cached copy: re-run the installer after editing
a skill, and the gate's installation-state check reports a stale copy.

### Verify installation

| Command | Environment | What it verifies |
| --- | --- | --- |
| `node scripts/assert-installation-state.cjs` | Local checkout, also run by the default gate | Checks installed managed copies for drift and checks Claude's registration without starting its CLI. |
| `node scripts/contract-installation-state.mjs` | Local installation with the Claude CLI | Also queries Claude for the actual plugin load directory and version and checks its cached contents where applicable. |
| `node scripts/contract-installation-state.mjs --self-test` | Isolated fixtures without installed agents | Checks installation-state reporting, cache drift detection, installer previews, and same-version Codex refresh and rollback. |
| `node scripts/contract-installation-state.mjs --codex-refresh <absolute-path-to-codex.exe>` | Windows, PowerShell and a real Codex executable | Exercises same-version refresh while the cache parent or config is held open. Holding the version directory must preserve the old cache on failure and allow a successful retry after release. All cases check final cache contents and config bytes. |

The CI matrix runs the gate and `--self-test` on Windows, Linux, and macOS with
Node.js 24. Those fixtures cover paths with spaces and Unicode and directory
aliases. `--codex-refresh` prints `SKIP` and exits zero on other platforms.

The same-version fixture runs the installer CLI against an isolated registered
cache. Apply must repair changed, missing and extra files, preserve config bytes
and make no runtime CLI calls. A second apply must report zero changes. The
rollback fixture injects an activation failure after the old cache has moved
aside, checks that the old tree is restored, and verifies that retry converges.
Record the tested source revision or diff, command, platform and result for each
scenario, including any `SKIP`.

## Skills

Skills are authored once as source assets and can be distributed into one or
more agent runtimes as managed installed skills. See [CONTEXT.md](CONTEXT.md)
for the distribution vocabulary.

| Skill | Focus | Purpose |
| --- | --- | --- |
| [`arche`](plugins/organon/skills/arche/) | plan | Plan or decide from the root problem: separate constraints from assumptions, compare mechanisms, and return the current-best path with its failure condition and next check; also answers whether to build at all and challenges to a recommendation just given. |
| [`dokimasia`](plugins/organon/skills/dokimasia/) | review | Independently falsify one completed design or plan revision: review-only ends after one complete round with GO, NO_GO, or SUSPENDED; on request, review-and-revise iterates on the exact final revision until every required reviewer returns GO or the review suspends. Depth follows the candidate's risk and decides reviewer strength. |
| [`historia`](plugins/organon/skills/historia/) | investigate | Evidence-backed investigation whose deliverable is written findings, not a fix: what is true, why behavior occurs, which option the evidence supports. |
| [`tekton`](plugins/organon/skills/tekton/) | implement | Implement, fix, refactor, or migrate code, new or existing, or land a design document or adjudicated plan, without breaking the callers, stored data, or tests the change reaches. Traces the affected contracts first, changes code in verifiable slices, closes a defect only where it was reproduced, keeps a guard only with a real entry, an owner and a test that fails without it, and delivers evidence on the final version that the contracts hold. |
| [`euthyna`](plugins/organon/skills/euthyna/) | review | Establish what correct means, then independently review business and system behavior alongside implementation and structure; investigate defects, unnecessary complexity and material risks, and synthesize the evidence without editing the candidate. |
| [`horos`](plugins/organon/skills/horos/) | land/verify | Generate backend API docs across RPC and HTTP protocols from code-backed contracts, for one interface, one requirement's backend API, or a branch's API changes. |
| [`ichnos`](plugins/organon/skills/ichnos/) | record | Record consequential decisions, reversals or blockers as they arise when their reasons or evidence matter to what happens next. Use a brief Markdown handoff for routine continuation. |

## Naming

Each skill takes the classical Greek word for its core move. The former names
survive only in history and in install links made before the rename; see
[Compatibility](#compatibility).

| Skill | Former name | Original sense | Why it fits |
| --- | --- | --- | --- |
| `arche` (ἀρχή) | `first-principles-planner` | origin; first principle | plans from the root problem |
| `dokimasia` (δοκιμασία) | `assayer` | Athenian scrutiny of an official before taking office; its verb also named the testing of coin | a plan is falsified before it is built |
| `tekton` (τέκτων) | `arborist` | builder, carpenter; the root of *architect* | builds to contract: new code that holds up, existing code whose callers, data, and tests stay intact |
| `euthyna` (εὔθυνα) | `scrutineer` | Athenian accounting of an official at the end of a term; its examiners dismissed a charge or referred it to a court | code is examined after it is built, and findings go back without repairs |
| `historia` (ἱστορία) | `deep-research` | inquiry; Herodotus called his work the display of his inquiry | investigation delivered as written findings |
| `horos` (ὅρος) | `generating-api-docs` | boundary stone; Athenian horoi publicly declared the obligation on a plot | the caller contract at the boundary, never the implementation |
| `ichnos` (ἴχνος) | — (new) | track, footprint; the trace a hunter reads back to the animal | a reviewer follows the trail back to each decision and its evidence |

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
- **Make illegal states unrepresentable (Minsky):** a guard stays only with a production entry that delivers the illegal shape, the invariant's owner, and a test that fails without it; parallel structures merge into one type instead of being guarded.
- **Tests as oracles:** run the real core behind faked data boundaries, start fixtures from real samples with provenance, and assert values, error codes and final store state at the owning boundary.
- **Verification matched to risk:** mutation analysis (DeMillo) and focused independent review when warranted.

### `euthyna`

- **Independent expectations:** derive correctness from the business objective and supported contracts, distinguishing the goal, chosen approach and implementation.
- **Complementary perspectives:** one reviewer traces business and system outcomes; another examines rule ownership, implementation structure and concrete maintenance cost.
- **Causal evidence:** establish reachable consequences and challenge the premises of a finding; unresolved material premises remain risks.
- **Ablation and test oracles:** investigate disputed complexity and defenses with focused experiments, while checking what their observations can establish.
- **Independent falsification:** challenge material conclusions, including agreement and favorable judgments; resolve them by evidence and retain deciding gaps, distinct affected outcomes and coverage limits.

### `horos`

- **Design by contract (Meyer) and information hiding (Parnas):** document the caller contract, never the implementation.
- **Target contract:** the intended external contract, never a current defect.
- **Authority separated from evidence:** the approved contract decides what the interface promises, the inspected revision fills in what the contract leaves open, and a disagreement between them is reported as a defect.

### `ichnos`

- **Contemporaneous, attributable records (ALCOA data-integrity principles):** record consequential choices when they arise; each contributing run identifies its rows.
- **Correcting entries, never erasure (bookkeeping):** a wrong row stays and a later row supersedes it.
- **Proportionate audit:** check new material rows against their evidence and include them in any review the work already requires.

## Lifecycle placement

```
plan         arche → dokimasia   ← decide the plan, then falsify it
implement    tekton              ← trace the roots, then shape the smallest safe change
review-code  euthyna             ← challenge the code and the findings; report without editing
document     horos               ← describe the backend API contract
investigate  historia            ← answer questions from evidence
              ↑ discovered unknowns feed the next plan
as needed    ichnos              ← keep an auditable decision history
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

`node scripts/install-plugin.cjs --apply` installs the plugin and removes
per-skill links targeting this checkout, including former names.

Scholion has retired. Read existing Git-ignored files under `docs/rationale/`
as Markdown. For a pending worktree handoff, use the Scholion CLI from commit
`a2836ca` with the existing state under `~/.agents/state/rationale-records`.

Managed plugin caches are replaceable copies of this repository. Applying a
planned cache refresh with `--apply` replaces cache-local edits, restores missing
files and removes extra cached files to match current source. Both source updates
and cache edits can trigger synchronization. Keep personal customisations in a
separate override skill outside the managed plugin cache.

For an already registered Codex install with one cached version, same-version
source edits refresh that version directory transactionally and preserve the
user configuration. Initial installation, version upgrades and marketplace moves
use the runtime CLI. If the version directory is in use, refresh leaves the old
cache intact; retry after its reader releases it. Rerunning after an interrupted
version switch rebuilds the registered cache from source.

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
USER-AGENT-RULES.md    # portable user-level rules for any repository
```

Each skill directory contains a task-facing `SKILL.md` (with `name` / `description`
routing frontmatter), optional `REFERENCE.md` and other detail files loaded on
demand, and optional `scripts/` and local-only `tests/`.

## Agent tools

The organon plugin carries one Stop hook, [`hooks/stop.mjs`](plugins/organon/hooks/stop.mjs),
registered for Claude Code in `hooks/hooks.json` and for Codex in its plugin
manifest. Before an agent stops, the hook runs the repository's
`docs/tools/run-agent-gates.mjs` when present. Codex asks you to trust the
hook once, and again after it changes.

The [portable Java formatter](tools/java-formatter/) stays a user-level tool that
repository dispatchers call:

    node scripts/install-agent-tools.cjs
    node scripts/install-agent-tools.cjs --apply
    node scripts/contract-java-formatter.mjs
    node scripts/contract-organon-hook.mjs

The [personal Git hooks](tools/git-hooks/) are another user-level tool linked
under `~/.agents/tools`. Repositories opt in with their own test-path settings;
the tool installer does not change global Git hooks or Agent Stop hooks.

[run-queued](tools/long-run/) is linked the same way. It runs one build or test
at a time on the machine, keeps the complete output in a file, and reports the
elapsed time; check it with `node scripts/contract-long-run.mjs`.

The installer links the formatter into `~/.agents/tools`. It also removes what
earlier installs placed for the hook: the global Stop handler in each runtime's
settings and the `~/.agents/tools/scholion` link, keeping unrelated hooks and settings.

It also installs [`USER-AGENT-RULES.md`](USER-AGENT-RULES.md), the user-level
rules for every repository: `~/.codex/AGENTS.md` becomes a file symlink to it, or
a byte-identical copy where a file symlink needs elevation (Windows without
Developer Mode), and `~/.claude/CLAUDE.md` gets one `@import` line pointing at it.
The installer preserves unrelated Claude content and refreshes its own managed
Codex copy. A Codex file the installer did not write is reported, never replaced.
`node scripts/assert-installation-state.cjs` re-checks the copy, so re-run the
installer after editing the rules file.

## Testing

Follow the verification requirements in [AGENTS.md](AGENTS.md#verification-and-completion).

## Contributing

Read [AGENTS.md](AGENTS.md) before repository work. It owns source ownership,
portability, authoring, and verification requirements for skills and tools.
Skill creation and improvement use the current runtime's official
`skill-creator`, with `writing-for-agents` for wording and information structure.
Repository-specific constraints remain in `AGENTS.md`.
