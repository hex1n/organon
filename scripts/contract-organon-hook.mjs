#!/usr/bin/env node

// Contract for the organon plugin's Stop hook, run as each runtime runs it: the
// hook script with the Stop input on stdin and the session's directory as cwd.
// Fixtures are scratch Git repositories with optional delivery dispatchers.

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOOK = path.join(ROOT, "plugins", "organon", "hooks", "stop.mjs");

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: "utf8", windowsHide: true, ...options });
}

function git(repo, args) {
  const result = run("git", args, { cwd: repo });
  assert.equal(result.status, 0, "git " + args.join(" ") + "\n" + result.stderr);
}

function write(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, "utf8");
}

function makeRepo(dir) {
  fs.mkdirSync(dir, { recursive: true });
  git(dir, ["init", "-q"]);
  git(dir, ["config", "user.email", "hook@example.invalid"]);
  git(dir, ["config", "user.name", "Hook Probe"]);
  git(dir, ["config", "core.autocrlf", "false"]);
  write(path.join(dir, "notes.txt"), "seed\n");
  git(dir, ["add", "."]);
  git(dir, ["commit", "-qm", "seed"]);
  return dir;
}

function stop(cwd, stateRoot, input = {}, env = process.env) {
  const result = run(process.execPath, [HOOK], {
    cwd,
    input: JSON.stringify(input),
    env: { ...env, ASDF_AGENT_STATE_ROOT: stateRoot },
  });
  assert.equal(result.status, 0, "the hook reports through its JSON, never its exit code\n" + result.stderr);
  return JSON.parse(String(result.stdout).trim());
}

function runOutsideRepository(temporaryDir, stateRoot) {
  const outside = path.join(temporaryDir, "not-a-repo");
  fs.mkdirSync(outside);
  assert.deepEqual(stop(outside, stateRoot), {});
}

// A git that cannot start, as under a sandbox that refuses the spawn, blocks
// instead of passing as a directory outside any repository.
function runGitUnavailable(temporaryDir, stateRoot) {
  const repo = makeRepo(path.join(temporaryDir, "gitless"));
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toUpperCase() !== "PATH"));
  env.PATH = path.dirname(process.execPath);
  const blocked = stop(repo, stateRoot, {}, env);
  assert.equal(blocked.decision, "block");
  assert.match(blocked.reason, /git could not start/u);
}

// A repository without a delivery dispatcher is left exactly as it was.
function runWithoutDispatcher(temporaryDir, stateRoot) {
  const repo = makeRepo(path.join(temporaryDir, "plain"));
  write(path.join(repo, "staged.txt"), "staged( )\n");
  git(repo, ["add", "staged.txt"]);
  write(path.join(repo, "notes.txt"), "edited( )\n");
  const note = path.join(repo, "docs", "rationale", "demo", "01-demo.md");
  const contents = "A personal note with no record header.\n";
  write(note, contents);
  const index = path.join(repo, ".git", "index");
  const indexBefore = fs.readFileSync(index);
  assert.deepEqual(stop(repo, stateRoot), {}, "personal notes do not enable a gate");
  assert.deepEqual(fs.readFileSync(index), indexBefore, "Stop must not stage or rewrite the index");
  assert.equal(fs.readFileSync(path.join(repo, "notes.txt"), "utf8"), "edited( )\n");
  assert.equal(fs.readFileSync(note, "utf8"), contents);
  assert.equal(fs.existsSync(stateRoot), false, "Stop must not create rationale state");
}

function runDispatcher(temporaryDir, stateRoot) {
  const repo = makeRepo(path.join(temporaryDir, "dispatcher"));
  write(path.join(repo, "docs", "rationale", "demo", "01-demo.md"), "A personal note.\n");
  const dispatcher = path.join(repo, "docs", "tools", "run-agent-gates.mjs");
  write(dispatcher,
    "import fs from 'node:fs';\nconst input = fs.readFileSync(0, 'utf8');\n"
    + "process.stdout.write(JSON.stringify({ systemMessage: process.env.ASDF_SHARED_JAVA_FORMATTER + ' ' + input }));\n");
  assert.deepEqual(stop(repo, stateRoot, { session_id: "s1" }), { systemMessage: '1 {"session_id":"s1"}' },
    "the dispatcher receives the Stop input and the shared-formatter flag, and its JSON passes through");

  write(dispatcher, "process.stdout.write(JSON.stringify({ failures: [{ id: 'G-1', title: 'format', detail: 'Peer.txt' }] }));\nprocess.exitCode = 1;\n");
  const blocked = stop(repo, stateRoot);
  assert.equal(blocked.decision, "block");
  assert.match(blocked.reason, /Repository delivery gates failed: 1 failure\(s\)\n- G-1 format: Peer\.txt/u);

  const claude = stop(repo, stateRoot, { stop_hook_active: true });
  assert.equal(claude.continue, false);
  assert.equal(claude.stopReason, blocked.reason);
}

const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), "organon-hook-contract-"));
try {
  const stateRoot = path.join(temporaryDir, "state");
  runOutsideRepository(temporaryDir, stateRoot);
  runGitUnavailable(temporaryDir, stateRoot);
  runWithoutDispatcher(temporaryDir, stateRoot);
  runDispatcher(temporaryDir, stateRoot);
  process.stdout.write("organon Stop hook contract OK\n");
} finally {
  fs.rmSync(temporaryDir, { recursive: true, force: true });
}
