#!/usr/bin/env node

// Stop hook for Claude Code and Codex: before an agent hands off, check the
// repository's personal rationale records and run its own delivery gates.
//
// Both checks are opt-in by the repository: docs/rationale enables the
// scholion check, docs/tools/run-agent-gates.mjs enables the dispatcher. A
// repository with neither gets an empty result, so the hook never formats,
// stages, or rewrites anything on its own.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PLUGIN_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const RATIONALE_CLI = path.join(PLUGIN_ROOT, "skills", "scholion", "scripts", "rationale.mjs");

function readInput() {
  const raw = fs.readFileSync(0, "utf8").trim();
  if (!raw) return { raw: "", value: {} };
  try {
    return { raw, value: JSON.parse(raw) };
  } catch {
    return { raw, value: {} };
  }
}

// Claude Code sets stop_hook_active on a Stop that follows a block and stops
// the session through continue:false; Codex reads decision:"block".
function blockingPayload(input, reason) {
  return input.stop_hook_active
    ? { continue: false, stopReason: reason }
    : { decision: "block", reason };
}

// A git that cannot start is a failed check, not a directory outside any repository.
function findGitRoot(cwd) {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8", windowsHide: true });
  if (result.error) throw new Error("git could not start: " + result.error.message);
  return result.status === 0 ? path.resolve(result.stdout.trim()) : null;
}

function parseStructuredOutput(output) {
  const text = String(output || "").trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {}
  for (const line of text.split(/\r?\n/).reverse()) {
    try {
      return JSON.parse(line);
    } catch {}
  }
  return null;
}

function oneLine(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function summarizeGateFailure(label, output) {
  const structured = parseStructuredOutput(output);
  if (structured && Array.isArray(structured.failures)) {
    const failures = structured.failures;
    const lines = failures.slice(0, 8).map((failure) => {
      const id = oneLine(failure.id) || "unknown";
      const title = oneLine(failure.title);
      const detail = oneLine(failure.detail);
      return "- " + id + (title ? " " + title : "") + (detail ? ": " + detail : "");
    });
    if (failures.length > lines.length) lines.push("- ... " + (failures.length - lines.length) + " more failure(s)");
    return label + ": " + failures.length + " failure(s)" + (lines.length > 0 ? "\n" + lines.join("\n") : ".");
  }
  const text = oneLine(output);
  return label + (text ? ": " + text.slice(-1600) : ": checker exited without structured failure details.");
}

function runRationaleGate(repoRoot) {
  const result = spawnSync(process.execPath,
    [RATIONALE_CLI, "check", "--incremental", "--root", repoRoot, "--json", "-q"], {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
    // The JSON lists every changed path, which outgrows the 1 MiB default in a large worktree.
    maxBuffer: Infinity,
  });
  const output = [result.error && result.error.message, result.stdout, result.stderr]
    .filter(Boolean).join("\n").trim();
  if (result.status !== 0) {
    throw new Error(summarizeGateFailure("Rationale records require attention", output));
  }
}

function runRepositoryDispatcher(repoRoot, dispatcher, rawInput) {
  const result = spawnSync(process.execPath, [dispatcher], {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
    input: rawInput,
    // Repository dispatchers read this to call the shared user-level formatter.
    env: { ...process.env, ASDF_SHARED_JAVA_FORMATTER: "1" },
  });
  if (result.status !== 0) {
    const output = [result.error && result.error.message, result.stdout, result.stderr]
      .filter(Boolean).join("\n").trim();
    throw new Error(summarizeGateFailure("Repository delivery gates failed", output));
  }
  const output = String(result.stdout || "").trim();
  if (!output || output === "{}") return null;
  try {
    return JSON.parse(output);
  } catch {
    throw new Error("Repository delivery gates returned invalid hook JSON:\n" + output.slice(-4000));
  }
}

function main() {
  const input = readInput();
  try {
    const repoRoot = findGitRoot(process.cwd());
    if (!repoRoot) {
      process.stdout.write("{}\n");
      return;
    }
    if (fs.existsSync(path.join(repoRoot, "docs", "rationale"))) runRationaleGate(repoRoot);
    const dispatcher = path.join(repoRoot, "docs", "tools", "run-agent-gates.mjs");
    const result = fs.existsSync(dispatcher) ? runRepositoryDispatcher(repoRoot, dispatcher, input.raw) : null;
    process.stdout.write(JSON.stringify(result || {}) + "\n");
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const reason = "Rationale records or repository delivery gates failed.\n\n" + detail.slice(-6000);
    process.stdout.write(JSON.stringify(blockingPayload(input.value, reason)) + "\n");
  }
}

main();
