# Reviewer Handoff

Use this protocol for a recorded review selected by [SKILL.md](SKILL.md#enter-a-fresh-review-context).
Ordinary prose reviews use its neutral brief; [Host mechanisms](#host-mechanisms)
also applies when setting up their dispatch. The caller owns packaging and host
verification; the reviewer independently derives checks from the pinned request.

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

The [schema](handoff-schema.json) owns shape. Preserve these source meanings:

- Quote dated user requests/corrections verbatim. Pin approved plans, specs and
  repository rules as authority; builder reasoning, proposed findings and
  task-specific memory stay outside the brief.
- Pin references by path and Git object, or `sha256 <hex>` for uncommitted bytes.
  Read committed bytes with `git show <revision>:<path>`; verify other hashes.
  Inline `text` only when files are unreachable. REPORT.md supplies the record
  template; the brief carries no record schema.
- Partition every lens heading once between selected and factually excluded.
  `content_identity` includes all in-scope uncommitted files and supporting inputs,
  including deciding assertion helpers. Keep recoverable before-state for moves
  and deletions; coverage surfaces group contracts and deciding boundaries.
- `target`, prior evidence and repair responses are factual navigation/unknowns,
  not builder conclusions. The reviewer derives checks before consulting them.
- List permitted data/log sources and their read-only entry, empty only if absent.
  Omitted deciding evidence limits the affected conclusion to risk. Protect pinned
  sources/shared state; authorize experiments only in a separate validation root,
  or use `not authorized`. Give falsifiers the same access.
- A prior working-tree review pins its brief or retained manifest so unchanged
  bytes can be established; Git suffices for a prior commit. Keep needed old
  source copies recoverable. Re-review inputs follow the schema.

## Check and dispatch

The caller runs `node <skill-dir>/scripts/validate-handoff.cjs <brief.json>` before
dispatch. The reviewer checks actual request, source identities, access and
misquotation. Repeat schema validation only if that caller check is absent or the
brief changed; without an executable checker, check the requirements manually.
Schema success proves neither truthful context nor readable protected sources.

Dispatch the brief with actual permissions, retaining the host capability for the
one bounded [falsification](SKILL.md#test-the-failure-hypothesis). If unavailable,
record the dispatch barrier. Invalid briefs return blocked and require a corrected
brief in a fresh context; ignoring builder material already read cannot undo
contamination. Without a review-method skill, derive checks from request, diff and
authority before navigation, then use REPORT.md. Summary caps never waive disclosure.

## Host mechanisms

The caller verifies actual inheritance, loaded context, protected/writable roots,
execution/data permissions and returned session identity, bound to the brief.
Ordinary reviews retain a compact receipt beside the prose; recorded reviews put
these facts in `mode.host_evidence`. Inspect loaded content for excluded builder reasoning/memory;
neutral authority and tool/skill metadata may load. Role labels or planned commands
are insufficient. Caller-readable files do not prove reviewer/child access.

A reviewer need not locate its own receipt. Receipt-only host facts may remain
pending caller verification in `mode.host_evidence`; this alone does not block the
review. The caller resolves them before [recorded delivery](REPORT.md#delivered-record);
ordinary reviews keep the raw return and verified caller conclusion beside it.
If isolation cannot be established at delivery, retain findings, mark context/verdict
blocked and append the gap. Actual contamination needs a new reviewer.

| Host | Fresh context | Source protection and validation |
|---|---|---|
| Claude Code | Non-fork Agent context without parent transcript. | Active validation protects pinned sources and permits writes only in the isolated workspace. Explore/Plan deny Write/Edit and lack Agent: static reads work, test writes and required falsification do not. Observe loaded project instructions and supply needed rules/scope in the brief. |
| Codex | New `codex exec`, no resume/fork inheritance; enable `multi_agent` for a falsifier with `fork_turns: "none"`. | Static review can use `read-only`. Active validation uses `workspace-write -C <isolated-workspace>` with sources outside writable roots, or verified equivalent policy. Check actual roots/child access. Windows needs configured `windows.sandbox`, including with `--ignore-user-config`. Enable only authorized data tools; filesystem policy does not make database calls read-only. `codex review` supplies its own prompt: use only when requested and label it. |
| Other | Host establishes no transcript inheritance. | Protect source/shared state, permit writes only in an isolated validation root and record actual boundaries. |

Without a verified mechanism, keep isolation blocked instead of reviewing in the
caller's context. Concurrent writers use separate workspaces.
