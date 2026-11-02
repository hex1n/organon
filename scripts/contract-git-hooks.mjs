#!/usr/bin/env node

import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const TOOL = path.resolve(process.env.ORGANON_GIT_HOOKS_TOOL || path.join(ROOT, "tools/git-hooks"));
const require = createRequire(import.meta.url);
const { planInstall, applyInstall } = require("./install-agent-tools.cjs");
const { TEST_PATHS_KEY, planRepository, applyRepository } = require(path.join(TOOL, "git-hooks.cjs"));
const scratch = path.join(ROOT, ".scratch", "20261030-git-hooks-tool");
fs.mkdirSync(scratch, { recursive: true });
const runRoot = fs.mkdtempSync(path.join(scratch, "contract-"));
const globalConfig = path.join(runRoot, "global-config");
fs.writeFileSync(globalConfig, "");
const env = { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: globalConfig,
  GIT_AUTHOR_NAME: "Hook Fixture", GIT_AUTHOR_EMAIL: "hook@example.invalid",
  GIT_COMMITTER_NAME: "Hook Fixture", GIT_COMMITTER_EMAIL: "hook@example.invalid" };
const alias = path.join(runRoot, "工具 link space");
fs.symlinkSync(TOOL, alias, process.platform === "win32" ? "junction" : "dir");
const cli = path.join(alias, "git-hooks.cjs");
const hooks = path.join(alias, "hooks");
const paths = [":(glob)**/src/test/**", "app/test/"];
const cases = [];
let serial = 0;

function git(repo, args, status = 0, input) {
  const result = spawnSync("git", args, { cwd: repo, env, encoding: "utf8", input, windowsHide: true });
  assert.equal(result.status, status, result.error?.message || result.stderr);
  return result;
}
function install(repo, options = [], status = 0) {
  const result = spawnSync(process.execPath, [cli, "install", "--repo", repo, ...options], { env, encoding: "utf8", windowsHide: true });
  assert.equal(result.status, status, result.error?.message || result.stderr);
  return result;
}
function record(name, action) {
  action();
  cases.push(name);
  console.log("PASS case: " + name);
}
function fixture() {
  const repo = path.join(runRoot, "repo space-中文-" + serial++);
  fs.mkdirSync(repo);
  git(repo, ["init", "-q"]);
  const blob = git(repo, ["hash-object", "-w", "--stdin"], 0, "fixture content\n").stdout.trim();
  function stage(name, object = blob) { git(repo, ["update-index", "--add", "--cacheinfo", "100644," + object + "," + name]); }
  function commit(parent) {
    const tree = git(repo, ["write-tree"]).stdout.trim();
    const args = ["commit-tree", tree, "-m", "fixture"];
    if (parent) args.push("-p", parent);
    return git(repo, args).stdout.trim();
  }
  stage("src/main/java/Sample.java");
  const base = commit();
  stage("src/test/java/ExistingTest.java");
  stage("src/test/resources/existing data.txt");
  const head = commit(base);
  const mergeFile = path.join(repo, ".git", "MERGE_HEAD");
  function reset(target = head) {
    if (fs.existsSync(mergeFile)) fs.unlinkSync(mergeFile);
    git(repo, ["update-ref", "HEAD", target]);
    git(repo, ["read-tree", target]);
  }
  reset();
  function hook(name, status, args = [], fragment = "") {
    const index = path.join(repo, ".git", "index");
    const before = fs.readFileSync(index);
    const result = git(repo, ["hook", "run", name, "--", ...args], status);
    assert.deepEqual(fs.readFileSync(index), before, "hooks leave the index untouched");
    if (fragment) assert.ok(result.stderr.includes(fragment), result.stderr);
    return result;
  }
  return { repo, blob, base, head, stage, reset, mergeFile, hook };
}

