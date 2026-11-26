"""Drive the local notes API and prove the create-and-read journey."""

import argparse
from http.client import HTTPConnection, HTTPException
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
from time import monotonic, sleep


ROOT = Path(__file__).resolve().parents[2]
HOST, PORT = "127.0.0.1", 8099
HEALTH = {"ok": True}


def request(method, path, payload=None):
    connection = HTTPConnection(HOST, PORT, timeout=1)
    body = json.dumps(payload) if payload is not None else None
    headers = {"Content-Type": "application/json"} if body is not None else {}
    try:
        connection.request(method, path, body, headers)
        response = connection.getresponse()
        content_type = response.headers.get_content_type()
        raw = response.read().decode("utf-8", errors="replace")
        if content_type == "application/json":
            try:
                raw = json.loads(raw)
            except json.JSONDecodeError:
                pass  # Preserve a malformed response for diagnosis.
        return {
            "method": method,
            "path": path,
            "status": response.status,
            "content_type": content_type,
            "body": raw,
        }
    finally:
        connection.close()


def read_notes(note_id=None):
    path = "/notes" if note_id is None else f"/notes/{note_id}"
    return request("GET", path)


def expect(exchange, status, expected_body):
    actual = (exchange["status"], exchange["content_type"], exchange["body"])
    expected = (status, "application/json", expected_body)
    if json.dumps(actual, sort_keys=True) != json.dumps(expected, sort_keys=True):
        raise RuntimeError(
            f"{exchange['method']} {exchange['path']}: expected {expected!r}, got {actual!r}"
        )


def port_is_open():
    try:
        with socket.create_connection((HOST, PORT), timeout=1):
            return True
    except ConnectionRefusedError:
        return False


def prove():
    if port_is_open():
        raise RuntimeError(f"{HOST}:{PORT} is already in use. The proof needs a fresh server.")

    evidence = Path(tempfile.mkdtemp(prefix="notes-verify-"))
    service_log = evidence / "service.log"
    responses = evidence / "responses.jsonl"
    print(f"Evidence directory: {evidence}", flush=True)

    with service_log.open("w") as log, responses.open("w", buffering=1) as output:
        def record(exchange):
            print(json.dumps(exchange), file=output)
            return exchange

        started = monotonic()
        server = subprocess.Popen(
            [sys.executable, "app.py"], cwd=ROOT, stdout=log, stderr=subprocess.STDOUT,
            env={**os.environ, "PYTHONUNBUFFERED": "1"},
        )
        print(f"Started app.py (PID {server.pid})", flush=True)
        try:
            deadline = started + 5
            while monotonic() < deadline and server.poll() is None:
                try:
                    health = request("GET", "/health")
                except ConnectionRefusedError:
                    sleep(0.05)
                    continue
                # The owned process logs each response before it sends its headers.
                if "GET /health" in service_log.read_text().splitlines():
                    expect(record(health), 200, HEALTH)
                    break
                sleep(0.05)
            else:
                raise RuntimeError(f"Owned server did not become ready (exit code: {server.poll()})")

            ready = monotonic()
            print(f"Doctor: HTTP 200 application/json {json.dumps(HEALTH)} ({ready - started:.3f}s)")
            expect(record(read_notes()), 200, [])
            created = record(request("POST", "/notes", {"text": "  harness proof  "}))
            body = created["body"]
            note_id = body.get("id") if isinstance(body, dict) else None
            if not isinstance(note_id, str) or not note_id:
                raise RuntimeError(f"POST /notes: expected a non-empty string id, got {created!r}")
            note = {"id": note_id, "text": "harness proof"}
            expect(created, 201, note)
            expect(record(read_notes(note_id)), 200, note)
            expect(record(read_notes()), 200, [note])
            print(f"Create and read a note: PASS ({monotonic() - ready:.3f}s)")
        finally:
            if server.poll() is None:
                server.terminate()
            try:
                server.wait(timeout=3)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait()
            print(f"Stopped app.py (PID {server.pid}, exit code {server.returncode})", flush=True)

    if port_is_open():
        raise RuntimeError(f"{HOST}:{PORT} still accepts connections after cleanup")
    if not all(path.is_file() and path.stat().st_size for path in (responses, service_log)):
        raise RuntimeError(f"Expected response and log evidence in {evidence}")
    print("Cleanup: port closed, response and log evidence retained")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("prove", help="start, verify, and stop a fresh local instance")
    commands.add_parser("doctor", help="check the running instance without writing")
    call = commands.add_parser("request", help="send one request to the running instance")
    call.add_argument("method", choices=("GET", "POST"))
    call.add_argument("path")
    call.add_argument("--json", type=json.loads, dest="payload")
    state = commands.add_parser("state", help="read the note list or one note")
    state.add_argument("note_id", nargs="?")
    args = parser.parse_args()

    try:
        if args.command == "prove":
            prove()
        elif args.command == "doctor":
            health = request("GET", "/health")
            print(json.dumps(health))
            expect(health, 200, HEALTH)
        elif args.command == "request":
            print(json.dumps(request(args.method, args.path, args.payload)))
        else:
            print(json.dumps(read_notes(args.note_id)))
    except (HTTPException, OSError, RuntimeError) as error:
        parser.exit(1, f"Verification failed: {error}\n")


if __name__ == "__main__":
    main()
