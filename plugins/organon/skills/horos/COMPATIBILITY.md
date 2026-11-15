# Documenting changes

Read when the document describes changes to an existing interface: `--diff`, or
any modified or deleted operation. A document with no change to describe uses
none of this.

## Marking changes

Add a line to the header: `Comparison baseline: branch {branch} compared with
{base}`.

- Open with what the caller must change, most disruptive first: each breaking
  change and the action it requires, then optional new capabilities. The rest of
  the document is the reference behind that list.
- The operation table gains Type (added / modified / deleted / reused) and
  Compatibility columns, so a caller sees which rows force integration work.
  Classify by affected behavior, including shared dependencies; added or reused
  labels do not establish compatibility.
- Add a one-line change summary for added or modified interfaces, such as
  `request +fieldA, fieldB required Y->N; response +fieldC`.
- Field tables of a modified interface gain Change (added / modified / deleted /
  unchanged) and Compatibility columns.
  Compatibility carries a verdict only on changed rows; unchanged rows use `-`.
- For modified fields, write `old->new` in the note, such as `required Y->N`, `Long->String`, or `enum +ENUM_VALUE`.
- Deleted fields stay visible. Read their old type and description from `git show {base}:file`, mark them deleted, and note the former contract.
- A fully added interface can mark the section as added without marking every field.

## Compatibility

Every changed or deleted interface carries exactly one
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

## Checks

- Every changed or deleted interface carries a Compatibility verdict, and every changed field row carries one; no changed row is left blank.
- Judge each change against accepted old inputs and promised outputs; the request/response direction alone is insufficient.
