// Exercises the long-run tool through its real entry point: output capture and
// exit code, one run at a time, release when the holder is killed, a leftover
// lock record that names a live unrelated process, and the opt-out.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import agentTools from "./install-agent-tools.cjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scratch = path.join(ROOT, ".scratch", "contract-long-run", String(process.pid));
fs.rmSync(scratch, { recursive: true, force: true });
fs.mkdirSync(scratch, { recursive: true });
const toolDirOverride = process.env.ORGANON_LONG_RUN_TOOL;
const home = path.join(scratch, "home space-中文");
const installedTools = path.join(home, ".agents", "tools");
const legacyTool = path.resolve(toolDirOverride || path.join(installedTools, "long-run"), "long-run.cjs");
const TOOL = toolDirOverride ? legacyTool : path.join(installedTools, "run-queued", "run-queued.cjs");
if (!toolDirOverride) {
  const { assets } = agentTools.planInstall(home);
  agentTools.applyInstall({ assets: assets.filter(({ name }) => name === "run-queued" || name === "long-run"), configs: [] });
}
const env = { ...process.env, ORGANON_LONG_RUN_LOCK: path.join(scratch, "lock") };

const run = (args, timeout = 60000) => spawnSync(process.execPath, [TOOL, ...args], { encoding: "utf8", cwd: scratch, env, timeout });
const start = (args, nodeOptions = [], entry = TOOL) => {
  const child = spawn(process.execPath, [...nodeOptions, entry, ...args], { cwd: scratch, env });
  let stdout = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  const done = new Promise((resolve) => child.on("close", (code) => resolve({ code, stdout })));
  return { child, done };
};
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

// Complete output replaces the explicit log and preserves the command's exit code.
{
  const log = path.join(scratch, "capture.log");
  fs.writeFileSync(log, "previous output\n");
  const lines = Array.from({ length: 200 }, (_, i) => `line ${i}`).join("\\n");
  const result = run(["--log", log, "--tail", "3", ...script(`console.log("${lines}"); console.error("to stderr"); process.exit(3)`)]);
  assert.equal(result.status, 3, result.stdout + result.stderr);
  const kept = fs.readFileSync(log, "utf8");
  assert.ok(kept.includes("line 0") && kept.includes("line 199") && kept.includes("to stderr"), "the log holds everything");
  assert.doesNotMatch(kept, /previous output/);
  assert.ok(!result.stdout.includes("line 0\n"), "the console shows the tail only");
  assert.match(result.stdout, /long-run: exit=3 elapsed=\d+s waited=\d+s log=/);
}

// Both commands overlap and use the same default filename, already occupied by an older run.
{
  const clock = path.join(scratch, "log-clock.cjs");
  fs.writeFileSync(clock, `
    const RealDate = Date;
    const fixed = new RealDate(2026, 10, 21, 19, 0, 0).getTime();
    global.Date = class extends RealDate {
      constructor(...args) { super(...(args.length ? args : [fixed])); }
    };
  `);
  const writer = path.join(scratch, "log-writer.cjs");
  fs.writeFileSync(writer, `
    const fs = require("node:fs");
    const [id, peer, output] = process.argv.slice(2);
    fs.writeFileSync(id, "");
    const timeout = setTimeout(() => process.exit(1), 10000);
    const wait = setInterval(() => {
      if (!fs.existsSync(peer)) return;
      clearInterval(wait);
      clearTimeout(timeout);
      process.stdout.write(Buffer.from(output, "base64"));
    }, 10);
  `);
  const original = path.join(scratch, ".scratch", "long-run", "20261121-190000-collision.log");
  fs.mkdirSync(path.dirname(original), { recursive: true });
  fs.writeFileSync(original, "older run\n");
  const outputs = [Buffer.from([0x41, 0x00, 0xff, 0x0a]), Buffer.from([0x42, 0x0d, 0x0a])];
  const names = ["log-a-ready", "log-b-ready"];
  const runs = await Promise.all(outputs.map((output, index) => start([
    "--parallel", "--label", "collision", "--", process.execPath, writer,
    names[index], names[1 - index], output.toString("base64"),
  ], ["--require", clock]).done));
  const logs = runs.map(({ code, stdout }) => {
    assert.equal(code, 0, stdout);
    const summary = /^long-run: exit=0 elapsed=\d+s waited=\d+s log=(.+)$/m.exec(stdout);
    assert.ok(summary, stdout);
    return summary[1];
  });
  assert.notEqual(logs[0], logs[1], "overlapping runs must report distinct default log paths");
  assert.equal(fs.readFileSync(original, "utf8"), "older run\n");
  for (let index = 0; index < logs.length; index++) {
    assert.deepEqual(fs.readFileSync(logs[index]), outputs[index]);
  }
}

