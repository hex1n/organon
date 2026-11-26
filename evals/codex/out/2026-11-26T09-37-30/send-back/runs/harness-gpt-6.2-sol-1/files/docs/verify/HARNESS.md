# Notes verification harness

| Target | Entry and access | Real components and scope | Cost |
| --- | --- | --- | --- |
| Local service | HTTP JSON at `http://127.0.0.1:8099`. **Verified 2026-11-26** in the [proof run][proof]. The handlers accept unauthenticated HTTP requests. All requests use one process-wide store. **Derived from source** in [app.py](../../app.py#L5) and its [request handlers](../../app.py#L13). | The proof ran the actual `app.py` with an in-memory store and isolated its data in a fresh local process. **Verified 2026-11-26** in the [proof run][proof]. | 0.122 s to readiness and 0.001 s for the scenario on that start. **Verified 2026-11-26** in the [proof run][proof]. |

## Launch

From the repository root, run the complete proof in a fresh shell.

```sh
python3 docs/verify/verify.py prove
```

The command runs `app.py` with the same interpreter, waits for `GET /health` to return HTTP `200` with `{"ok": true}` from the process it started, and checks that the new note list is `[]`. The proof used Python 3.9.6 and a free port `8099`. Expect `Started app.py` followed by the Doctor result when the service is ready. **Verified 2026-11-26** in the [proof run][proof].

The app uses the Python standard library and process memory for storage. **Derived from source** in [app.py](../../app.py#L2).

The proof checks the port before launch and exits with an error if it is occupied. **Derived from source** in [verify.py](verify.py#L67).

## Doctor

On a running target, send only `GET /health`. Expect HTTP `200`, media type `application/json`, and `{"ok": true}`. The proof checks this and ties the response to a `GET /health` line in the log of the process it launched. **Verified 2026-11-26** in the [proof run][proof].

For a standalone read-only check, run the following command. It prints the exchange and exits `0` when the health response matches. **Derived from source** in [verify.py](verify.py#L149).

```sh
python3 docs/verify/verify.py doctor
```

The health response has no build, version, profile, or dependency fields. **Derived from source** in [app.py](../../app.py#L13).

## Drive

Use `verify.request(method, path, payload=None)` with `docs/verify` on the Python import path. For the [create-and-read journey](features/notes.md), `POST /notes` with `{"text": "  harness proof  "}` returns HTTP `201` with an ID and the trimmed text `harness proof`. **Verified 2026-11-26** in the [proof run][proof].

The command-line form accepts the method, route, and an optional JSON payload, and prints the HTTP status, media type, and body. Run the write example against a local process you started for verification. **Derived from source** in [verify.py](verify.py#L138).

```sh
python3 docs/verify/verify.py request POST /notes --json '{"text":"  harness proof  "}'
```

## Evidence

Use `verify.read_notes()` for the list and `verify.read_notes(note_id)` for an individual note. Each returns an HTTP exchange with the observed status and body. The proof reads both views after creation and verifies that they match the returned ID and trimmed text. **Verified 2026-11-26** in the [proof run][proof].

The same state reads are available at the command line. Pass the ID returned by the POST for the single-note read. **Derived from source** in [verify.py](verify.py#L142).

```sh
python3 docs/verify/verify.py state
python3 docs/verify/verify.py state "$note_id"
```

Set `evidence_dir` to the path printed as `Evidence directory` by `prove`. `responses.jsonl` contains each observed HTTP exchange and `service.log` contains the service's request lines. **Verified 2026-11-26** in the [proof run][proof].

```sh
cat "$evidence_dir/responses.jsonl" "$evidence_dir/service.log"
```

## Cleanup

The `prove` command stops and waits for the `app.py` process it started. It prints `Cleanup: port closed, response and log evidence retained` after checking that the port refuses new connections and both evidence files still exist with content. **Verified 2026-11-26** in the [proof run][proof].

[proof]: ../../.scratch/notes/e2e/runs/20261126-1810/notes-harness-proof.md
