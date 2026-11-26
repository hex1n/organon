# Notes harness proof

2026-11-26 18:10 Asia/Shanghai, on the local service at `127.0.0.1:8099`. Service source at Git `7f8cdcc` and the [harness in this change](../../../../../docs/verify/HARNESS.md).

**Result** 1 scenario passed, 0 failed, 0 blocked. The [create-and-read scenario](../../../../../docs/verify/features/notes.md) ran against a fresh process. The proof covered the successful create and read sequence with the health check, evidence capture, and cleanup. It left the API rejection paths, an occupied port, and the standalone CLI subcommands outside this run.

## Command and exit status

```sh
env -i PATH=/usr/bin:/bin TZ=Asia/Shanghai TMPDIR=/private/tmp /bin/sh -c '
date "+Run: %Y%m%d-%H%M (%Z)"
python3 --version
python3 docs/verify/verify.py prove
'
```

Exit status `0`. Startup to readiness took 0.122 s and the feature took 0.001 s on that start. The child exit code `-15` is the observed teardown by SIGTERM.

```text
Run: 20261126-1810 (CST)
Python 3.9.6
Evidence directory: /private/tmp/notes-verify-30xx13qw
Started app.py (PID 5024)
Doctor: HTTP 200 application/json {"ok": true} (0.122s)
Create and read a note: PASS (0.001s)
Stopped app.py (PID 5024, exit code -15)
Cleanup: port closed, response and log evidence retained
```

## Evidence after teardown

```sh
evidence_dir=/private/tmp/notes-verify-30xx13qw
cat "$evidence_dir/responses.jsonl" "$evidence_dir/service.log"
lsof -nP -iTCP:8099 -sTCP:LISTEN
```

The evidence read exited `0`. It returned the following HTTP exchanges and service log. The independent `lsof` check produced no output and exited `1`.

```jsonl
{"method": "GET", "path": "/health", "status": 200, "content_type": "application/json", "body": {"ok": true}}
{"method": "GET", "path": "/notes", "status": 200, "content_type": "application/json", "body": []}
{"method": "POST", "path": "/notes", "status": 201, "content_type": "application/json", "body": {"id": "1", "text": "harness proof"}}
{"method": "GET", "path": "/notes/1", "status": 200, "content_type": "application/json", "body": {"id": "1", "text": "harness proof"}}
{"method": "GET", "path": "/notes", "status": 200, "content_type": "application/json", "body": [{"id": "1", "text": "harness proof"}]}
```

```text
GET /health
GET /notes
POST /notes
GET /notes/1
GET /notes
```