// Both installed names share one queue, which is free after both runs finish.
{
  const times = path.join(scratch, "times.txt");
  const body = (name) => `const fs=require("fs");fs.appendFileSync(${JSON.stringify(times)},"${name} start "+Date.now()+"\\n");`
    + `setTimeout(()=>fs.appendFileSync(${JSON.stringify(times)},"${name} end "+Date.now()+"\\n"),1500)`;
  const [first, second] = await Promise.all([
    start(script(body("a"))).done,
    start(script(body("b")), [], legacyTool).done,
  ]);
  assert.equal(first.code, 0, first.stdout);
  assert.equal(second.code, 0, second.stdout);
  const events = stamps(times).sort((x, y) => Number(x[2]) - Number(y[2])).map(([name, kind]) => `${name}-${kind}`);
  assert.ok(events.join(",") === "a-start,a-end,b-start,b-end" || events.join(",") === "b-start,b-end,a-start,a-end",
    `runs overlapped: ${events.join(",")}\n${first.stdout}${second.stdout}`);
  assert.match(first.stdout + second.stdout, /long-run: waiting for (?:node(?:\.exe)? \(pid \d+\)|another run is starting)/);
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

// --parallel runs beside a held queue and leaves it held. Replay the bind and
// lookup results of a winner that has created its socket but is not listening yet.
{
  const pidFile = path.join(scratch, "held-command.pid");
  const finished = path.join(scratch, "held-command-finished");
  const holderBody = `const fs = require("node:fs"); fs.writeFileSync(${JSON.stringify(pidFile)}, String(process.pid));`
    + `setTimeout(() => fs.writeFileSync(${JSON.stringify(finished)}, ""), 4000);`;
  const holder = start(script(holderBody));
  await waitFor(pidFile);
  const result = run(["--parallel", ...script("console.log('beside')")]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /waited=0s/);
  const preload = path.join(scratch, "bind-contention.cjs");
  fs.writeFileSync(preload, `
    const net = require("node:net");
    const emit = net.Server.prototype.emit;
    const connect = net.connect;
    let replayed = false;
    let refuseLookup = false;
    net.Server.prototype.emit = function (event, error, ...args) {
      if (!replayed && event === "error" && error?.code === "EADDRINUSE") {
        replayed = true;
        refuseLookup = true;
        error.code = "EEXIST";
        process.stdout.write("contract: replayed EEXIST\\n");
      }
      return emit.call(this, event, error, ...args);
    };
    net.connect = (...args) => {
      if (!refuseLookup) return connect(...args);
      refuseLookup = false;
      const socket = new net.Socket();
      queueMicrotask(() => socket.emit("error", Object.assign(new Error("fixture"), { code: "ECONNREFUSED" })));
      return socket;
    };
  `);
  const queuedBody = `if (!require("node:fs").existsSync(${JSON.stringify(finished)})) process.exit(1);`;
  const queued = await start(script(queuedBody), ["--require", preload]).done;
  assert.match(queued.stdout, /contract: replayed EEXIST/, "the live holder triggered the Darwin error replay");
  assert.doesNotMatch(queued.stdout, /queue unavailable/, "bind contention must keep the queue enabled");
  assert.match(queued.stdout, /long-run: waiting for another run is starting/);
  assert.equal(queued.code, 0, "the queued command must start after the holder finishes");
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
