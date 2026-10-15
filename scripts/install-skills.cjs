#!/usr/bin/env node

// Install this repository's skills as the organon plugin in the runtimes that
// load them, and retire the per-skill links an earlier install left behind.
//
// Claude Code reads a plugin from a local directory marketplace in place, so a
// source edit takes effect at the next session. Codex copies the plugin into
// its own cache; re-adding the plugin replaces that copy, and the gate compares
// it byte for byte. A per-skill link left in a runtime's skills directory
// would load every skill twice, once bare and once as organon:<skill>.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const PLUGIN = "organon";
const PLUGIN_ID = `${PLUGIN}@${PLUGIN}`;
const PLUGIN_ROOT = path.join(ROOT, "plugins", PLUGIN);
// The link install pointed each runtime at a skill under one of these trees.
const LINKED_SKILL_ROOTS = [path.join(ROOT, "skills"), path.join(PLUGIN_ROOT, "skills")];

// Windows refuses directory symlinks without Developer Mode or elevation; a
// junction needs neither, Node reports it via isSymbolicLink(), and readdir
// resolves through it — which is all the drift check relies on.
const LINK_TYPE = process.platform === "win32" ? "junction" : "dir";

const fold = (value) => (process.platform === "win32" ? value.toLowerCase() : value);

function pathKeys(value) {
  const keys = new Set([fold(path.resolve(value))]);
  try {
    keys.add(fold(fs.realpathSync(value)));
  } catch {}
  return keys;
}

function samePath(a, b) {
  const right = pathKeys(b);
  return [...pathKeys(a)].some((key) => right.has(key));
}

// Classify what currently occupies an install path, so the caller can tell a
// no-op from a replacement and never reports "installed" for a stale copy.
function classify(installPath, sourceDir) {
  let stat;
  try {
    stat = fs.lstatSync(installPath);
  } catch {
    return "absent";
  }
  if (stat.isSymbolicLink()) {
    try {
      // realpath both sides: a symlinked ancestor (macOS /var -> /private/var,
      // ~/.claude/skills -> ~/.agents/skills) must not make a correct link
      // read as pointing elsewhere.
      return fs.realpathSync(installPath) === fs.realpathSync(sourceDir) ? "linked" : "relinked";
    } catch {
      return "relinked"; // dangling link
    }
  }
  return "copy";
}

function linkSkill(installPath, sourceDir, io = fs) {
  io.mkdirSync(path.dirname(installPath), { recursive: true });
  // Build the link at a staged sibling first: if creation fails (Windows
  // permissions, locked path, bad target), the existing install must survive
  // rather than having been deleted ahead of a link that never appeared.
  const stagedPath = `${installPath}.staged-link`;
  // The staged path may hold a leftover from a previous failed run — ours to
  // replace only when it is a link back at this skill's source. Anything else
  // there is not ours to delete: stop rather than destroy an unrelated
  // sibling.
  let stagedStat = null;
  try {
    stagedStat = io.lstatSync(stagedPath);
  } catch {}
  if (stagedStat) {
    if (stagedStat.isSymbolicLink() && classify(stagedPath, sourceDir) === "linked") {
      io.rmSync(stagedPath, { recursive: true, force: true });
    } else {
      throw new Error(`staged path ${stagedPath} exists and is not this skill's staged link; move it aside and re-run`);
    }
  }
  io.symlinkSync(sourceDir, stagedPath, LINK_TYPE);
  // From here the old install may be partially or fully deleted at any point
  // (a recursive rmSync can fail halfway through), so on any failure the
  // staged link stays on disk as the recovery path — readdir resolves through
  // it, so the skill's content remains reachable — and the next run reuses or
  // replaces it. Retry the whole destructive sequence once for transient
  // locks, then give up without discarding the staged link.
  try {
    io.rmSync(installPath, { recursive: true, force: true });
    io.renameSync(stagedPath, installPath);
  } catch (error) {
    try {
      io.rmSync(installPath, { recursive: true, force: true });
      io.renameSync(stagedPath, installPath);
    } catch {
      throw new Error(
        `failed to replace ${installPath}; the old install may be incomplete, staged link kept at ${stagedPath}`,
        { cause: error },
      );
    }
  }
}