test("Git repository installer and managed tool link", () => {
  const f = fixture();
  const config = path.join(f.repo, ".git", "config");
  record("preview leaves repository config unchanged", () => {
    const before = fs.readFileSync(config);
    const plan = JSON.parse(install(f.repo, ["--test-path", paths[0]]).stdout);
    assert.equal(plan.applied, false);
    assert.equal(plan.hooksDir, hooks);
    assert.deepEqual(fs.readFileSync(config), before);
  });
  record("junction entry applies the requested scope", () => {
    const result = JSON.parse(install(f.repo, ["--test-path", paths[0], "--apply"]).stdout);
    assert.equal(result.applied, true);
    assert.deepEqual(JSON.parse(git(f.repo, ["config", "--local", "--get", TEST_PATHS_KEY]).stdout), [paths[0]]);
    assert.equal(git(f.repo, ["config", "--local", "--get", "core.hooksPath"]).stdout.trim(), hooks.replaceAll("\\", "/"));
  });
  record("applying an already managed hook directory is idempotent", () => install(f.repo, ["--test-path", paths[0], "--apply"]));
  record("a configured foreign hook directory is preserved", () => {
    git(f.repo, ["config", "--local", "core.hooksPath", ".husky"]);
    const before = fs.readFileSync(config);
    install(f.repo, ["--allow-new-tests", "--apply"], 1);
    assert.deepEqual(fs.readFileSync(config), before);
  });
  record("a hook added after preview is protected at apply", () => {
    install(f.repo, ["--allow-new-tests", "--replace-existing", "--apply"]);
    const plan = planRepository({ repo: f.repo, hooksDir: hooks, testPaths: [] });
    git(f.repo, ["config", "--local", "core.hooksPath", ".other-hooks"]);
    const before = fs.readFileSync(config);
    let rejection;
    try { applyRepository(plan); } catch (error) { rejection = error; }
    assert.deepEqual(fs.readFileSync(config), before);
    assert.match(rejection?.message || "", /Existing Git hooks/);
  });
  record("native hook files are protected even without hooksPath", () => {
    git(f.repo, ["config", "--local", "--unset", "core.hooksPath"]);
    const oldHook = path.join(f.repo, ".git", "hooks", "post-index-change");
    fs.writeFileSync(oldHook, "#!/bin/sh\nexit 0\n", { mode: 0o755 });
    const before = fs.readFileSync(config);
    install(f.repo, ["--allow-new-tests", "--apply"], 1);
    assert.deepEqual(fs.readFileSync(config), before);
    install(f.repo, ["--allow-new-tests", "--replace-existing", "--apply"]);
    assert.equal(fs.readFileSync(oldHook, "utf8"), "#!/bin/sh\nexit 0\n");
  });
  record("non-sample hook-directory files require an explicit switch", () => {
    git(f.repo, ["config", "--local", "--unset", "core.hooksPath"]);
    fs.unlinkSync(path.join(f.repo, ".git", "hooks", "post-index-change"));
    fs.writeFileSync(path.join(f.repo, ".git", "hooks", "README"), "owned hook directory\n");
    const before = fs.readFileSync(config);
    install(f.repo, ["--allow-new-tests", "--apply"], 1);
    assert.deepEqual(fs.readFileSync(config), before);
  });
  record("shared agent-tools installer links the Git tool", () => {
    const home = path.join(runRoot, "home space-中文");
    fs.mkdirSync(home);
    const plan = planInstall(home, ROOT);
    const asset = plan.assets.find((entry) => entry.name === "git-hooks");
    assert.equal(asset.source, path.join(ROOT, "tools", "git-hooks"));
    applyInstall({ assets: [asset], configs: [], rules: [], retired: [] });
    assert.equal(fs.realpathSync(asset.installPath), fs.realpathSync(asset.source));
    assert.equal(planInstall(home, ROOT).assets.find((entry) => entry.name === "git-hooks").linkState, "linked");
  });
});

