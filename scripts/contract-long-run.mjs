// Exercises the long-run tool through its real entry point: output capture and
// exit code, one run at a time, release when the holder is killed, a leftover
// lock record that names a live unrelated process, and the opt-out.
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

const run = (args, timeout = 60000) => spawnSync(process.execPath, [TOOL, ...args], { encoding: "utf8", cwd: scratch, env, timeout });
const start = (args) => {
  const child = spawn(process.execPath, [TOOL, ...args], { cwd: scratch, env });
  let stdout = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  const done = new Promise((resolve) => child.on("close", (code) => resolve({ code, stdout })));
  return { child, done };
};
const runAsync = (args) => start(args).done;
const script = (body) => ["--", process.execPath, "-e", body];
const stamps = (file) => fs.readFileSync(file, "utf8").trim().split(/\r?\n/).map((line) => line.split(" "));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const waitFor = async (file) => {
  for (let i = 0; i < 100 && !fs.existsSync(file); i += 1) await sleep(100);
  assert.ok(fs.existsSync(file), `${path.basename(file)} never appeared`);
};
// A command that records its process ID and stays busy until killed or the timer ends.
const holding = (pidFile, ms) => script(`require("fs").writeFileSync(${JSON.stringify(pidFile)},String(process.pid));setTimeout(()=>{},${ms})`);
const killQuietly = (pid) => { try { process.kill(pid, "SIGKILL"); } catch { /* already gone */ } };

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

// Two runs started together do not overlap, and the queue is free afterwards.
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
  assert.match(first.stdout + second.stdout, /long-run: waiting for node(\.exe)? \(pid \d+\)/, "the queued run names the run it waits for");
  const after = run(script("console.log('after')"));
  assert.match(after.stdout, /waited=0s/, "the queue is released when both runs end");
}

// A holder killed without a chance to clean up releases the queue at once.
{
  const pidFile = path.join(scratch, "killed-command.pid");
  const holder = start(holding(pidFile, 30000));
  await waitFor(pidFile);
  holder.child.kill("SIGKILL");
  await holder.done;
  const result = run(script("console.log('ran')"));
  killQuietly(Number(fs.readFileSync(pidFile, "utf8")));
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /waited=0s/, result.stdout);
}

// A lock record left by an earlier version, naming a live process that is not a
// run (a reused process ID), does not block.
{
  fs.mkdirSync(env.ORGANON_LONG_RUN_LOCK);
  fs.writeFileSync(path.join(env.ORGANON_LONG_RUN_LOCK, "owner.json"), JSON.stringify({ pid: process.pid, label: "reused pid" }));
  const result = run(script("console.log('ran')"), 15000);
  fs.rmSync(env.ORGANON_LONG_RUN_LOCK, { recursive: true, force: true });
  assert.equal(result.status, 0, `blocked by a stale record: ${result.stdout}${result.stderr}`);
  assert.match(result.stdout, /waited=0s/);
}

// --parallel runs beside a held queue and leaves it held.
{
  const pidFile = path.join(scratch, "held-command.pid");
  const holder = start(holding(pidFile, 4000));
  await waitFor(pidFile);
  const result = run(["--parallel", ...script("console.log('beside')")]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /waited=0s/);
  const queued = await runAsync(script("console.log('queued')"));
  assert.match(queued.stdout, /long-run: waiting for node/, "the holder still held the queue");
  assert.equal((await holder.done).code, 0);
}

// A command that cannot start is reported, not hidden.
{
  const result = run(["--", "no-such-command-for-the-contract"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /long-run: exit=\d+ /);
}

fs.rmSync(scratch, { recursive: true, force: true });
console.log(`PASS: long-run contract on ${process.platform}`);