// A per-skill link of ours in any runtime's skills directory. Provenance comes
// from the stored target, read without resolving it, because the link may
// dangle after a move. A real directory or a link elsewhere may be a local
// override (CONTEXT.md) and is never reported.
function findLinkedSkills(home = os.homedir(), roots = LINKED_SKILL_ROOTS) {
  const ours = new Set(roots.flatMap((root) => [...pathKeys(root)]));
  const links = [];
  const scanned = new Set();
  let entries = [];
  try {
    entries = fs.readdirSync(home, { withFileTypes: true });
  } catch {
    return links;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith(".")) continue;
    const skillsDir = path.join(home, entry.name, "skills");
    let resolvedDir;
    try {
      resolvedDir = fs.realpathSync(skillsDir);
    } catch {
      continue;
    }
    // ~/.claude/skills may alias ~/.agents/skills; one directory is scanned once.
    if (scanned.has(resolvedDir)) continue;
    scanned.add(resolvedDir);
    for (const child of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (!child.isSymbolicLink()) continue;
      const installPath = path.join(skillsDir, child.name);
      const target = path.resolve(skillsDir, fs.readlinkSync(installPath));
      if (!ours.has(fold(path.dirname(target)))) continue;
      links.push({ runtime: entry.name, skill: child.name, installPath, target });
    }
  }
  return links.sort((a, b) => a.runtime.localeCompare(b.runtime) || a.skill.localeCompare(b.skill));
}

function listFilesRecursive(root) {
  const out = [];
  if (!fs.existsSync(root)) return out;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) out.push(path.relative(root, full).split(path.sep).join("/"));
    }
  };
  walk(root);
  return out.sort();
}

function sameBytes(a, b) {
  try {
    return fs.readFileSync(a).equals(fs.readFileSync(b));
  } catch {
    return false;
  }
}

