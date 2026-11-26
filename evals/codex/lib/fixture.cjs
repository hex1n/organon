"use strict";

// Builds a clean working copy of a task's fixture: copy the files, make a git
// history with a fixed author and date (so revisions are the same on every
// machine), then run the task's setup.cjs when it has one.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { sha256 } = require("./check.cjs");

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else if (entry.isFile()) fs.copyFileSync(s, d);
  }
}

function makeGit(dir) {
  // Ignore the machine's hooks and signing so a fixture commit never prompts.
  const hooks = fs.mkdtempSync(path.join(os.tmpdir(), "organon-evals-nohooks-"));
  const base = ["-c", "core.hooksPath=" + hooks, "-c", "commit.gpgsign=false", "-c", "core.autocrlf=false", "-c", "safe.directory=*", "-c", "init.defaultBranch=main"];
  const git = (args, env = {}) => {
    const r = spawnSync("git", [...base, ...args], { cwd: dir, encoding: "utf8", env: { ...process.env, ...env } });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr || r.error}`);
    return r.stdout;
  };
  const commit = (message, { name = "fx", date = "2026-11-01T10:00:00" } = {}) => {
    const env = {
      GIT_AUTHOR_NAME: name, GIT_AUTHOR_EMAIL: `${name}@example.test`, GIT_AUTHOR_DATE: date,
      GIT_COMMITTER_NAME: name, GIT_COMMITTER_EMAIL: `${name}@example.test`, GIT_COMMITTER_DATE: date,
    };
    git(["commit", "-q", "-m", message], env);
  };
  return { git, commit, cleanup: () => fs.rmSync(hooks, { recursive: true, force: true }) };
}

// Replace text in a fixture file and fail loudly if the anchor is missing, so a
// drifted fixture cannot silently produce a different task.
function edit(file, pairs) {
  let s = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  for (const [from, to] of pairs) {
    if (!s.includes(from)) throw new Error(`setup anchor not found in ${file}: ${from.slice(0, 60)}`);
    s = s.replace(from, to);
  }
  fs.writeFileSync(file, s);
}

function build(taskDir, dir, frozen = []) {
  const fixture = path.resolve(taskDir, "fixture");
  copyDir(fixture, dir);
  const { git, commit, cleanup } = makeGit(dir);
  try {
    git(["init", "-q"]);
    git(["symbolic-ref", "HEAD", "refs/heads/main"]);
    const setup = path.resolve(taskDir, "setup.cjs");
    if (fs.existsSync(setup)) require(setup)({ dir, fixture, git, commit, edit, copyDir });
    else {
      git(["add", "-A"]);
      commit("fixture");
    }
    const head = git(["rev-parse", "HEAD"]).trim();
    const hashes = {};
    for (const p of frozen) {
      try { hashes[p] = sha256(fs.readFileSync(path.join(dir, p))); } catch { hashes[p] = ""; }
    }
    return { head, frozen: hashes };
  } finally {
    cleanup();
  }
}

module.exports = { build, copyDir, edit };
