#!/usr/bin/env node
// Runs one long command at a time on this machine, keeps its complete output
// in a file, and reports how long it waited and ran. Node.js built-ins only.
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const USAGE = "usage: long-run.cjs [--log <file>] [--label <text>] [--tail <lines>] [--parallel] -- <command> [args...]";
const POLL_MS = 2000;
const NOTICE_MS = 60000;
// A lock directory without an owner record this old was left by a crashed start.
const HALF_WRITTEN_MS = 10000;

function lockPath() {
  return process.env.ORGANON_LONG_RUN_LOCK || path.join(os.tmpdir(), "organon-long-run.lock");
}

function parseArgs(argv) {
  const options = { log: null, label: null, tail: 40, parallel: false, command: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--") { options.command = argv.slice(i + 1); break; }
    if (arg === "--parallel") options.parallel = true;
    else if (arg === "--log" || arg === "--label" || arg === "--tail") {
      const value = argv[i += 1];
      if (value === undefined) throw new Error(`${arg} needs a value`);
      if (arg === "--tail") options.tail = Number(value);
      else options[arg.slice(2)] = value;
    } else throw new Error(`unknown option ${arg}`);
  }
  if (!options.command.length) throw new Error("no command after --");
  if (!Number.isInteger(options.tail) || options.tail < 0) throw new Error("--tail needs a whole number");
  return options;
}

function alive(pid) {
  try { process.kill(pid, 0); return true; } catch (error) { return error.code === "EPERM"; }
}

/** Takes the machine-wide lock, or returns the run that holds it. */
function tryAcquire(owner, lock = lockPath()) {
  for (;;) {
    try {
      fs.mkdirSync(lock);
      fs.writeFileSync(path.join(lock, "owner.json"), JSON.stringify(owner));
      return null;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
    let held = null;
    try { held = JSON.parse(fs.readFileSync(path.join(lock, "owner.json"), "utf8")); } catch { /* being written, or left behind */ }
    if (held && alive(held.pid)) return held;
    if (!held) {
      let age = Infinity;
      try { age = Date.now() - fs.statSync(lock).mtimeMs; } catch { continue; }
      if (age < HALF_WRITTEN_MS) return { pid: 0, label: "a run that is starting" };
    }
    // Only one waiter wins the rename, so a fresh lock is never removed by a second one.
    const stale = `${lock}.stale-${process.pid}`;
    try { fs.renameSync(lock, stale); fs.rmSync(stale, { recursive: true, force: true }); } catch { /* another waiter took it over */ }
  }
}

function release(lock = lockPath()) {
  try {
    const held = JSON.parse(fs.readFileSync(path.join(lock, "owner.json"), "utf8"));
    if (held.pid === process.pid) fs.rmSync(lock, { recursive: true, force: true });
  } catch { /* not ours, or already gone */ }
}

function quoteForCmd(arg) {
  return /[\s"&|<>^()%!]/.test(arg) || arg === "" ? `"${arg.replace(/"/g, '\\"')}"` : arg;
}

function start(command) {
  const options = { stdio: ["inherit", "pipe", "pipe"], windowsHide: true };
  // Windows needs the shell to resolve .cmd and .bat launchers.
  if (process.platform === "win32") return spawn(command.map(quoteForCmd).join(" "), { ...options, shell: true });
  return spawn(command[0], command.slice(1), options);
}

function defaultLog(label) {
  const now = new Date();
  const two = (value) => String(value).padStart(2, "0");
  const stamp = `${now.getFullYear()}${two(now.getMonth() + 1)}${two(now.getDate())}-${two(now.getHours())}${two(now.getMinutes())}${two(now.getSeconds())}`;
  const name = (label || "run").replace(/[^\w.-]+/g, "-").slice(0, 40);
  return path.join(process.cwd(), ".scratch", "long-run", `${stamp}-${name}.log`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main(argv) {
  let options;
  try { options = parseArgs(argv); } catch (error) {
    process.stderr.write(`long-run: ${error.message}\n${USAGE}\n`);
    return 64;
  }
  const label = options.label || path.basename(options.command[0]);
  const log = path.resolve(options.log || defaultLog(label));
  fs.mkdirSync(path.dirname(log), { recursive: true });

  const queued = Date.now();
  if (!options.parallel) {
    const owner = { pid: process.pid, label, cwd: process.cwd(), since: new Date().toISOString() };
    let noticed = 0;
    for (let held = tryAcquire(owner); held; held = tryAcquire(owner)) {
      if (Date.now() - noticed >= NOTICE_MS) {
        process.stdout.write(`long-run: waiting for ${held.label}${held.pid ? ` (pid ${held.pid})` : ""}\n`);
        noticed = Date.now();
      }
      await sleep(POLL_MS);
    }
    process.on("exit", () => release());
  }
  const began = Date.now();
  process.stdout.write(`long-run: running, log=${log}\n`);

  const out = fs.createWriteStream(log);
  const tail = [];
  let partial = "";
  const keep = (chunk) => {
    out.write(chunk);
    if (!options.tail) return;
    const lines = (partial + chunk.toString("utf8")).split(/\r?\n/);
    partial = lines.pop();
    tail.push(...lines);
    if (tail.length > options.tail) tail.splice(0, tail.length - options.tail);
  };
  const child = start(options.command);
  child.stdout.on("data", keep);
  child.stderr.on("data", keep);
  const beat = setInterval(() => {
    process.stdout.write(`long-run: still running after ${Math.round((Date.now() - began) / 1000)}s\n`);
  }, NOTICE_MS);
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { child.kill(); });

  const code = await new Promise((resolve) => {
    child.on("error", (error) => { keep(Buffer.from(`long-run: could not start: ${error.message}\n`)); resolve(127); });
    child.on("close", (exit, signal) => resolve(exit ?? (signal ? 130 : 1)));
  });
  clearInterval(beat);
  if (partial) tail.push(partial);
  await new Promise((resolve) => out.end(resolve));
  if (options.tail) process.stdout.write(`${tail.slice(-options.tail).join("\n")}\n`);
  const seconds = (ms) => Math.round(ms / 1000);
  process.stdout.write(`long-run: exit=${code} elapsed=${seconds(Date.now() - began)}s waited=${seconds(began - queued)}s log=${log}\n`);
  return code;
}

module.exports = { parseArgs, tryAcquire, release, quoteForCmd };

if (require.main === module) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
