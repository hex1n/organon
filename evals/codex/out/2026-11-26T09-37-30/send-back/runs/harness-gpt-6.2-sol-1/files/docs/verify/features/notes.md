# Create and read a note

## Reach

Run `python3 docs/verify/verify.py prove` from the repository root. It owns a fresh local instance at `127.0.0.1:8099`. `GET /health` returns `200` and `GET /notes` returns `200` with `[]` before any writes. **Verified 2026-11-26** in the [proof run][proof].

## Drive

1. Send `POST /notes` with `{"text":"  harness proof  "}` using the [HTTP recipe](../HARNESS.md#drive). Expect `201` and capture the returned string `id`. **Verified 2026-11-26** in the [proof run][proof].
2. Send `GET /notes/{id}` with that ID. Expect `200`. **Verified 2026-11-26** in the [proof run][proof].
3. Send `GET /notes`. Expect `200`. **Verified 2026-11-26** in the [proof run][proof].

## End state

The individual read equals `{"id":"<returned id>","text":"harness proof"}`. The list contains exactly that note. The two independent reads confirm the saved text and ID. **Verified 2026-11-26** in the [proof run][proof].

## Gotchas

- Keep the POST and both reads on the same process. Notes live in process memory, and surrounding whitespace is stripped during creation. **Derived from source** in [app.py](../../../app.py#L5) and its [POST handler](../../../app.py#L23).
- Use the returned ID in the individual read. The proof observed `"1"` on an empty store. **Verified 2026-11-26** in the [proof run][proof].

[proof]: ../../../.scratch/notes/e2e/runs/20261126-1810/notes-harness-proof.md