function compareTree(sourceDir, installedDir) {
  if (!fs.existsSync(installedDir)) return { installed: false, drift: [], missing: [], extra: [] };
  const sourceFiles = listFilesRecursive(sourceDir);
  const installedFiles = listFilesRecursive(installedDir);
  const installedSet = new Set(installedFiles);
  const drift = [];
  const missing = [];
  for (const rel of sourceFiles) {
    if (!installedSet.has(rel)) missing.push(rel);
    else if (!sameBytes(path.join(sourceDir, rel), path.join(installedDir, rel))) drift.push(rel);
  }
  const sourceSet = new Set(sourceFiles);
  const extra = installedFiles.filter((rel) => !sourceSet.has(rel));
  return { installed: true, drift, missing, extra };
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

function marketplaceState(registeredPath, root) {
  if (registeredPath == null) return "absent";
  return samePath(registeredPath, root) ? "current" : "elsewhere";
}

function claudeState(home = os.homedir(), root = ROOT) {
  if (!fs.existsSync(path.join(home, ".claude"))) return null;
  const plugins = path.join(home, ".claude", "plugins");
  const registeredPath = readJson(path.join(plugins, "known_marketplaces.json"))[PLUGIN]?.source?.path ?? null;
  const installed = Boolean(readJson(path.join(plugins, "installed_plugins.json")).plugins?.[PLUGIN_ID]?.length);
  return { runtime: "claude", registeredPath, marketplace: marketplaceState(registeredPath, root), installed };
}

function codexState(home = os.homedir(), root = ROOT, pluginRoot = path.join(root, "plugins", PLUGIN)) {
  if (!fs.existsSync(path.join(home, ".codex"))) return null;
  const manifest = readJson(path.join(pluginRoot, ".codex-plugin", "plugin.json"));
  if (!manifest.version) return null;
  let config = "";
  try {
    config = fs.readFileSync(path.join(home, ".codex", "config.toml"), "utf8");
  } catch {}
  const table = config.match(new RegExp(`^\\[marketplaces\\.${PLUGIN}\\]\\s*$([\\s\\S]*?)(?=^\\[|(?![\\s\\S]))`, "mu"));
  const source = table?.[1].match(/^source\s*=\s*(?:'([^']*)'|"([^"]*)")/mu);
  // Codex records a local marketplace as an extended-length Windows path.
  const registeredPath = source ? (source[1] ?? source[2]).replace(/^\\\\\?\\/u, "") : null;
  const enabled = new RegExp(`^\\[plugins\\."${PLUGIN_ID}"\\]`, "mu").test(config);
  const cacheDir = path.join(home, ".codex", "plugins", "cache", PLUGIN, PLUGIN, manifest.version);
  const tree = compareTree(pluginRoot, cacheDir);
  return {
    runtime: "codex",
    registeredPath,
    marketplace: marketplaceState(registeredPath, root),
    cacheDir,
    ...tree,
    installed: enabled && tree.installed,
  };
}

function inSync(state) {
  return state.installed && !state.drift.length && !state.missing.length && !state.extra.length;
}

function planActions(home = os.homedir(), root = ROOT) {
  const actions = findLinkedSkills(home).map((link) => ({ kind: "unlink", ...link }));
  const cli = (runtime, args) => actions.push({ kind: "cli", runtime, args });
  for (const state of [claudeState(home, root), codexState(home, root)].filter(Boolean)) {
    const command = state.runtime;
    if (state.marketplace === "elsewhere") cli(command, ["plugin", "marketplace", "remove", PLUGIN]);
    if (state.marketplace !== "current") cli(command, ["plugin", "marketplace", "add", root]);
    if (command === "claude" && !state.installed) cli(command, ["plugin", "install", PLUGIN_ID]);
    if (command === "codex" && (state.marketplace !== "current" || !inSync(state))) {
      cli(command, ["plugin", "add", PLUGIN_ID]);
    }
  }
  return actions;
}

function describe(action) {
  if (action.kind === "unlink") return `remove linked skill: ${action.skill} @ ${action.runtime}`;
  return `run: ${action.runtime} ${action.args.join(" ")}`;
}

function runCli(action) {
  // The runtimes install as .cmd shims on Windows, which only a shell resolves.
  const result = process.platform === "win32"
    ? spawnSync([action.runtime, ...action.args.map((arg) => (/\s/u.test(arg) ? `"${arg}"` : arg))].join(" "), {
      stdio: "inherit",
      shell: true,
    })
    : spawnSync(action.runtime, action.args, { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${describe(action)} exited with ${result.status ?? result.error}`);
}

function main(argv) {
  const apply = argv.includes("--apply");
  const actions = planActions();
  for (const action of actions) {
    process.stdout.write(`${apply ? "DO" : "would"} ${describe(action)}\n`);
    if (!apply) continue;
    if (action.kind === "unlink") fs.unlinkSync(action.installPath);
    else runCli(action);
  }
  const runtimes = [claudeState(), codexState()].filter(Boolean).map((state) => state.runtime);
  process.stdout.write(
    `${apply ? "applied" : "plan"}: ${PLUGIN_ID} for ${runtimes.join(", ") || "no runtime"} — ` +
      `${actions.length} change(s)\n`,
  );
  if (!apply && actions.length) process.stdout.write("re-run with --apply to make these changes\n");
}

// require.main is a module identity, not a path comparison, so it stays correct
// when this script is reached through a symlink or junction, and on Windows,
// where drive-letter casing and MSYS path translation make any
// argv-versus-module-URL comparison unreliable. The ESM form this replaced
// silently exited 0 without running, which for a gate or an installer is the
// worst failure available.
if (require.main === module) main(process.argv.slice(2));

module.exports = { PLUGIN, classify, linkSkill, findLinkedSkills, compareTree, claudeState, codexState, planActions };
