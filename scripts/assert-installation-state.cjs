#!/usr/bin/env node

// Check that every runtime loads the current organon plugin and nothing else
// of ours.
//
// AGENTS.md requires every installed copy to stay byte-identical with its
// source. Claude Code reads the plugin from this checkout in place; Codex runs
// a cached copy that can silently sit revisions behind, and a per-skill link
// left from the earlier link install would load each skill a second time.
// The default gate checks Claude's registration; --runtime also queries its
// CLI to verify the folder or cache it would load in this project.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const { PLUGIN, samePath, compareTree, findLinkedSkills, claudeState, codexState } = require("./install-plugin.cjs");
const { RULES_SOURCE_NAME, classifyRulesCopy } = require("./install-agent-tools.cjs");

const empty = { installed: true, override: false, drift: [], missing: [], extra: [] };

function readClaudePlugins(root, home) {
  const options = { cwd: root, encoding: "utf8", windowsHide: true, timeout: 30000,
    env: { ...process.env, HOME: home, USERPROFILE: home } };
  const result = process.platform === "win32"
    ? spawnSync("claude plugin list --json", { ...options, shell: true })
    : spawnSync("claude", ["plugin", "list", "--json"], options);
  if (result.status !== 0) {
    return { error: `claude plugin list failed: ${result.error?.message || result.stderr?.trim() || `exit ${result.status}`}` };
  }
  try {
    const plugins = JSON.parse(result.stdout);
    if (!Array.isArray(plugins)) return { error: "claude plugin list did not return an array" };
    return { plugins };
  } catch (error) {
    return { error: `invalid claude plugin list JSON: ${error.message}` };
  }
}

function scanClaudeRuntime(root, base, report) {
  if (report.error) return [{ ...base, verification: "runtime", drift: [report.error] }];
  const plugins = report.plugins.filter((plugin) => plugin?.id === `${PLUGIN}@${PLUGIN}`);
  if (!plugins.length) return [{ ...base, verification: "runtime", drift: ["plugin missing from Claude runtime report"] }];
  const source = path.join(root, "plugins", PLUGIN);
  const version = JSON.parse(fs.readFileSync(path.join(source, ".claude-plugin", "plugin.json"), "utf8")).version;
  return plugins.map((plugin) => {
    const mode = plugin.readFromFolder ? "in-place" : "cache";
    const loadPath = plugin.readFromFolder || plugin.installPath;
    const loadedVersion = mode === "in-place" ? plugin.folderVersion : plugin.version;
    const entry = { ...base, verification: "runtime", mode, loadPath, loadedVersion,
      recordedVersion: plugin.version, scope: plugin.scope, projectPath: plugin.projectPath,
      drift: [...base.drift], missing: [], extra: [] };
    if (!plugin.enabled) entry.drift.push("plugin disabled in Claude runtime report");
    if (plugin.errors?.length) entry.drift.push(...plugin.errors);
    if (loadedVersion !== version) entry.drift.push(`loaded version ${loadedVersion ?? "missing"}; expected ${version}`);
    if (!loadPath) entry.drift.push("Claude runtime did not report a load path");
    else {
      if (mode === "in-place" && !samePath(loadPath, source)) entry.drift.push(`source folder ${loadPath}; expected ${source}`);
      try {
        const tree = compareTree(source, loadPath);
        if (!tree.installed) entry.drift.push(`load directory missing: ${loadPath}`);
        entry.drift.push(...tree.drift);
        entry.missing = tree.missing;
        entry.extra = tree.extra;
      } catch (error) {
        entry.drift.push(`cannot inspect load directory ${loadPath}: ${error.message}`);
      }
    }
    return entry;
  });
}

function scanPlugin(root, home = os.homedir(), claudeRuntime) {
  const results = findLinkedSkills(home).map((link) => ({
    ...empty,
    skill: link.skill,
    runtime: link.runtime,
    drift: [`linked skill -> ${link.target}`],
  }));
  const claude = claudeState(home, root);
  if (claude || claudeRuntime) {
    const base = { ...empty, skill: PLUGIN, runtime: ".claude", verification: "registration" };
    if (claude?.installed && claude.marketplace !== "current") {
      base.drift = [`marketplace ${claude.registeredPath ?? "missing"}`];
    }
    if (claudeRuntime) results.push(...scanClaudeRuntime(root, base, claudeRuntime));
    else results.push(claude.installed ? base : { ...base, installed: false });
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
  const unverified = clean.filter((r) => r.verification === "registration");
  return { clean, dirty, absent, overrides, unverified, pass: dirty.length === 0 };
}

function main(argv) {
  const fix = argv.includes("--fix");
  const json = argv.includes("--json");
  const root = path.resolve(argv.find((a) => a.startsWith("--root="))?.split("=")[1] ?? path.join(__dirname, ".."));
  const home = argv.find((a) => a.startsWith("--home="))?.split("=")[1] ?? os.homedir();
  const rulesSource = path.join(root, RULES_SOURCE_NAME);
  const claudeRuntime = argv.includes("--runtime") ? readClaudePlugins(root, home) : undefined;

  const scanAll = () => [...scanPlugin(root, home, claudeRuntime), scanRules(rulesSource, home)].filter(Boolean);
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

  const { clean, dirty, absent, overrides, unverified, pass } = summarize(results);
  const current = clean.filter((entry) => entry.verification !== "registration");

  if (json) {
    process.stdout.write(`${JSON.stringify({ pass, current, unverified, dirty, absent, overrides, fixed: fixedLog }, null, 2)}\n`);
  } else {
    for (const entry of results.filter((result) => result.verification === "runtime" && result.loadPath)) {
      process.stdout.write(`Claude ${entry.mode}: ${entry.loadPath} — loaded ${entry.loadedVersion ?? "unknown"}, recorded ${entry.recordedVersion ?? "unknown"}\n`);
    }
    if (unverified.length) process.stdout.write("Claude registration only; runtime not checked — run node scripts/contract-installation-state.mjs\n");
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
      `${pass ? "PASS" : "FAIL"}: ${current.length} current, ${unverified.length} registration-only, ${dirty.length} drifted, ${absent.length} not installed` +
        `${overrides.length ? `, ${overrides.length} local override(s) not checked` : ""}\n`,
    );
    if (!pass) {
      if (dirty.some((entry) => entry.verification === "runtime")) {
        process.stdout.write("inspect the reported Claude load path and CLI errors; rerun the runtime check after repair\n");
      }
      if (dirty.some((entry) => entry.verification !== "runtime")) {
        process.stdout.write("run node scripts/install-plugin.cjs --apply for the plugin, --fix for the rules copy\n");
      }
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
