const fs = require("node:fs");
const path = require("node:path");

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

function inSync(state) {
  return state.installed && !state.drift.length && !state.missing.length && !state.extra.length;
}

function refreshCodexCache(sourceDir, cacheDir, pluginName) {
  const parent = path.dirname(path.dirname(cacheDir));
  const staged = fs.mkdtempSync(path.join(parent, ".plugin-refresh-"));
  const next = path.join(staged, "next");
  const previous = path.join(staged, "previous");
  let retired = false;
  let activated = false;
  try {
    fs.cpSync(sourceDir, next, {
      recursive: true,
      filter: (source) => !fs.lstatSync(source).isSymbolicLink(),
    });
    const manifest = JSON.parse(fs.readFileSync(path.join(next, ".codex-plugin", "plugin.json"), "utf8"));
    const tree = compareTree(sourceDir, next);
    if (manifest.name !== pluginName || manifest.version !== path.basename(cacheDir)
        || !inSync(tree)) {
      throw new Error("plugin source changed while preparing the cache; re-run the installer");
    }
    if (fs.existsSync(cacheDir)) {
      fs.renameSync(cacheDir, previous);
      retired = true;
    }
    fs.renameSync(next, cacheDir);
    activated = true;
  } catch (error) {
    if (retired && !activated) {
      try {
        fs.renameSync(previous, cacheDir);
        retired = false;
      } catch (rollbackError) {
        throw new Error(`cache activation and rollback failed; previous cache retained at ${previous}`, {
          cause: new AggregateError([error, rollbackError]),
        });
      }
    }
    throw new Error(`failed to refresh ${cacheDir}; new cache was not activated`, { cause: error });
  } finally {
    if (!retired || activated) {
      try {
        fs.rmSync(staged, { recursive: true, force: true });
      } catch (error) {
        process.stderr.write(`cache staging retained at ${staged}: ${error.message}\n`);
      }
    }
  }
}

module.exports = { compareTree, inSync, refreshCodexCache };
