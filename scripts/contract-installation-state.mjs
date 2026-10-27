#!/usr/bin/env node

// The default check requires the installed Claude CLI; the default gate checks
// registrations without starting an external runtime. --self-test exercises the
// CLI contract with isolated platform-native fixtures, without installed agents.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const CHECK = fileURLToPath(new URL("./assert-installation-state.cjs", import.meta.url));
const CONTRACT = fileURLToPath(import.meta.url);
const ROOT = fileURLToPath(new URL("../", import.meta.url));

async function selfTest() {
  const { test, after } = await import("node:test");
  const scratch = path.join(ROOT, ".scratch");
  fs.mkdirSync(scratch, { recursive: true });
  const temporary = fs.mkdtempSync(path.join(scratch, "installation-state-contract-"));
  after(() => {
    assert.equal(path.dirname(fs.realpathSync(temporary)), fs.realpathSync(scratch));
    fs.rmSync(temporary, { recursive: true, force: true });
  });
  function fixture(registration = "installed") {
    const dir = fs.mkdtempSync(path.join(temporary, "case-"));
    const home = path.join(dir, "home space-中文");
    const root = path.join(dir, "repo space-中文");
    const source = path.join(root, "plugins/organon");
    const cache = path.join(home, ".claude/plugins/cache/organon/organon/0.1.0");
    const bin = path.join(dir, "bin space-中文");
    for (const entry of [source, home, bin]) fs.mkdirSync(entry, { recursive: true });
    fs.mkdirSync(path.join(source, ".claude-plugin"));
    fs.mkdirSync(path.join(source, ".codex-plugin"));
    fs.writeFileSync(path.join(source, ".codex-plugin/plugin.json"), JSON.stringify({ name: "organon", version: "0.7.8" }));
    fs.writeFileSync(path.join(source, ".claude-plugin/plugin.json"), JSON.stringify({ name: "organon", version: "0.7.8" }));
    fs.writeFileSync(path.join(source, "skill.md"), "current\n");
    const plugins = path.join(home, ".claude/plugins");
    if (registration !== "no-directory") {
      fs.mkdirSync(cache, { recursive: true });
      fs.writeFileSync(path.join(cache, "skill.md"), "stale\n");
      fs.writeFileSync(path.join(plugins, "known_marketplaces.json"), JSON.stringify({ organon: { source: { source: "directory", path: root } } }));
      if (registration !== "missing") {
        const installed = { plugins: registration === "installed" ? {
          "organon@organon": [{ scope: "user", installPath: cache, version: "0.1.0" }],
        } : {} };
        fs.writeFileSync(path.join(plugins, "installed_plugins.json"), registration === "malformed" ? "{bad" : JSON.stringify(installed));
      }
    }
    // Field names and the old-record/current-folder split come from the local
    // Claude Code 2.1.300 report captured on 2026-10-27; paths relocate that shape.
    const report = [{ id: "organon@organon", version: "0.1.0", scope: "user", enabled: true,
      installPath: cache, readFromFolder: source, folderVersion: "0.7.8" }];
    const reportFile = path.join(dir, "report.json");
    const shim = path.join(bin, "claude.cjs");
    fs.writeFileSync(shim, `const fs = require('node:fs');
  if (JSON.stringify(process.argv.slice(2)) !== JSON.stringify(['plugin', 'list', '--json'])) process.exit(91);
  process.stdout.write(fs.readFileSync(${JSON.stringify(reportFile)}));
  `);
    if (process.platform === "win32") {
      fs.writeFileSync(path.join(bin, "claude.cmd"), '@"%ORGANON_CONTRACT_NODE%" "%~dp0claude.cjs" %*\r\n');
    } else {
      const quote = (value) => "'" + value.replaceAll("'", "'\\''") + "'";
      fs.writeFileSync(path.join(bin, "claude"), `#!/bin/sh\nexec ${quote(process.execPath)} ${quote(shim)} "$@"\n`, { mode: 0o755 });
    }
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toUpperCase() !== "PATH"));
    env.PATH = bin;
    env.ORGANON_CONTRACT_NODE = process.execPath;
    function run(runtime = true, raw = JSON.stringify(report)) {
      fs.writeFileSync(reportFile, raw);
      const result = spawnSync(process.execPath, [runtime ? CONTRACT : CHECK, `--root=${root}`, `--home=${home}`, "--json"], {
        encoding: "utf8", env, windowsHide: true,
      });
      assert.equal(result.error, undefined);
      return { status: result.status, output: JSON.parse(result.stdout), stderr: result.stderr };
    }
    return { root, home, source, cache, bin, report, run };
  }

  test("offline checks identify registration-only results without claiming a runtime check", () => {
    const { run } = fixture();
    const result = run(false);
    assert.equal(result.status, 0, JSON.stringify(result.output) + result.stderr);
    assert.equal(result.output.unverified.length, 1);
    assert.equal(result.output.unverified[0].runtime, ".claude");
  });

  test("runtime check accepts the current source folder despite a stale installed version", () => {
    const { run, source } = fixture();
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.output.unverified.length, 0);
    assert.equal(result.output.current[0].loadPath, source);
    assert.equal(result.output.current[0].loadedVersion, "0.7.8");
    assert.equal(result.output.current[0].recordedVersion, "0.1.0");
  });

  test("runtime reports are checked without installation records while offline absence remains allowed", () => {
    for (const registration of ["no-directory", "missing", "empty", "malformed"]) {
      const f = fixture(registration);
      const offline = f.run(false);
      assert.equal(offline.status, 0, registration + JSON.stringify(offline.output));
      assert.equal(offline.output.pass, true);

      const absent = f.run(true, "[]");
      assert.equal(absent.status, 1, registration + JSON.stringify(absent.output));
      assert.equal(absent.output.pass, false);
      assert.equal(absent.output.dirty[0].verification, "runtime");

      const current = f.run();
      assert.equal(current.status, 0, registration + JSON.stringify(current.output));
      assert.equal(current.output.current[0].loadPath, f.source);
      assert.equal(current.output.current[0].loadedVersion, "0.7.8");
      assert.equal(current.output.current[0].verification, "runtime");

      fs.unlinkSync(path.join(f.bin, process.platform === "win32" ? "claude.cmd" : "claude"));
      const unavailable = f.run();
      assert.equal(unavailable.status, 1, registration + JSON.stringify(unavailable.output));
      assert.equal(unavailable.output.pass, false);
      assert(unavailable.output.dirty[0].drift.some((reason) => reason.startsWith("claude plugin list failed:")));
    }
  });

  test("runtime check rejects wrong source folders, stale versions, missing plugins and load errors", () => {
    const f = fixture();
    fs.cpSync(f.source, f.cache, { recursive: true });
    const cases = [
      [{ ...f.report[0], readFromFolder: f.cache }],
      [{ ...f.report[0], folderVersion: "0.1.0" }],
      [],
      [{ ...f.report[0], errors: ["plugin failed to load"] }],
      [{ ...f.report[0], enabled: false }],
      [{ ...f.report[0], readFromFolder: undefined, installPath: undefined, version: "0.7.8" }],
      [{ ...f.report[0], readFromFolder: undefined, installPath: path.join(f.home, "missing-cache"), version: "0.7.8" }],
    ];
    for (const report of cases) {
      const result = f.run(true, JSON.stringify(report));
      assert.equal(result.status, 1, JSON.stringify({ report, result }));
      assert.equal(result.output.pass, false);
      assert.equal(result.output.dirty.length, 1);
    }
  });

  test("runtime check accepts a source-directory alias and inspects every reported scope", () => {
    const f = fixture();
    const alias = path.join(f.home, "source-alias");
    fs.symlinkSync(f.source, alias, process.platform === "win32" ? "junction" : "dir");
    f.report[0].readFromFolder = alias;
    const current = f.run();
    assert.equal(current.status, 0, JSON.stringify(current.output) + current.stderr);
    f.report.push({ ...f.report[0], scope: "project", errors: ["project plugin load failed"] });
    const result = f.run();
    assert.equal(result.status, 1);
    assert.equal(result.output.current.length, 1);
    assert.equal(result.output.dirty[0].scope, "project");
  });

  test("runtime verification preserves the registered marketplace ownership check", () => {
    const f = fixture();
    const registeredPath = path.join(f.root, "other-checkout");
    fs.writeFileSync(path.join(f.home, ".claude/plugins/known_marketplaces.json"),
      JSON.stringify({ organon: { source: { source: "directory", path: registeredPath } } }));
    for (const runtime of [false, true]) {
      const result = f.run(runtime);
      assert.equal(result.status, 1, JSON.stringify(result.output));
      assert(result.output.dirty[0].drift.includes("marketplace " + registeredPath));
    }
  });

  test("cached runtime plugins must match source bytes, including missing and extra files", () => {
    const f = fixture();
    fs.cpSync(f.source, f.cache, { recursive: true });
    delete f.report[0].readFromFolder;
    delete f.report[0].folderVersion;
    f.report[0].version = "0.7.8";
    const current = f.run();
    assert.equal(current.status, 0, JSON.stringify(current.output) + current.stderr);
    fs.writeFileSync(path.join(f.cache, "skill.md"), "stale\n");
    fs.writeFileSync(path.join(f.cache, "extra.md"), "extra\n");
    fs.unlinkSync(path.join(f.cache, ".claude-plugin/plugin.json"));
    const result = f.run();
    assert.equal(result.status, 1);
    assert.deepEqual(result.output.dirty[0].missing, [".claude-plugin/plugin.json"]);
    assert.deepEqual(result.output.dirty[0].extra, ["extra.md"]);
    assert(result.output.dirty[0].drift.includes("skill.md"));
  });

  test("runtime failures and invalid output fail instead of reverting to registration-only", () => {
    const f = fixture();
    for (const raw of ["not json", "{}"]) {
      const result = f.run(true, raw);
      assert.equal(result.status, 1);
      assert.equal(result.output.pass, false);
    }
    fs.unlinkSync(path.join(f.bin, process.platform === "win32" ? "claude.cmd" : "claude"));
    assert.equal(f.run().status, 1);
  });

  test("Codex cache checks use the native platform path representation", () => {
    const f = fixture();
    const cache = path.join(f.home, ".codex/plugins/cache/organon/organon/0.7.8");
    fs.cpSync(f.source, cache, { recursive: true });
    const registered = process.platform === "win32" ? "\\\\?\\" + f.root : f.root;
    fs.writeFileSync(path.join(f.home, ".codex/config.toml"),
      "[marketplaces.organon]\nsource_type = \"local\"\nsource = '" + registered +
      "'\n\n[plugins.\"organon@organon\"]\nenabled = true\n");
    const current = f.run(false);
    assert.equal(current.status, 0, current.stderr);
    assert(current.output.current.some((entry) => entry.runtime === ".codex"));
    fs.writeFileSync(path.join(cache, "skill.md"), "stale\n");
    const stale = f.run(false);
    assert.equal(stale.status, 1);
    assert(stale.output.dirty.some((entry) => entry.runtime === ".codex" && entry.drift.includes("skill.md")));
  });

  test("both installer entry points preview without modifying the isolated home", () => {
    const f = fixture();
    const registry = ["known_marketplaces.json", "installed_plugins.json"].map((file) => path.join(f.home, ".claude/plugins", file));
    const before = registry.map((file) => fs.readFileSync(file));
    for (const name of ["install-plugin.cjs", "install-agent-tools.cjs"]) {
      const result = spawnSync(process.execPath, [path.join(ROOT, "scripts", name)], {
        encoding: "utf8", windowsHide: true, env: { ...process.env, HOME: f.home, USERPROFILE: f.home },
      });
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.equal(fs.existsSync(path.join(f.home, ".codex")), false);
      for (let i = 0; i < registry.length; i++) assert.deepEqual(fs.readFileSync(registry[i]), before[i]);
    }
  });

}

if (process.argv.includes("--self-test")) {
  await selfTest();
} else {
  const result = spawnSync(process.execPath, [CHECK, "--runtime", ...process.argv.slice(2)], { stdio: "inherit", windowsHide: true });
  if (result.error) process.stderr.write(result.error.message + "\n");
  process.exitCode = result.status ?? 1;
}
