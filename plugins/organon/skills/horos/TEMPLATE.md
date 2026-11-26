# {Interface or Feature} API Documentation

> Scope: {interfaces or business chain covered; N operations}.
> Protocol: `{rpc|http}`. Updated: {date}.

Remove the sections the scope does not need.

---

## Conventions

Everything every call shares, written once from verified project conventions:

+ RPC: dispatch or gateway endpoint, request envelope, and response envelope.
+ HTTP: base URL, context path, response wrapper, and credential position.
+ Auth, pagination, failure handling, ID and time formats.
+ Examples in this document are illustrative; real IDs and values come from the caller's data.

---

## Operations

| # | Interface | Operation identifier or route | Summary |
| --- | --- | --- | --- |
| 1 | [{name}](#{name}) | `{operation identifier}` / `{METHOD} {path}` | {summary} |

When these interfaces replace older ones, add the old route beside each row.

---

<a name="{name}"></a>
## 1. {name} - {display name}

+ **API**: RPC -> `{operation identifier or service.method}` / HTTP -> `{METHOD} {full path}`
+ **Auth**: only when it differs from Conventions.
+ Caller-visible preconditions, ordering or idempotency, when the interface has them.

**Request** ({RequestClass})

A few fields fit a list: `{field}` ({type}, required) — {meaning}. Use a table
for more:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| {field} | {type} | required / optional / conditional / unconfirmed | {meaning; value, length or format; the condition for conditional; what to send while unconfirmed} |
| {obj}.{sub} | {Type} | optional | {state when requiredness applies only if the parent is present} |
| {list}[] | [{TypeName}](#{typename}) | optional | {a shared type is referenced, not expanded} |

For HTTP add a Position column (path / query / header / body).

```json
{ "field": "value" }
```

**Response** `data` ({ResponseClass})

No payload: one line, such as "`data` is null on success". A shared type: name
it and link to Types. Otherwise:

| Field | Type | Description |
| --- | --- | --- |
| data.field | {Type} | {meaning; presence and nullability when the caller must handle them} |

Add a response example when the shape is not obvious from the table.

**Errors**: only those specific to this interface; shared handling is in Conventions.

| Error code / HTTP status | Message | Meaning |
| --- | --- | --- |
| {code} | {message} | {condition} |

---

Repeat the interface section until the inventory is complete.

## Types

One section per type that more than one interface uses.

<a name="{typename}"></a>
### {TypeName}

| Field | Type | Description |
| --- | --- | --- |
| {field} | {type} | {meaning} |

## Enums

If enum values come from a lookup interface, point to that interface instead of hard-coding the values here.

## Differences From The Old Interface, If Replacing One

| # | Difference | Old | New |
| --- | --- | --- | --- |
| 1 | {what the caller must change} | {old} | {new} |

## Integration Notes, If Needed

Cross-interface rules the caller follows: call order, fallback behavior,
parameter priority.

Add an interaction diagram only when it clarifies the caller's contract; read
[DERIVED-VIEWS.md](DERIVED-VIEWS.md) before drawing one.
