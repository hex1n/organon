# Reviewer Handoff

The caller passes a pinned JSON brief against
[handoff-schema.json](handoff-schema.json) as the reviewer's whole task.
The validator checks shape and source identity; the reviewer checks the
request and derives its own checks. Keep builder conversation, reasoning,
advisor output, checklists, mutation results, suggested findings and
task-specific memory out of the brief.

## Brief

```json
{
  "role": "delegated-reviewer",
  "skill": { "path": "<euthyna/SKILL.md>", "revision": "<commit or content hash>" },
  "language": "<report language>",
  "review": "initial | re-review",
  "review_series": "<stable id shared by every round on this candidate>",
  "request": {
    "original": [{ "date": "<YYYY-MM-DD>", "text": "<the user's message, verbatim>" }],
    "confirmed_corrections": [{ "date": "<YYYY-MM-DD>", "text": "<the user's correction, verbatim>" }],
    "discovered_requirements": [{ "requirement": "<found during implementation>", "source": "<where it comes from>" }]
  },
  "authority": {
    "contract_sources": [{ "path": "<spec, interface doc, approved plan, or parity target>", "revision": "<...>" }],
    "repository_rules": [{ "path": "<AGENTS.md / CLAUDE.md / CONTRIBUTING>", "revision": "<...>" }],
    "review_checklists": [{ "path": "<repository-owned review list>", "revision": "<...>" }]
  },
  "lenses": {
    "selected": [{ "heading": "<LENSES.md section the change triggers>", "reference": { "path": "<references/LENSES.md>", "revision": "<...>" } }],
    "excluded": [{ "heading": "<section>", "reason": "<the fact in this change that excludes it>" }]
  },
  "scope": {
    "candidate": {
      "revision": "<commit, branch tip, or working tree at <HEAD sha>>",
      "content_identity": [{ "path": "<uncommitted file or supporting input>", "identity": "sha256 <hex>" }]
    },
    "base": "<merge-base sha, parent sha, or HEAD for working-tree review>",
    "uncommitted": [{ "path": "<included path>", "state": "staged | unstaged | untracked" }],
    "before_state": "<snapshot, patch, or list of what existed before moves or deletions, or \"not needed\">",
    "coverage_plan": [{ "surface": "<path, module, or contract>", "depth": "in-depth | sampled | skipped" }]
  },
  "target": {
    "contracts": [{ "contract": "<obligation the change touches>", "source": "<its authority>" }],
    "entry_points": ["<path or symbol that reaches it, producers and consumers included>"],
    "unresolved_paths": ["<what the builder's trace left unobserved; \"unknown\" where that is the truth>"]
  },
  "access": {
    "read_only_mechanism": "<host protection for the pinned review sources and shared state>",
    "check_entry_points": [{ "command": "<test, lint, or build command>", "covers": "<what it covers>" }],
    "evidence_sources": [{ "source": "<data, logs, or another record of how the system behaves>", "read_by": "<the read-only way to query it>" }],
    "isolated_copy": "<writable validation workspace and permitted execution scope, or \"not authorized\">"
  },
  "prior_evidence": [{ "path": "<test results or CI run>", "revision": "<...>" }],
  "report": {
    "rules": { "path": "<euthyna/REPORT.md>", "revision": "<...>" }
  },
  "record_output": "<path to write the review record, or \"inline\">",
  "re_review": {
    "previous_report": { "path": "<the prior record>", "revision": "<...>" },
    "responses": { "path": "<the builder's per-id answers>", "revision": "<...>" },
    "previous_candidate": { "path": "<prior round's brief file or retained snapshot manifest>", "revision": "<...>" }
  }
}
```

The schema fixes the shape; these are the fields whose meaning it cannot carry.

- `request.original` and `confirmed_corrections` hold the user's messages, one
  item per message with its date, verbatim. A plan, design, or spec the user
  approved is a contract source by path and revision; restated here it puts
  the builder's words where the user's belong, and the reviewer then reviews
  the builder's framing of the request.
- A **reference** (`skill`, the `authority` lists, `lenses.selected[].reference`,
  `prior_evidence`, `report.rules`, `re_review`) has a `path` and `revision`.
  For a committed file, use a Git object name. For an uncommitted or untracked
  file, use `sha256 <hex>` of its current bytes.
  The reviewer reads that exact version with `git show <revision>:<path>`,
  or checks the hash before reading. The caller may keep working during review;
  the validator checks both ways of pinning the source.
  Use `text` only when the reviewer's filesystem cannot reach the file.
  The brief carries no record schema. The reviewer uses the template in the
  `report.rules` file.
- `lenses` is the caller's selection, because selection reads the diff and the
  reviewer has not seen it yet: each section of
  [references/LENSES.md](references/LENSES.md) whose trigger the change meets
  goes under `selected` with its heading, the rest under `excluded` with the
  fact that excludes each. The two lists partition that file, every section
  once, on one side or the other.
- `scope.candidate.content_identity` pins the uncommitted files in scope and
  the supporting inputs the review evidence depends on, each `identity` as
  `sha256 <hex>` of the file as it is now, so the reviewer recomputes the
  same digest. `coverage_plan` uses the record's `in-depth | sampled | skipped`
  vocabulary, one row per surface, so the record's `coverage.surfaces` reports
  the plan and its outcome instead of reconstructing them afterward. Group
  surfaces by affected contracts and the boundaries needed to judge them.
  Include a verification helper as source when its assertions establish one of
  those contracts, including an untracked helper in task scratch. Raw results
  alone do not establish that the helper checks the right property.