test("Git staged-test contract", () => {
  const f = fixture();
  install(f.repo, ["--test-path", paths[0], "--apply"]);
  const pre = (status) => f.hook("pre-commit", status, [], status ? "禁止将新增" : "");
  record("unchanged index allowed", () => pre(0));
  record("new production allowed", () => { f.stage("src/main/java/New.java"); pre(0); });
  f.reset();
  record("new Java test blocked", () => { f.stage("src/test/java/NewTest.java"); pre(1); });
  f.reset();
  record("new test resource blocked", () => { f.stage("src/test/resources/data.json"); pre(1); });
  f.reset();
  record("space and Unicode paths are complete entries", () => {
    f.stage("src/test/resources/新增 空格.txt");
    assert.ok(pre(1).stderr.includes("src/test/resources/新增 空格.txt"));
  });
  f.reset();
  record("copied test blocked", () => { f.stage("src/test/java/CopiedTest.java"); pre(1); });
  f.reset();
  record("renamed test blocked", () => {
    git(f.repo, ["update-index", "--force-remove", "src/test/java/ExistingTest.java"]);
    f.stage("src/test/java/RenamedTest.java");
    assert.match(git(f.repo, ["diff", "--cached", "--name-status", "-M"]).stdout, /^R100/m);
    pre(1);
  });
  f.reset();
  record("modified tracked test allowed", () => {
    const changed = git(f.repo, ["hash-object", "-w", "--stdin"], 0, "changed\n").stdout.trim();
    f.stage("src/test/java/ExistingTest.java", changed); pre(0);
  });
  f.reset();
  record("deleted tracked test allowed", () => { git(f.repo, ["update-index", "--force-remove", "src/test/java/ExistingTest.java"]); pre(0); });
  f.reset(f.base);
  record("new test absent from HEAD blocked", () => { f.stage("src/test/resources/existing data.txt"); pre(1); });
  record("test tracked by MERGE_HEAD allowed", () => { fs.writeFileSync(f.mergeFile, f.head + "\n"); pre(0); });
  record("unknown merge test remains blocked", () => { f.stage("src/test/java/UnknownTest.java"); pre(1); });
  f.reset();
  record("central app/test and nested src/test scopes are independent", () => {
    install(f.repo, ["--test-path", paths[1], "--apply"]);
    f.stage("app/test/fixtures/legacy.json");
    f.stage("module/src/test/resources/new.json");
    const centralOnly = pre(1);
    assert.ok(centralOnly.stderr.includes("app/test/fixtures/legacy.json"));
    assert.ok(!centralOnly.stderr.includes("module/src/test/resources/new.json"));
    install(f.repo, ["--test-path", paths[0], "--test-path", paths[1], "--apply"]);
    const result = pre(1);
    assert.ok(result.stderr.includes("app/test/fixtures/legacy.json"));
    assert.ok(result.stderr.includes("module/src/test/resources/new.json"));
  });
  record("allow-new-tests leaves commit-message checks enabled", () => {
    install(f.repo, ["--allow-new-tests", "--apply"]); pre(0);
    fs.writeFileSync(path.join(f.repo, "message"), "invalid subject\n");
    f.hook("commit-msg", 1, ["message"], "Conventional Commits");
  });
  record("missing scope refuses rather than silently disabling checks", () => {
    git(f.repo, ["config", "--local", "--unset", TEST_PATHS_KEY]);
    f.hook("pre-commit", 1, [], "Configure " + TEST_PATHS_KEY);
  });
  record("malformed scope refuses and installer can repair it", () => {
    git(f.repo, ["config", "--local", TEST_PATHS_KEY, "{}"]);
    f.hook("pre-commit", 1, [], "JSON array");
    install(f.repo, ["--test-path", paths[0], "--apply"]);
    pre(1);
  });
});

test("Git commit-message contract", () => {
  const f = fixture();
  install(f.repo, ["--allow-new-tests", "--apply"]);
  function message(name, content, status, text = "") {
    record(name, () => { fs.writeFileSync(path.join(f.repo, "message"), content + "\n"); f.hook("commit-msg", status, ["message"], text); });
  }
  message("scoped Conventional subject allowed", "fix(scope): change", 0);
  message("unscoped Conventional subject allowed", "fix: change", 0);
  message("invalid subject blocked", "change", 1, "Conventional Commits");
  message("merge subject allowed", "Merge branch 'topic'", 0);
  message("revert subject allowed", 'Revert "fix: change"', 0);
  message("human coauthor allowed", "fix: change\n\nCo-Authored-By: Maintainer <maintainer@example.invalid>", 0);
  for (const name of ["Claude", "Anthropic", "OpenAI", "GPT", "Copilot", "Cursor", "Codeium"]) {
    message(name + " coauthor blocked", "fix: change\n\nCo-Authored-By: " + name + " <bot@example.invalid>", 1, "AI attribution");
  }
  for (const name of ["Claude-Session", "OpenAI-Session"]) message(name + " blocked", "fix: change\n\n" + name + ": fixture", 1, "AI attribution");
  message("merge does not bypass AI rule", "Merge branch 'topic'\n\nCo-Authored-By: OpenAI <bot@example.invalid>", 1, "AI attribution");
  message("revert does not bypass session rule", 'Revert "fix: change"\n\nClaude-Session: fixture', 1, "AI attribution");
});

after(() => {
  fs.writeFileSync(path.join(runRoot, "results.json"), JSON.stringify({ tool: TOOL, platform: process.platform, cases }, null, 2) + "\n");
  console.log("Git hook contract artifacts: " + runRoot);
});
