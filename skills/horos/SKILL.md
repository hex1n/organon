---
name: horos
description: Generates API docs for backend interfaces across protocols (RPC e.g. SOFABoot/Dubbo, and HTTP/REST) and across projects. Use when the user wants to document a single interface, a whole requirement's backend API, or the API changes on a branch.
---

# API Documentation Generation

API documentation is a caller contract: write only what a caller needs to invoke the interface correctly. Do not document implementation details.

Use this protocol-neutral spine with the relevant **adapter** in
`adapters/{RPC|HTTP}.md`. An existing project **profile** at
`docs/api-doc-profile.md` indexes reusable conventions; recheck its facts.

Before writing, build the interface inventory.

## Commands

```bash
/horos [--rpc|--http] Interface
/horos [--rpc|--http] Interface method
/horos --feature <feature-or-branch>
/horos --diff [baseBranch]
/horos --batch I1 I2
```
Detect an unspecified protocol from the active interface path.

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
required-field rule, module layout, ID convention and output directory.
Keep unresolved values `unknown`.

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
where contract authority leaves them open, and the expansion defaults below.

### 3. Parse Each Interface From Code
- Interface declaration: extract address or route and operation identifier from verified project conventions.
- Implementation and validation: trace auth, required fields and other caller
  guarantees through the active call path. Each guarantee needs the boundaries
  that establish and preserve it; a declaration or helper alone establishes
  only its local behavior.
- Request and response models: resolve generics, wire names, ignored fields, null handling, defaults, and active validation paths. Expand nested objects and list elements; for recursion, link back to the already-defined type instead of expanding indefinitely.
- Completion criterion: each documented fact has a source; unresolved type, requiredness, or behavior is explicitly unknown with a next check. Distinguish declared intent from enforced behavior when they disagree.

### 4. Write Markdown
- If the profile specifies an output directory, use it. Otherwise, use a filesystem glob to find the majority location of existing `*_API_Doc.md` files. Use `docs/facade/` as the final fallback. Do not use `git ls-files` for discovery because it misses untracked docs.
- Read `TEMPLATE.md` and fill it using verified project conventions.
- File names: `{Interface}_API_Doc.md`, `{feature}_API_Doc.md`, or `API_Changes_{date}.md`.
- Output language: write the generated API document in the language explicitly requested by the user; if none is explicit, match the user's prompt language. Use a project documentation convention only when the user is silent. Keep code identifiers, field names, operation keys, and literal enum values unchanged.

### 5. Self-Check
- Every Markdown anchor target exists.
- Table of contents and interface sections match.
- Every changed or deleted interface carries a Compatibility verdict, and every changed field row carries one; no changed row is left blank.
- Include caller-visible preconditions, conditional requirements, ordering, idempotency, and errors when supported. Exclude private implementation mechanisms. Check examples against documented fields, wire types, and constraints; label synthetic examples as illustrative.
- Known defects are not written as the target contract. Mention at most a short note pointing to the issue or test.

## Contract Rules

**Target contract**: state the intended external contract.
Name its two sources in the header:

- **Contract authority**: the approved contract, design, or published schema
  that defines what the interface owes. If none applies, use the code revision
  designated as the contract, or `unknown`.
- **Implementation evidence**: the source revision or snapshot actually inspected.

The authority decides the promises, including any structure, wire name, or type
it states. Implementation evidence supplies what the authority leaves open.
If code contradicts the authority, document the authority's version and treat
the difference as a known defect. If authority is `unknown`, document the
implementation evidence as the contract. In that case, no difference is called
a defect.

**Field expansion**: use `field.sub`, `field[].sub`, and `data.field` paths.
Expand acyclic fields in place. Use explicit type links for cycles and
polymorphic alternatives. Distinguish missing, null, empty, and conditionally
required values. Failure to discover a constraint does not prove optionality.

**Field-level changes**:
- Add a one-line change summary for added or modified interfaces.
- Add a Change column when documenting a modified interface.
- For modified fields, write `old->new` in the note, such as `required Y->N`, `Long->String`, or `enum +ENUM_VALUE`.
- Deleted fields stay visible. Read their old type and description from `git show {base}:file`, mark them deleted, and note the former contract.
- A fully added interface can mark the section as added without marking every field.

**Compatibility**: every changed or deleted interface carries exactly one
verdict — `compatible`, `breaking`, or `not-assessed` — against the supported
old contract. Establish that contract from its published schema, declarations,
documented guarantees, or other authoritative evidence. A counterexample that
was valid under the old contract and fails under the new one establishes
`breaking`, even when the actual caller inventory is unavailable. Record known
consumer impact and missing consumer inventory separately; unknown impact
does not erase a proven contract violation.

Assess compatibility for the supported old caller talking to the new server;
include the reverse direction when rollout or mixed versions require it.
Compare accepted inputs, promised outputs, and observable effects, using the
actual wire format. Include source/library compatibility when callers use
published signatures or generated clients. Known consumer checks can demonstrate
additional breaks; absence of observed usage does not retire a published
guarantee. These are investigation prompts, not automatic verdicts:

| Change | What must be established |
| --- | --- |
| Request field added | Old requests remain valid; any required value has a compatible default or negotiated version |
| Request field removed | Old payloads are still accepted and dropping the value preserves promised semantics |
| Response field added | Supported consumers tolerate unknown fields and the payload still satisfies the schema |
| Response field removed or made nullable | Published presence/nullability guarantees remain satisfied; if a guarantee is removed, report breaking |
| Type, enum, or validation changed | Old valid inputs remain accepted and new outputs remain within consumers' supported domain |
| Route or operation replaced | The old entry remains supported, or report breaking and name its replacement |

Assign each compatibility verdict in this order:

1. If an old-contract violation is proven, use `breaking`.
2. If all affected contract obligations are established as preserved, use `compatible`.
3. Otherwise, use `not-assessed`. Name the undecidable obligation and missing evidence.

For an interface with multiple changes, any `breaking` change makes the interface
`breaking`. If none is breaking but any remains unknown, use `not-assessed`.
Describe the breaking interaction and migration, not just the changed declaration.

Discover **protocol-specific facts** with the adapter from the active project
path; use a profile as an index when present. Keep project-specific auth,
envelopes, positions and types out of this portable spine.

## Large inventories

Divide work only when scope warrants it and delegation is authorized. Keep
contract authority, implementation snapshot, project conventions and output
ownership consistent across parts.
