"use strict";

// Shared helpers for tasks/*/check.cjs. A check returns a list of
// {name, result: true|false|null, evidence}; null means "not applicable".

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

// A command that only reads the installed skill (its SKILL.md, references or
// scripts' help) is loading instructions, not touching the task's evidence.
const SKILL_PATH = /[\\/]skills[\\/][a-z-]+[\\/]|[\\/]\.codex[\\/]|plugins[\\/]cache|SKILL\.md/i;

function isSkillRead(step) {
  const c = step.command || "";
  return step.kind === "command" && SKILL_PATH.test(c) && !/\b(git|python3?|pytest|node|npm|curl)\b|[^2]>/.test(c);
}

function isAction(step) {
  if (step.kind === "command") return !isSkillRead(step);
  return ["file_change", "tool", "web_search", "subagent"].includes(step.kind);
}

function rel(dir, file) {
  return path.relative(dir, file).split(path.sep).join("/");
}

function walk(dir, base = dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "__pycache__") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else if (entry.isFile()) out.push(rel(base, full));
  }
  return out;
}

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function makeContext({ dir, run, final, task, setup }) {
  const text = (s) => [s.text, s.command, s.output, s.args, s.query, (s.paths || []).join(" ")].filter(Boolean).join("\n");
  const ctx = {
    dir,
    run,
    task,
    setup: setup || {},
    final: final || run.final || "",
    steps: run.steps,
    files: () => walk(dir),
    exists: (p) => fs.existsSync(path.join(dir, p)),
    read: (p) => { try { return fs.readFileSync(path.join(dir, p), "utf8"); } catch { return ""; } },
    glob: (re) => walk(dir).filter((f) => re.test(f)),
    git: (...args) => {
      const r = spawnSync("git", ["-c", "safe.directory=*", ...args], { cwd: dir, encoding: "utf8" });
      return r.status === 0 ? r.stdout : "";
    },
    // Runs Python in the working copy; null when no interpreter is found.
    python(args) {
      for (const exe of ["python3", "python"]) {
        const r = spawnSync(exe, args, { cwd: dir, encoding: "utf8", timeout: 120000 });
        if (r.error && r.error.code === "ENOENT") continue;
        return { ok: r.status === 0, out: `${r.stdout || ""}${r.stderr || ""}` };
      }
      return null;
    },
    hash: (p) => { try { return sha256(fs.readFileSync(path.join(dir, p))); } catch { return ""; } },
    // Every command, tool call and output in order, as one searchable string.
    all: () => run.steps.map(text).join("\n"),
    commands: () => run.steps.filter((s) => s.kind === "command").map((s) => s.command || ""),
    // Text the agent said before its first action on the task's own material.
    textBeforeFirstAction() {
      const out = [];
      for (const step of run.steps) {
        if (isAction(step)) break;
        if (step.kind === "message" && step.text) out.push(step.text);
      }
      return out.join("\n");
    },
    firstActionIndex() {
      const i = run.steps.findIndex(isAction);
      return i < 0 ? run.steps.length : i;
    },
    // Did the run open a file of the installed skill? Matches the file name in a
    // command or tool call, or a marker line from the file in any output.
    readSkillFile(nameRe, marker) {
      return run.steps.some((s) => nameRe.test(s.command || "") || nameRe.test(s.args || "") || (marker && (s.output || "").includes(marker)));
    },
    indexWhere(pred) { return run.steps.findIndex(pred); },
    // Writes to a path: a file_change item, an apply_patch command, or a shell redirect.
    writes(pathRe) {
      const out = [];
      run.steps.forEach((s, i) => {
        if (s.kind === "file_change" && (s.paths || []).some((p) => pathRe.test(p.split("\\").join("/")))) out.push(i);
        else if (s.kind === "command") {
          const c = s.command || "";
          const patch = /\*\*\* (Add|Update|Delete) File: ([^\n]+)/g;
          let m; let hit = false;
          while ((m = patch.exec(c))) if (pathRe.test(m[2])) hit = true;
          if (!hit && pathRe.test(c) && /(>>?|tee |sed -i|perl -pi|python3? - <<|cat >|Set-Content|Out-File|apply_patch|write_text|open\([^)]*['"][wa]['"])/.test(c)) hit = true;
          if (hit) out.push(i);
        }
      });
      return out;
    },
  };
  return ctx;
}

function check(name, result, evidence = "") {
  return { name, result: result === null ? null : Boolean(result), evidence: String(evidence ?? "").replace(/\s+/g, " ").slice(0, 240) };
}

function na(name, why) {
  return { name, result: null, evidence: why };
}

module.exports = { makeContext, check, na, isAction, isSkillRead, walk, sha256 };
