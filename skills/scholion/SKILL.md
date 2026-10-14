---
name: scholion
description: >
  Maintain personal docs/rationale records that explain why code is implemented
  this way. Use before editing code in a repository that keeps docs/rationale/,
  when a change leaves a constraint a natural-looking rewrite would break, when
  answering a question took reconstructing a rule from source that no record
  states, when the user asks to record or query such a reason, or during
  worktree handoff of rationale notes.
---

# 代码实现理由记录

Rationale is a personal reverse index from a current code snippet to the reason
it is implemented this way. Each record names the file path (文件路径), code
snippet (代码片段), and implementation rationale (实现理由).
It is not project documentation, requirement history,
evidence, or a second test plan.

Create a record when a natural rewrite of current code could break real behavior.
This includes unchanged code whose rationale the task reconstructs. Search first
so the invariant has one current record.

## Main-checkout workflow

1. Confirm this is the main checkout, not a linked worktree.
2. Before editing, find rationale for every affected file and concept using
   source paths, domain terms or known W-IDs. Member lookup is proximity
   navigation; read the matched code and explanations. Repeat for new files.
3. Add or update an active entry under `docs/rationale/<stable-domain>/`. Name
   files `<NN>-<topic>.md` so their reading order is visible. Start every file
   with a topic and one-line `TL;DR` saying what it records. Split large domains
   by stable subdomain or code ownership, never by requirement.
4. Name the record after what it anchors and title it with what a natural rewrite
   would break; use the exact schema in
   [REFERENCE.md](REFERENCE.md#active-entry-schema). IDs are globally unique names,
   never positions.
5. Explain the current mechanism and the consequence of a natural rewrite using
   the reference's [content rules](REFERENCE.md#active-entry-schema). Keep the
   explanation self-contained: define local terms, inputs, outputs and required
   order/value/owner. Add a small text sketch when it clarifies the mechanism.
6. Run a full check after creating, migrating, or restructuring records. Normal
   Codex and Claude Stop hooks use the incremental check.
7. After record or source-line changes, run `scripts/rationale.mjs links --apply`.
   Read [source navigation](REFERENCE.md#source-navigation) for refresh behavior
   and validation limits.

Before relying on an existing explanation, check whether the current task
changes its callers, producers, configuration, or dependency semantics even if
the anchored snippet is unchanged. Search affected domain terms and source
references, then reread only the explanations whose assumptions could change.
Update or remove stale explanations from current code; preserve a missing fact
as unresolved rather than treating an anchor match as semantic validation.
In linked worktrees, put this correction in the handoff note instead of editing
active records.

The checker proves only mechanics: ordered files, exact schema, unique W-IDs,
existing source paths, and file-unique token snippets. Snippet matching ignores
whitespace, indentation, and line breaks but preserves strings, comments, and
token boundaries. It cannot decide what prose means. Before handoff, reread
every changed explanation against current code and the reference's content rules;
keyword filtering cannot establish semantic correctness.

Active records are personal memory: keep `docs/rationale/` Git-ignored and never
stage or commit it. The checker state and handoff receipts live under the user's
`.agents/state/rationale-records`, not in the repository.

## Linked-worktree workflow

The linked worktree never writes or formally validates active rationale. Complete
the code task, then create one unnumbered note only when a qualifying invariant
was found; otherwise explicitly create a `none` handoff. Seal either outcome in a
manifest with `handoff-create`.

After the task commit is integrated, complete the handoff from the main checkout:

1. If the handoff contains a note, merge its current code explanation into active
   rationale. Write the small resolution file described in the reference.
2. Run `handoff-consume`. It validates all code changes since the main checker's
   last successful HEAD and writes a user-local receipt.
3. Run `worktree-finish` immediately. It requires that exact consumption receipt
   before the linked worktree and optional branch can be removed.

Read [REFERENCE.md](REFERENCE.md) for commands, record format, note format, and
failure semantics.