- `access.evidence_sources` lists what the reviewer may read beyond the
  repository to learn how the system actually behaves, such as captured data,
  a test data source, or logs, each with its read-only way in; the list is
  empty only when the project has no such source. The review establishes a
  trigger's conditions from these and the falsification check reads the same
  ones, so a source the brief leaves out turns the findings that need it into
  risks.
- `access.read_only_mechanism` protects the pinned review sources and shared
  state; it does not require every reviewer tool to be read-only.
  `access.isolated_copy` names the separate writable validation workspace and
  authorized execution scope, including any local database fixture. Existing
  fields also support static review: use `not authorized` when experiments are
  unavailable. Missing execution access limits the affected conclusion, not
  the source review. Each concurrent writer uses its own isolated workspace.
- `target`, `prior_evidence`, and `re_review.responses` are builder-held
  navigation: facts and unknowns, never conclusions. An entry point is
  navigation; "this path is safe" is a finding. The reviewer derives its
  checks from the request, the diff, and the authority sources first and
  reads these after, so they focus the work without steering it.
- `re_review.previous_candidate` lets the reviewer show which files the repair
  left unchanged when the prior round reviewed a working tree: pin the prior
  round's brief file, whose `content_identity` lists each file, or the
  retained snapshot manifest. A prior commit needs none; Git compares it.
  Prior source copies the reviewer must read go in `prior_evidence`.

## Check and dispatch

Before dispatch, the caller runs
`node <skill-dir>/scripts/validate-handoff.cjs <brief.json>`.
On acceptance, the reviewer runs it when Node and the skill directory are
reachable; otherwise inspect the same requirements manually. Each reference
must be readable at its pinned revision or carry its text. Each content identity
must match the current file digest. The lens lists must partition LENSES.md,
and a re-review must include its prior round, with `previous_candidate` when
the prior record names no commit.

The validator cannot distinguish a quote from a paraphrase. Report a
`request.original` item that restates the task instead of quoting the user's
message.

The brief is a file the launch message names, or inline. The launch message
carries the brief's location and the permissions the reviewer runs under;
anything else the reviewer needs to know is a brief field, so it is checked
like one. Every reference the brief pins is authorized reading, taken after
the reviewer derives its checks; a launch restriction that covers a pinned
path contradicts the brief. Before dispatch, confirm that the launch text and
host read access reach every pinned path. The validator checks readability
from the caller's filesystem only. Those permissions keep the one
falsification dispatch [SKILL.md](SKILL.md#test-the-failure-hypothesis)
allows, and the launch
leaves enabled the host capability the table below names for it; a reviewer
launched without it records `not-run` on every finding that owed the check.
A brief that fails
the check comes back `blocked` naming the gap, and the corrected brief starts
a new reviewer, because a context that has read builder material is not
restored by ignoring it. Without a review-method skill the reviewer still
derives its checks from the requirements and the diff before reading builder
material, and reports under REPORT.md's prose rules. A length cap set by the caller
bounds the summary, never the required sections.

## Host mechanisms

The caller owns host verification. Check the actual launch configuration and
host receipt for context inheritance, protected review sources, writable roots
and enabled execution and data tools. Bind the
returned result to that reviewer/session, and record those facts in
`mode.host_evidence`, naming each automatic context source the host offers
for the session (memory, project instructions, a resumed transcript) and
showing it off or empty. A role label or planned command is not execution
evidence.

When a session receipt is available only after dispatch, the reviewer may
return its source review with `mode.host_evidence` marked pending caller
verification. It need not discover its own process or read its startup log.
Before delivery the caller replaces that pending value with observed evidence,
checks the record, and renders the report. If isolation cannot be established,
retain the findings and limits but set the overall verdict and `mode.context`
to `blocked`, add the isolation gap to `coverage.limits`, and validate again;
no independent acceptance claim may escape this check. Those are the only
changes a delivery makes to the returned record, and
[REPORT.md](REPORT.md#delivered-record) checks them. Detected
builder-context contamination still requires a new reviewer. Missing receipt
visibility alone does not.

| Host | Fresh context | Source protection and validation |
|---|---|---|
| Claude Code | The Agent tool with a non-fork subagent type starts an isolated context without the parent transcript. A fork inherits the conversation and does not qualify. | For active validation, use a dedicated agent whose host permissions allow execution and edits only in the isolated workspace, while protecting the pinned sources. `Explore` and `Plan` deny Write and Edit and lack the Agent tool: they support static reads but cannot write tests or dispatch the required falsification check. Observe loaded project instructions per session and carry the needed rules and scope in the brief. |
| Codex | A new `codex exec` session receives the brief without a resumed or forked transcript. Keep `multi_agent` enabled for a `spawn_agent` falsifier with `fork_turns: "none"`; children inherit the sandbox, so verify their available access too. `codex review` uses Codex's own review prompt rather than this skill; use it only when requested and label it accordingly. | For active validation, use `--sandbox workspace-write -C <isolated-workspace>` with the pinned sources outside writable roots, or an equivalent host policy. Verify actual roots and source protection; the sandbox label alone is insufficient. On Windows the sandbox mode comes from the user configuration's `windows.sandbox`; a launch with `--ignore-user-config` passes it with `-c`, or the session refuses every command, reads included. Use `read-only` for static review when writable validation is unavailable. Enable only authorized data tools; filesystem sandboxing does not make a database connection read-only. |
| Other | Any launch whose configuration shows no transcript inheritance. | Protect pinned sources and shared state through the host's filesystem and tool policies; grant experiment writes only in the isolated workspace. Name the actual boundaries in the report. |

When no row applies and the host offers no equivalent, the review is blocked
for lack of context isolation; the caller reports that rather than reviewing
in its own context.
