"use strict";

// codex exec --json does not report every subagent call: in Codex CLI 0.172 a
// spawn leaves no item and only "wait" shows, with no receiver. The session's
// rollout file (~/.codex/sessions/**/rollout-*-<thread id>.jsonl) records every
// function call, so count the subagent spawns there. Only the count and tool
// names leave this machine; the rollout itself holds the user's own context.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const SPAWN = /spawn|create_agent|start_agent|new_agent/i;
const NOT_SPAWN = /wait|send|close|list|kill|cancel|resume|status/i;

function findRolloutFile(threadId, home = process.env.CODEX_HOME || path.join(os.homedir(), ".codex")) {
  if (!threadId) return "";
  const stack = [path.join(home, "sessions")];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && e.name.includes(threadId) && e.name.endsWith(".jsonl")) return full;
    }
  }
  return "";
}

// Counts calls whose tool name reads as starting a subagent. Tolerates the
// response_item / function_call / custom_tool_call shapes and unknown nesting.
function countSpawns(text) {
  const names = [];
  for (const line of text.split("\n")) {
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    const p = e.payload || e.item || e;
    const kind = String(p.type || "");
    const name = String(p.name || p.tool || "");
    if (!/call/.test(kind) || !name) continue;
    if (SPAWN.test(name) && !NOT_SPAWN.test(name)) names.push(name);
  }
  return names;
}

function rolloutAgents(threadId, file) {
  const f = file || findRolloutFile(threadId);
  if (!f || !fs.existsSync(f)) return { found: false, spawns: null, names: [] };
  const names = countSpawns(fs.readFileSync(f, "utf8"));
  return { found: true, spawns: names.length, names: [...new Set(names)] };
}

module.exports = { rolloutAgents, countSpawns, findRolloutFile };
