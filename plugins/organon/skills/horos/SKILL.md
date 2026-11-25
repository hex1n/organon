---
name: horos
description: Generates API docs for backend interfaces across protocols (RPC e.g. SOFABoot/Dubbo, and HTTP/REST) and across projects. Use when the user wants to document a single interface, a whole requirement's backend API, or the API changes on a branch.
---

# Horos — API Documentation

API documentation is a caller contract with one reader: the developer, or their
agent, who will call these interfaces from this document alone. Every line is
something that reader acts on. Implementation details stay out.

Use this protocol-neutral spine with the relevant **adapter** in
`adapters/{RPC|HTTP}.md`.

## Commands

```bash
/organon:horos [--rpc|--http] Interface
/organon:horos [--rpc|--http] Interface method
/organon:horos --feature <feature-or-branch>
/organon:horos --diff [baseBranch]
/organon:horos --batch I1 I2
```
These are Claude Code forms; Codex takes the same arguments after
`$organon:horos`. A standalone install drops the `organon:` prefix.
Detect an unspecified protocol from how the interface is declared: routes or an
HTTP schema mean HTTP; an exported service interface or IDL means RPC.

## Workflow

### 1. Establish scope and project conventions

Resolve the requested interfaces, feature or comparison snapshot. Read applicable
requirements and design notes for scope, business terms and caller constraints.

Use `docs/api-doc-profile.md`, or root `.api-doc-profile.md`, as a discovery
index. Recheck conventions relevant to this task against current sources.
For missing or contradictory facts, detect the protocol and read
[RPC](adapters/RPC.md) or [HTTP](adapters/HTTP.md).
Update stale facts in an existing profile; create `docs/api-doc-profile.md`
when reusable project conventions warrant it. Its fields are protocol, base
endpoint, operation identifier, RPC request envelope, response wrapper, auth,
required-field rule, module layout, ID convention, output directory and model
document. Keep unresolved values `unknown`.

A project may have a **model document**: an API document its callers already
accepted, named by the user or recorded in the profile. When one exists, match
its section order, naming, file-name style and level of detail, so a caller who
knows one document can read the next.

### 2. Build the interface inventory

Cover the requested interface or method. For a feature or diff, include changed
and deleted operations, reused operations the feature needs, and operations
affected through shared DTOs, validators, serializers, wrappers, auth, schemas
or dispatch rules. Include design-named operations and constants that constrain
their caller contract. Classify items as added, modified, deleted or reused;
record unresolved consumers as coverage gaps. A diff alone cannot find reused
interfaces.

Ask once, with the inventory, only for unresolved user-owned scope, contract or
compatibility decisions needed to proceed. Read factual values from their
sources; mark missing evidence and its impact. Use code-declared wire types
where contract authority leaves them open.

### 3. Parse Each Interface From Code
- Interface declaration: extract address or route and operation identifier from verified project conventions.
- Implementation and validation: trace auth, required fields and other caller
  guarantees through the active call path. Each guarantee needs the boundaries
  that establish and preserve it; a declaration or helper alone establishes
  only its local behavior.
- Request and response models: resolve generics, wire names, ignored fields, null handling, defaults, and active validation paths. Follow nested objects and list elements to their leaves.
- Completion criterion: you can name the source of each fact; what the sources cannot settle is an unconfirmed item with its next check. Distinguish declared intent from enforced behavior when they disagree.

### 4. Write Markdown
- If the profile specifies an output directory, use it. Otherwise, use a filesystem glob to find where the project's existing API documents live and write beside them. Use `docs/api/` as the final fallback. Do not use `git ls-files` for discovery because it misses untracked docs.
- Fill the model document's shape, or `TEMPLATE.md` without one, by [Write for the caller](#write-for-the-caller).
- File names follow the model document's style; without one, `{Interface}_API_Doc.md`, `{feature}_API_Doc.md`, or `API_Changes_{date}.md`.
- Output language: write the generated API document in the language explicitly requested by the user; if none is explicit, match the user's prompt language. Use a project documentation convention only when the user is silent. Keep code identifiers, field names, operation keys, and literal enum values unchanged.

### 5. Self-Check
- Every Markdown anchor target exists.
- The inventory, the operation table and the interface sections name the same operations; the scope line states their count.
- Every line passes [Write for the caller](#write-for-the-caller).
- Include caller-visible preconditions, conditional requirements, ordering, idempotency, and errors when supported. Check examples against documented fields, wire types, and constraints.
- Known defects are not written as the target contract. Mention at most a short note pointing to the issue or test.

### 6. Deliver

Reply with the document path and what stays off the page: the contract
authority and source revision inspected, each unconfirmed item with its next
check, coverage gaps, and work the document implies for other roles.

## Write for the caller

The caller reads the document to write calling code, often with nothing else
open. These rules decide what goes on the page.

- **The page carries the contract; the reply carries how you know it.** On the
  page a fact is stated plainly, or marked `unconfirmed` where the caller must
  not rely on it yet.
- **Only the caller's work.** Server configuration, data setup and constraints
  on other teams' code are other roles' work.
- **Say each thing once.** The conventions section holds what every call shares:
  endpoint, envelope, auth, pagination, failure handling, and the one note that
  examples are illustrative. A type that more than one interface uses is defined
  once in the types section and referenced by name. An interface section holds
  only what is specific to it.
- **Decide requiredness.** Each request field is `required`, `optional`, or
  `conditional` with its condition. One the sources cannot settle is
  `unconfirmed`, with what the caller should send meanwhile. Distinguish missing,
  null and empty where the server treats them differently. Failure to find a
  constraint does not prove a field optional.
- **Size the entry to the interface.** A request with a few fields is a short
  list; a response with no payload is one line; tables are for many fields. Use
  `field.sub`, `field[].sub` and `data.field` paths for nesting.
- **One document per handoff.** A document the user will send on its own is
  complete on its own: conventions, types, enums and every interface in its
  scope. Divide by the caller's unit of work, such as a module or a client
  feature, when the user names one.
- **Replacing an older interface.** When callers move from old interfaces to new
  ones, add the old-to-new mapping and one section listing what differs for the
  caller. Everything else is stated once as the current contract.

## Contract Rules

**Target contract**: state the intended external contract. It has two sources,
which you report in the reply:

- **Contract authority**: the approved contract, design, or published schema
  that defines what the interface owes. If none applies, use the code revision
  designated as the contract, or `unknown`.
- **Implementation evidence**: the source revision or snapshot actually inspected.

The authority decides the promises, including any structure, wire name, or type
it states. Implementation evidence supplies what the authority leaves open.
If code contradicts the authority, document the authority's version and treat
the difference as a known defect. If authority is `unknown`, document the
implementation evidence as the contract. In that case, no difference is called
a defect. What the sources cannot settle, including whether the code produces
the response it intends, is `unconfirmed`.

When existing callers keep calling an interface that changed (`--diff`, a
modified or deleted operation), read [COMPATIBILITY.md](COMPATIBILITY.md) for
field-level change marking and compatibility verdicts. Callers moving to new
interfaces get the replacement mapping above instead.

## Large inventories

Divide work only when scope warrants it and delegation is authorized. Keep
contract authority, implementation snapshot, project conventions and output
ownership consistent across parts.
