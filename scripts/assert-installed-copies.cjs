#!/usr/bin/env node

// Check that every runtime loads the current organon plugin and nothing else
// of ours.
//
// AGENTS.md requires every installed copy to stay byte-identical with its
// source. Claude Code reads the plugin from this checkout in place; Codex runs
// a cached copy that can silently sit revisions behind, and a per-skill link
// left from the earlier link install would load each skill a second time.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { PLUGIN, findLinkedSkills, claudeState, codexState } = require("./install-skills.cjs");
const { RULES_SOURCE_NAME, classifyRulesCopy } = require("./install-agent-tools.cjs");

const empty = { installed: true, override: false, drift: [], missing: [], extra: [] };

function scanPlugin(root, home = os.homedir()) {
  const results = findLinkedSkills(home).map((link) => ({
    ...empty,
    skill: link.skill,
    runtime: link.runtime,
    drift: [`linked skill -> ${link.target}`],
  }));
  const claude = claudeState(home, root);
  if (claude) {
    const base = { ...empty, skill: PLUGIN, runtime: ".claude" };
    if (!claude.installed) results.push({ ...base, installed: false });
    else if (claude.marketplace !== "current") {
      results.push({ ...base, drift: [`marketplace ${claude.registeredPath ?? "missing"}`] });
    } else results.push(base);
  }
  const codex = codexState(home, root);
  if (codex) {
    const base = { ...empty, skill: PLUGIN, runtime: ".codex" };
    if (!codex.installed) results.push({ ...base, installed: false });
    else {
      const drift = codex.marketplace === "current" ? codex.drift : [`marketplace ${codex.registeredPath ?? "missing"}`, ...codex.drift];
      results.push({ ...base, drift, missing: codex.missing, extra: codex.extra });
    }
  }
  return results;
}

// The user-level rules file has one installed copy the installer may have had
// to make instead of a link: ~/.codex/AGENTS.md on a Windows account without
// symlink privilege. A link reads as its source and needs no comparison; a
// copy is compared byte for byte, and content the installer did not write is
// a local override, reported and never fixed.
function scanRules(sourceFile, home = os.homedir()) {
  if (!fs.existsSync(sourceFile)) return null;
  const target = path.join(home, ".codex", "AGENTS.md");
  const base = { kind: "rules", skill: RULES_SOURCE_NAME, runtime: ".codex", source: sourceFile, target, ...empty };
  switch (classifyRulesCopy(target, sourceFile)) {
    case "absent":
      return { ...base, installed: false };
    case "stale":
      return { ...base, drift: ["AGENTS.md"] };
    case "foreign":
      return { ...base, override: true };
    default:
      return base;
  }
}

function summarize(results) {
  const overrides = results.filter((r) => r.override);
  const managed = results.filter((r) => !r.override);
  const clean = managed.filter((r) => r.installed && !r.drift.length && !r.missing.length && !r.extra.length);
  const dirty = managed.filter((r) => r.installed && (r.drift.length || r.missing.length || r.extra.length));
  const absent = managed.filter((r) => !r.installed);
  return { clean, dirty, absent, overrides, pass: dirty.length === 0 };
}

function main(argv) {
  const fix = argv.includes("--fix");
  const json = argv.includes("--json");
  const root = path.resolve(argv.find((a) => a.startsWith("--root="))?.split("=")[1] ?? path.join(__dirname, ".."));
  const home = argv.find((a) => a.startsWith("--home="))?.split("=")[1] ?? os.homedir();
  const rulesSource = path.join(root, RULES_SOURCE_NAME);

  const scanAll = () => [...scanPlugin(root, home), scanRules(rulesSource, home)].filter(Boolean);
  let results = scanAll();
  const fixedLog = [];
  if (fix) {
    // Only the rules copy is a plain file this check can sync; plugin state
    // belongs to the runtimes' own installers.
    for (const result of summarize(results).dirty.filter((r) => r.kind === "rules")) {
      fs.copyFileSync(result.source, result.target);
      fixedLog.push({ skill: result.skill, runtime: result.runtime, files: ["AGENTS.md"] });
    }
    results = scanAll();
  }

  const { clean, dirty, absent, overrides, pass } = summarize(results);

  if (json) {
    process.stdout.write(`${JSON.stringify({ pass, dirty, absent, overrides, fixed: fixedLog }, null, 2)}\n`);
  } else {
    for (const entry of fixedLog) {
      process.stdout.write(`synced ${entry.skill} @ ${entry.runtime}: ${entry.files.join(", ")}\n`);
    }
    for (const result of dirty) {
      const parts = [];
      if (result.drift.length) parts.push(`drift: ${result.drift.join(", ")}`);
      if (result.missing.length) parts.push(`missing: ${result.missing.join(", ")}`);
      if (result.extra.length) parts.push(`extra: ${result.extra.join(", ")}`);
      process.stdout.write(`DRIFT ${result.skill} @ ${result.runtime} — ${parts.join("; ")}\n`);
    }
    for (const result of overrides) {
      process.stdout.write(`local override: ${result.skill} @ ${result.runtime} — content the installer did not write; not checked\n`);
    }
    for (const result of absent) {
      process.stdout.write(`not installed: ${result.skill} @ ${result.runtime}\n`);
    }
    process.stdout.write(
      `${pass ? "PASS" : "FAIL"}: ${clean.length} current, ${dirty.length} drifted, ${absent.length} not installed` +
        `${overrides.length ? `, ${overrides.length} local override(s) not checked` : ""}\n`,
    );
    if (!pass) {
      process.stdout.write("run node scripts/install-skills.cjs --apply for the plugin, --fix for the rules copy\n");
    }
  }
  process.exitCode = pass ? 0 : 1;
}

// require.main is a module identity, not a path comparison, so it stays correct
// when this script is reached through a symlink or junction, and on Windows,
// where drive-letter casing and MSYS path translation make any
// argv-versus-module-URL comparison unreliable. The ESM form this replaced
// silently exited 0 without running, which for a gate or an installer is the
// worst failure available.
if (require.main === module) main(process.argv.slice(2));

module.exports = { scanPlugin, scanRules, summarize };
