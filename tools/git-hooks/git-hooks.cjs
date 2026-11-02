#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { parseArgs } = require("node:util");

const TEST_PATHS_KEY = "organon.gitHooks.testPaths";

function git(cwd, args, accepted = [0]) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true });
  if (result.error) throw result.error;
  if (!accepted.includes(result.status)) {
    throw new Error(result.stderr.trim() || `git ${args[0]} exited ${result.status}`);
  }
  return result;
}

function readTestPaths(cwd) {
  const result = git(cwd, ["config", "--local", "--get", TEST_PATHS_KEY], [0, 1]);
  if (result.status === 1) throw new Error(`Configure ${TEST_PATHS_KEY} with the installer before using this hook`);
  const paths = JSON.parse(result.stdout);
  if (!Array.isArray(paths) || paths.some((value) => typeof value !== "string" || !value.trim())) {
    throw new Error(`${TEST_PATHS_KEY} must be a JSON array of non-empty Git pathspecs`);
  }
  return paths;
}

function checkStagedTests(cwd) {
  const paths = readTestPaths(cwd);
  if (!paths.length) return [];
  const staged = git(cwd, ["diff", "--cached", "--name-only", "-z", "--diff-filter=ACR", "--", ...paths])
    .stdout.split("\0").filter(Boolean);
  const parents = ["HEAD"];
  const mergeHead = path.resolve(cwd, git(cwd, ["rev-parse", "--git-path", "MERGE_HEAD"]).stdout.trim());
  if (fs.existsSync(mergeHead)) parents.push(...fs.readFileSync(mergeHead, "utf8").trim().split(/\s+/u).filter(Boolean));
  return staged.filter((file) => !parents.some((parent) =>
    git(cwd, ["cat-file", "-e", `${parent}:${file}`], [0, 1, 128]).status === 0));
}

function sameDirectory(left, right) {
  try { return fs.realpathSync(left) === fs.realpathSync(right); }
  catch { return false; }
}

function planRepository({ repo, hooksDir, testPaths, replaceExisting = false }) {
  const cwd = git(path.resolve(repo), ["rev-parse", "--show-toplevel"]).stdout.trim();
  const desired = path.resolve(hooksDir);
  for (const name of ["pre-commit", "commit-msg"]) {
    if (!fs.statSync(path.join(desired, name)).isFile()) throw new Error(`Missing hook: ${name}`);
  }
  if (!Array.isArray(testPaths) || testPaths.some((value) => typeof value !== "string" || !value.trim())) {
    throw new Error("Choose non-empty --test-path values or --allow-new-tests");
  }
  if (testPaths.length) git(cwd, ["diff", "--cached", "--name-only", "-z", "--diff-filter=ACR", "--", ...testPaths]);
  const configured = git(cwd, ["config", "--get", "core.hooksPath"], [0, 1]).stdout.trim();
  const activeDir = path.resolve(cwd, configured
    ? git(cwd, ["config", "--path", "--get", "core.hooksPath"]).stdout.trim()
    : git(cwd, ["rev-parse", "--git-path", "hooks"]).stdout.trim());
  const occupied = fs.existsSync(activeDir)
    ? fs.readdirSync(activeDir).filter((name) => !name.endsWith(".sample") && fs.statSync(path.join(activeDir, name)).isFile())
    : [];
  const ours = sameDirectory(activeDir, desired);
  const foreign = !ours && (Boolean(configured) || occupied.length > 0);
  return { repo: cwd, hooksDir: desired, testPaths: [...new Set(testPaths)], replaceExisting,
    previousHooksPath: configured || null, existingHooks: occupied, requiresReplacement: foreign };
}

function applyRepository(plan) {
  const current = planRepository(plan);
  if (current.requiresReplacement && !current.replaceExisting) {
    throw new Error("Existing Git hooks are active; inspect the preview and pass --replace-existing to change this repository's hook directory");
  }
  // Store the complete scope in one config write before selecting the shared hooks.
  git(current.repo, ["config", "--local", "--replace-all", TEST_PATHS_KEY, JSON.stringify(current.testPaths)]);
  git(current.repo, ["config", "--local", "core.hooksPath", current.hooksDir.replaceAll("\\", "/")]);
  return current;
}

function main(args) {
  if (args[0] === "pre-commit") {
    const offending = checkStagedTests(process.cwd());
    if (!offending.length) return;
    process.stderr.write("禁止将新增、复制或重命名的测试文件提交到 Git：\n");
    for (const file of offending) process.stderr.write(`  ${file}\n`);
    process.stderr.write("请使用 git restore --staged -- <文件> 移出暂存区；本地测试源码可以保留。\n");
    process.exitCode = 1;
    return;
  }
  if (args[0] !== "install") throw new Error("Usage: git-hooks.cjs install --repo <path> (--test-path <pathspec> ... | --allow-new-tests) [--apply] [--replace-existing]");
  const { values } = parseArgs({ args: args.slice(1), options: {
    repo: { type: "string", default: process.cwd() },
    "test-path": { type: "string", multiple: true, default: [] },
    "allow-new-tests": { type: "boolean", default: false },
    "replace-existing": { type: "boolean", default: false },
    apply: { type: "boolean", default: false },
  } });
  if (values["allow-new-tests"] === (values["test-path"].length > 0)) {
    throw new Error("Choose --test-path or --allow-new-tests explicitly");
  }
  const options = { repo: values.repo,
    hooksDir: path.join(path.dirname(path.resolve(process.argv[1])), "hooks"),
    testPaths: values["test-path"], replaceExisting: values["replace-existing"] };
  const plan = values.apply ? applyRepository(options) : planRepository(options);
  process.stdout.write(JSON.stringify({ ...plan, applied: values.apply }, null, 2) + "\n");
}

if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) {
    process.stderr.write(`Git hook: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { TEST_PATHS_KEY, checkStagedTests, planRepository, applyRepository };
