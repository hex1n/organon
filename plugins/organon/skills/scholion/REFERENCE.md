# Rationale record reference

## Active entry schema

An active rationale file has one ordered filename, one navigation header, then
entries. The file path and header are exact:

```markdown
docs/rationale/<stable-domain>/01-<topic>.md

# <topic>
> TL;DR：一句话说明这个文件记录哪些当前代码约束。
```

Continue with entries in this schema:

```markdown
## W-001 · 一句话点明改成自然写法后哪个行为会变错

- **文件路径** `relative/path/File.ext`
- **代码片段** `one behavior-bearing token sequence unique inside that file`
- **实现理由** 先说明这段代码做什么，再沿数据或控制流解释为什么这样写，以及简化后会改变什么
```

These three labels are the record's only field names; any other line in a record
body is rejected. Keep each `文件路径` and `代码片段` field on one physical line.
The snippet can be plain inline code as above, or the generated inline-code
link described in [source navigation](#source-navigation). Both carry the same
source text and use the same anchor matcher.
Only `实现理由` accepts continuation lines indented by two spaces; reach for an
indented `text` block when order, scale, or two parallel
paths are what the reader must see — prose describing a rounding chain is harder
to check than four aligned lines.

The reader reaches a record while editing its anchored snippet.
The anchor establishes applicability. Use the title to name the behavior a
natural rewrite would break. The id names the anchor; `实现理由` explains the
mechanism. Keep the title focused on the consequence.
If no consequence can be named, the record fails the entry question and should
not exist.

Repeat the `文件路径`/`代码片段` pair when one invariant depends on more than one real
declaration or call. Use repository-relative paths. A snippet must occur exactly
once in its file. Whitespace, indentation, and line breaks are ignored when
matching; strings, comments, and token boundaries are preserved. Anchor
behavior-bearing code; comments, imports and navigation-only fragments do not
qualify.

Anchor the statement, expression, type or ordering whose natural rewrite would
cause the title's consequence. A forwarding call qualifies when its target,
arguments or order carry that invariant.

Quote a complete condition or statement as the snippet.
The text anchors the record even when line numbers move.
If the statement is not unique in its file, expand the quotation.
Join two or three source lines with spaces on one physical line; matching
ignores source line breaks. Keep the expression readable.
A unique fragment such as `.accepts(value)) {` is insufficient when it starts
in the middle of an expression.

When several anchors support one consequence, explain each site's causal role.
Different consequences need separate records. Multiple anchors may expose
duplicated enforcement or necessary relationships across boundaries; their count
alone does not establish either. Consolidate code only when the task authorizes
it and the dependency structure permits it.

A W-ID is a name, unique across all files under `docs/rationale` without regard
to case, and never a position: it says which record this is, not where it sits or
when it was written. The heading separates it from the title with a `·` that
follows blank space, so the name itself may contain `·`.
Name it after what the record anchors — `W-调用顺序`, in the language the
records are written in — so a reference elsewhere reads without a lookup; a plain
number stays a valid name for records that already carry one. The heading's title
then states the claim about that anchor, and can be rewritten as the explanation
sharpens while the id stays put.

Records inside a file are ordered by the code's own flow, not by id; ids of
neighbouring records have no relation, and a higher one is not newer or better.
Active records carry no obsolete entries: update a still-current entry, or remove
it when the current code no longer needs it.

The title and `实现理由` contain no dates, tests, assertions, mutation results,
proof/evidence, samples, incidents, or review history. `实现理由` talks a maintainer
through the anchored code; it is not a decision log or a generic invariant
slogan. Retain current state distinctions, value flow, ownership, and the causal
chain. Remove how the explanation was proven, not the mechanism that makes it
true.

This is a semantic writing rule, not a deterministic checker claim. The CLI
validates the record format and its connection to source code; it deliberately
does not enumerate forbidden words or pretend to classify prose. The agent that
changes an explanation must reread that explanation before handoff and remove
every sentence that is unnecessary for understanding the current code.

When prose hides an important order or ownership boundary, continue the list
item with the smallest useful text sketch. It is optional, not boilerplate:

````markdown
- **实现理由** 先选择规则，再保留原值，最后计算派生值。
  ```text
  input
    select rule
    preserve original
    derive result
  ```
````

## Commands

Run inside the target Git repository. `<skill-dir>` is this skill's base
directory, as the runtime reports it when the skill loads:

```bash
node "<skill-dir>/scripts/rationale.mjs" check --full
node "<skill-dir>/scripts/rationale.mjs" check --incremental
node "<skill-dir>/scripts/rationale.mjs" find W-001
node "<skill-dir>/scripts/rationale.mjs" find TypeName#member
node "<skill-dir>/scripts/rationale.mjs" find path/to/File.ext:120 --full
```

The compatibility wrappers `check-anchors.mjs` and `find-rationale.mjs` delegate
to the same CLI. Use `--records`, repeated `--ext`, or `--src-filter /` for a
non-default layout.

`check --full` validates the entire active corpus. `check --incremental` is the
normal Stop-hook route: on the main checkout it selects changed records plus
records pointing at source paths changed since the last successful HEAD; in a
linked worktree it reports `SKIP linked-worktree`. Missing, corrupt, incompatible,
or non-ancestor state causes a full rebuild. Every schema or anchor problem is a
FAIL; there is no warning state, and failed checks do not advance state.

`Class#member` lookup finds the unique class file and sorts by textual proximity.
It is navigation only, not an AST claim that an anchor belongs to that member.

## Source navigation

After writing records, run the CLI from the target repository to generate links:

```bash
node "<skill-dir>/scripts/rationale.mjs" links
node "<skill-dir>/scripts/rationale.mjs" links --apply
node "<skill-dir>/scripts/rationale.mjs" links --check
```

`links` previews destinations without writing. `--apply` updates only the
`代码片段` fields; `--check` exits 1 if regeneration would change a record.
Every anchor must pass the normal full validation before any file is written.
Writes replace each changed file atomically; after an interrupted multi-file
update, rerun the idempotent command. Linked worktrees cannot run this command.

The generated field looks like this (the destination is relative to the record
file, whereas `文件路径` remains relative to the repository root):

```markdown
- **代码片段** [`apply(first, second);`](<../../../src/main/java/sample/Alpha.java#L42>)
```

Open the record in IDEA, VS Code, or Zed's built-in Markdown preview and click
the code text. All three support local relative links with `#L<line>`; the
preview opens its own editor, so a shared record needs no editor-process
detection, local preference, absolute machine path, or OS URL registration.
Paths use `/` and percent-encoded segments for spaces, Unicode, `#`, and `%`.
Backticks within source snippets receive a longer Markdown code delimiter.
This targets local source files; remote workspace routing and other Markdown
viewers are outside the tested contract. Use current editor releases.

The snippet remains the anchor; the line number is derived navigation data.
After source edits, record moves, or snippet changes, rerun `links --apply`.
Normal `check` and Stop hooks validate snippets but do not refresh links or
prove the stored destination is current; use `links --check` for that check.
The command reads saved files, so save editor buffers before refreshing.

The navigation behavior is grounded in the editors' handlers:
[IDEA](https://github.com/JetBrains/intellij-community/blob/master/plugins/markdown/core/frontend/src/com/intellij/markdown/frontend/preview/accessor/impl/MarkdownLinkOpenerImpl.kt),
[VS Code](https://github.com/microsoft/vscode/blob/main/extensions/markdown-language-features/src/util/openDocumentLink.ts),
and [Zed](https://github.com/zed-industries/zed/blob/main/crates/markdown_preview/src/markdown_preview_view.rs).
Source compatibility is distinct from exercising GUI clicks on each OS.

## Worktree handoff

An optional unnumbered note can be free-form but should contain only candidate
current code explanations and code locations. Keep it under `.scratch`, for example
`.scratch/rationale-handoff.md`; do not name new W-IDs in the linked worktree.

```bash
node "<skill-dir>/scripts/rationale.mjs" handoff-create \
  --task TASK-ID --base BASE-COMMIT --note .scratch/rationale-handoff.md

# Use --note none when the task found no qualifying invariant.
node "<skill-dir>/scripts/rationale.mjs" handoff-create \
  --task TASK-ID --base BASE-COMMIT --note none
```

After integration, a note requires a main-checkout resolution JSON outside active
rationale:

```json
{
  "handoffId": "copied from the manifest",
  "noteHash": "copied from the manifest",
  "status": "processed"
}
```

Then consume and finish from the main checkout:

```bash
node "<skill-dir>/scripts/rationale.mjs" handoff-consume \
  --manifest /path/to/worktree/.scratch/rationale-handoff.json \
  --resolution .scratch/rationale-resolution.json

node "<skill-dir>/scripts/rationale.mjs" worktree-finish \
  --manifest /path/to/worktree/.scratch/rationale-handoff.json \
  --main-root /path/to/main --branch task-branch

# Re-run only after READY with the same arguments plus --apply.
```

`handoff-consume` requires the task HEAD to be integrated and binds a receipt to
that handoff, note hash, task HEAD, and current main HEAD. `worktree-finish`
refuses stale/missing receipts or any leftover file other than the sealed note
and manifest. Without `--apply` it is a non-destructive readiness check.
