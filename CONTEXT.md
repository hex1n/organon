# Domain Language

Canonical terms for this repository's asset family: **skill distribution**.
Entries are definitions with pointers; skill-authoring rule bodies live in
[AGENTS.md](AGENTS.md) and each skill's own definitions live in its
`SKILL.md`/`REFERENCE.md`. Neither is restated here.

## Skill Distribution

This context defines the language for distributing portable agent skills from
this repository into local agent runtimes such as Codex and Claude Code.

### Language

**Source Skill**:
A skill directory under the repository `plugins/organon/skills/` tree that acts as the source of truth for a managed skill.
_Avoid_: remote copy, upstream folder

**Managed Installed Skill**:
A local installed skill that is controlled by a source skill and should not be edited directly.
_Avoid_: local source, user fork

**Installed Skill Cache**:
The local copy of a managed installed skill that one or more agent runtimes load.
_Avoid_: editable installation, local master

**Agent Runtime**:
A tool that discovers and loads installed skills, such as Codex or Claude Code.
_Avoid_: Codex-only consumer

**Local Override Skill**:
A separate user-owned skill used for personal customisation instead of editing a managed installed skill in place.
_Avoid_: patching the installed cache

**Cache Drift**:
A mismatch between an installed skill cache and its current source skill. It indicates a cache that needs synchronization, not whether the source or the cache changed.
_Avoid_: local update, manual fix

### Relationships

- A **Source Skill** produces zero or more **Managed Installed Skills**.
- A **Managed Installed Skill** lives in an **Installed Skill Cache**.
- An **Installed Skill Cache** may be shared by multiple **Agent Runtimes**.
- A **Local Override Skill** is separate from a **Managed Installed Skill**.
- Refreshing an **Installed Skill Cache** restores its **Source Skill** content.
- Changes inside a managed cache are replaceable; personal customisations belong in a separate **Local Override Skill**.

### Example dialogue

> **Dev:** "Can I change the installed `historia` skill directly?"
> **Domain expert:** "No. That is a **Managed Installed Skill** in the shared **Installed Skill Cache** used by **Agent Runtimes** such as Codex and Claude Code; make a **Local Override Skill** if you need personal behaviour."
> **Dev:** "What if the remote source has a newer version?"
> **Domain expert:** "Refresh the managed cache from its Source Skill. Keep personal customisations in a separate Local Override Skill."

### Flagged ambiguities

- "local skill" can mean either a **Managed Installed Skill** or a **Local Override Skill**. Resolved: repository-managed installs are **Managed Installed Skills** and are treated as read-only cache entries.
- "update" means restoring a managed cache from its authoritative source, including replacing cache-local edits. Personal customisations remain separate override skills.
- "agent runtime" must not mean Codex only. Resolved: Codex and Claude Code are both **Agent Runtimes** that may share the same **Installed Skill Cache**.
