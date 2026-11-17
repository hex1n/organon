// Exercises the long-run tool through its real entry point: output capture and
// exit code, one run at a time, takeover of a lock left by a dead process, and
// the opt-out.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOOL = path.resolve(process.env.ORGANON_LONG_RUN_TOOL || path.join(ROOT, "tools/long-run"), "long-run.cjs");
const scratch = path.join(ROOT, ".scratch", "contract-long-run", String(process.pid));
fs.rmSync(scratch, { recursive: true, force: true });
fs.mkdirSync(scratch, { recursive: true });
const env = { ...process.env, ORGANON_LONG_RUN_LOCK: path.join(scratch, "lock") };

const run = (args) => spawnSync(process.execPath, [TOOL, ...args], { encoding: "utf8", cwd: scratch, env });
const runAsync = (args) => new Promise((resolve) => {
  const child = spawn(process.execPath, [TOOL, ...args], { cwd: scratch, env });
  let stdout = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.on("close", (code) => resolve({ code, stdout }));
});
const script = (body) => ["--", process.execPath, "-e", body];
const stamps = (file) => fs.readFileSync(file, "utf8").trim().split(/\r?\n/).map((line) => line.split(" "));

// Complete output and the command's own exit code.
{
  const log = path.join(scratch, "capture.log");
  const lines = Array.from({ length: 200 }, (_, i) => `line ${i}`).join("\\n");
  const result = run(["--log", log, "--tail", "3", ...script(`console.log("${lines}"); console.error("to stderr"); process.exit(3)`)]);
  assert.equal(result.status, 3, result.stdout + result.stderr);
  const kept = fs.readFileSync(log, "utf8");
  assert.ok(kept.includes("line 0") && kept.includes("line 199") && kept.includes("to stderr"), "the log holds everything");
  assert.ok(!result.stdout.includes("line 0\n"), "the console shows the tail only");
  assert.match(result.stdout, /long-run: exit=3 elapsed=\d+s waited=\d+s log=/);
}

// Two runs started together do not overlap.
{
  const times = path.join(scratch, "times.txt");
  const body = (name) => `const fs=require("fs");fs.appendFileSync(${JSON.stringify(times)},"${name} start "+Date.now()+"\\n");`
    + `setTimeout(()=>fs.appendFileSync(${JSON.stringify(times)},"${name} end "+Date.now()+"\\n"),1500)`;
  const [first, second] = await Promise.all([runAsync(script(body("a"))), runAsync(script(body("b")))]);
  assert.equal(first.code, 0, first.stdout);
  assert.equal(second.code, 0, second.stdout);
  const events = stamps(times).sort((x, y) => Number(x[2]) - Number(y[2])).map(([name, kind]) => `${name}-${kind}`);
  assert.ok(events.join(",") === "a-start,a-end,b-start,b-end" || events.join(",") === "b-start,b-end,a-start,a-end",
    `runs overlapped: ${events.join(",")}`);
  assert.ok(/long-run: waiting for /.test(first.stdout + second.stdout), "the queued run says what it waits for");
  assert.ok(!fs.existsSync(env.ORGANON_LONG_RUN_LOCK), "the lock is released");
}

// A lock whose owner is gone does not block.
{
  const dead = spawnSync(process.execPath, ["-e", "process.exit(0)"]);
  fs.mkdirSync(env.ORGANON_LONG_RUN_LOCK);
  fs.writeFileSync(path.join(env.ORGANON_LONG_RUN_LOCK, "owner.json"), JSON.stringify({ pid: dead.pid, label: "gone" }));
  const result = run(script("console.log('ran')"));
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /waited=[0-3]s/);
}

// --parallel runs beside a held lock.
{
  fs.mkdirSync(env.ORGANON_LONG_RUN_LOCK);
  fs.writeFileSync(path.join(env.ORGANON_LONG_RUN_LOCK, "owner.json"), JSON.stringify({ pid: process.pid, label: "held by the contract" }));
  const result = run(["--parallel", ...script("console.log('beside')")]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.ok(fs.existsSync(env.ORGANON_LONG_RUN_LOCK), "another run's lock is left alone");
  fs.rmSync(env.ORGANON_LONG_RUN_LOCK, { recursive: true, force: true });
}

// A command that cannot start is reported, not hidden.
{
  const result = run(["--", "no-such-command-for-the-contract"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /long-run: exit=\d+ /);
}

fs.rmSync(scratch, { recursive: true, force: true });
console.log(`PASS: long-run contract on ${process.platform}`);
