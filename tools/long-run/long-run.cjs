#!/usr/bin/env node
// Runs one long command at a time on this machine, keeps its complete output
// in a file, and reports how long it waited and ran. Node.js built-ins only.
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const USAGE = "usage: long-run.cjs [--log <file>] [--label <text>] [--tail <lines>] [--parallel] -- <command> [args...]";
const POLL_MS = 2000;
const NOTICE_MS = 60000;
const OWNER_READ_MS = 2000;

/**
 * The queue is a local endpoint the holder listens on. The operating system closes
 * it when the holder exits by any means, so a killed holder never leaves the
 * queue held. ORGANON_LONG_RUN_LOCK names a separate queue.
 */
function endpoint() {
  const queue = process.env.ORGANON_LONG_RUN_LOCK;
  const name = queue ? `organon-long-run-${crypto.createHash("sha256").update(queue).digest("hex").slice(0, 16)}` : "organon-long-run";
  if (process.platform === "win32") return `\\\\.\\pipe\\${name}`;
  if (process.platform === "linux") return `\0${name}`;
  return path.join(os.tmpdir(), `${name}.sock`);
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

/** Reads the holder's description; null when nothing answers, as with a socket file left by a killed holder. */
function readOwner(name) {
  return new Promise((resolve) => {
    let text = "";
    const socket = net.connect(name);
    const finish = (owner) => { socket.destroy(); resolve(owner); };
    socket.setTimeout(OWNER_READ_MS, () => finish({ pid: 0, label: "a run that does not answer" }));
    socket.on("data", (chunk) => { text += chunk; });
    socket.on("end", () => {
      try { finish(JSON.parse(text)); } catch { finish({ pid: 0, label: "another run" }); }
    });
    socket.on("error", () => finish(null));
  });
}

/**
 * Takes the queue. Resolves { server } when taken, { held } with the holder's
 * description while another run holds it, or { unavailable } when no endpoint
 * can be created; the caller then runs without the queue.
 */
async function tryAcquire(owner, name = endpoint()) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const server = net.createServer((socket) => socket.end(JSON.stringify(owner)));
    const error = await new Promise((resolve) => {
      server.once("error", resolve);
      server.listen(name, () => resolve(null));
    });
    if (!error) return { server };
    if (error.code !== "EADDRINUSE") return { unavailable: error };
    const held = await readOwner(name);
    if (held) return { held };
    // A Unix socket file outlives a killed holder; Windows pipes and Linux abstract sockets do not.
    if (name.startsWith("\0") || process.platform === "win32") return { held: { pid: 0, label: "another run" } };
    try { fs.unlinkSync(name); } catch { /* another waiter removed it */ }
  }
  return { held: { pid: 0, label: "another run" } };
}

/** Stops the command and everything it started; on Windows the shell's children outlive a plain kill. */
function stopTree(child) {
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
  else child.kill();
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
  let queue = null;
  if (!options.parallel) {
    const owner = { pid: process.pid, label, cwd: process.cwd(), since: new Date().toISOString() };
    let noticed = 0;
    for (let state = await tryAcquire(owner); ; state = await tryAcquire(owner)) {
      if (state.server) { queue = state.server; break; }
      if (state.unavailable) {
        process.stdout.write(`long-run: queue unavailable (${state.unavailable.code || state.unavailable.message}), running without waiting\n`);
        break;
      }
      if (Date.now() - noticed >= NOTICE_MS) {
        process.stdout.write(`long-run: waiting for ${state.held.label}${state.held.pid ? ` (pid ${state.held.pid})` : ""}\n`);
        noticed = Date.now();
      }
      await sleep(POLL_MS);
    }
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
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { stopTree(child); });

  const code = await new Promise((resolve) => {
    child.on("error", (error) => { keep(Buffer.from(`long-run: could not start: ${error.message}\n`)); resolve(127); });
    child.on("close", (exit, signal) => resolve(exit ?? (signal ? 130 : 1)));
  });
  clearInterval(beat);
  if (queue) queue.close();
  if (partial) tail.push(partial);
  await new Promise((resolve) => out.end(resolve));
  if (options.tail) process.stdout.write(`${tail.slice(-options.tail).join("\n")}\n`);
  const seconds = (ms) => Math.round(ms / 1000);
  process.stdout.write(`long-run: exit=${code} elapsed=${seconds(Date.now() - began)}s waited=${seconds(began - queued)}s log=${log}\n`);
  return code;
}

module.exports = { parseArgs, tryAcquire, quoteForCmd };

if (require.main === module) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
