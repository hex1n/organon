# Personal Git hooks

This directory is the source of truth for personal Git commit checks. The agent
tools installer links it to `~/.agents/tools/git-hooks`; each repository opts in
separately. Installing the tool does not enable it globally or change Agent Stop
hooks.

Requirements: Node.js 24 or newer, Git, and a POSIX shell with `grep` and `sed`. Git for
Windows supplies the shell utilities. `commit-msg` retains the original shell
implementation and its matching rules.

## Install and select a repository

Install the user-level tool link with the existing agent tools installer:

```sh
node scripts/install-agent-tools.cjs
node scripts/install-agent-tools.cjs --apply
```

Then preview the repository configuration through the installed link:

```sh
node ~/.agents/tools/git-hooks/git-hooks.cjs install --repo /path/to/repository --test-path ':(glob)**/src/test/**'
```

Add `--apply` to write this repository's local configuration. A project with a
central test module can use `--test-path app/test/`. Repeat `--test-path` for
several Git pathspecs. To allow new tests while retaining commit-message checks,
select `--allow-new-tests` instead. One of these choices is required.

The installer reports existing hook-directory files and refuses to switch their
directory on apply. Every non-`.sample` file counts as occupied, including
README or backup files; it does not infer executable hook names or permissions.
`--replace-existing` permits that switch after inspection; old hook files
remain on disk. Existing hooks are not chained automatically. Other Git settings
and the Git index are untouched. Preview is read-only. Reapplying the same
configuration is supported.

## Runtime contract

`core.hooksPath` is set locally to this tool's `hooks/` directory through the
installation path used to invoke the command. No business-repository script copy
is needed. `organon.gitHooks.testPaths` contains one JSON array of Git pathspecs;
the installer replaces the complete selection in one config write before
selecting the shared hooks. An empty array is the explicit allow-new-tests mode.
Missing or malformed scope configuration refuses a commit rather than guessing.

`pre-commit` rejects staged additions, copies and renames matching those paths.
Paths already tracked by `HEAD` or a parent in `MERGE_HEAD` remain allowed.
Modifications and deletions of tracked tests remain allowed. Git supplies the
pathspec semantics; NUL-delimited output preserves spaces and Unicode paths.
The check runs at commit time and does not prevent `git add`.

`commit-msg` requires a Conventional Commits subject with optional scope and the
types `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `build`, `ci`,
`style`, `revert`. Subjects beginning `Merge ` or `Revert ` retain their exception.
The original AI coauthor and session-marker checks run before that exception.

## Verification

```sh
node scripts/contract-git-hooks.mjs
node --test tests/install-agent-tools.test.cjs
```

The Git contract uses isolated repositories and the real hook entry points. The
current consumer is checked separately with its real index and test artifacts.
Runtime portability claims cover only the operating systems actually exercised.
