"""Tiny notes service. Start: python3 app.py [port] (default 8099)."""
import json, sys
from http.server import BaseHTTPRequestHandler, HTTPServer

NOTES = {}

class H(BaseHTTPRequestHandler):
    def _send(self, code, body):
        data = json.dumps(body).encode()
        self.send_response(code); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)

    def do_GET(self):
        if self.path == "/health":
            return self._send(200, {"ok": True})
        if self.path == "/notes":
            return self._send(200, list(NOTES.values()))
        if self.path.startswith("/notes/"):
            n = NOTES.get(self.path.split("/")[2])
            return self._send(200, n) if n else self._send(404, {"error": "not found"})
        self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/notes":
            return self._send(404, {"error": "not found"})
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        text = (body.get("text") or "").strip()
        if not text:
            return self._send(400, {"error": "text required"})
        nid = str(len(NOTES) + 1)
        NOTES[nid] = {"id": nid, "text": text}
        self._send(201, NOTES[nid])

    def log_message(self, *a):
        sys.stderr.write("%s %s\n" % (self.command, self.path))

if __name__ == "__main__":
    HTTPServer(("127.0.0.1", int(sys.argv[1]) if len(sys.argv) > 1 else 8099), H).serve_forever()
