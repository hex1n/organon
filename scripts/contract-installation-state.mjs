#!/usr/bin/env node

// The default check requires the installed Claude CLI; the default gate checks
// registrations without starting an external runtime. --self-test exercises the
// CLI contract with isolated platform-native fixtures, without installed agents.
// --codex-refresh <codex.exe> exercises Windows cache refresh with real handles.
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
  const { planInstall, applyInstall } = await import("./install-agent-tools.cjs");
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

  function registerCodex({ root, home, source }) {
    const { version } = JSON.parse(fs.readFileSync(path.join(source, ".codex-plugin/plugin.json"), "utf8"));
    const cache = path.join(home, ".codex/plugins/cache/organon/organon", version);
    fs.cpSync(source, cache, { recursive: true });
    const registered = process.platform === "win32" ? "\\\\?\\" + root : root;
    const config = path.join(home, ".codex/config.toml");
    fs.writeFileSync(config,
      "[marketplaces.organon]\nsource_type = \"local\"\nsource = '" + registered +
      "'\n\n[plugins.\"organon@organon\"]\nenabled = true\n\n[unrelated]\nkeep = true\n");
    return { cache, config };
  }

  function snapshot(directory) {
    return new Map(fs.readdirSync(directory, { recursive: true, withFileTypes: true }).map((entry) => {
      const file = path.join(entry.parentPath, entry.name);
      return [path.relative(directory, file), entry.isDirectory() ? null : fs.readFileSync(file)];
    }));
  }

  function codexRefreshFixture() {
    const f = fixture("no-directory");
    const { cache, config } = registerCodex(f);
    fs.writeFileSync(path.join(cache, "skill.md"), "stale\n");
    fs.unlinkSync(path.join(cache, ".claude-plugin/plugin.json"));
    fs.writeFileSync(path.join(cache, "extra.md"), "extra\n");
    const before = fs.readFileSync(config);
    const scripts = path.join(f.root, "scripts");
    fs.mkdirSync(scripts);
    for (const name of ["install-plugin.cjs", "plugin-cache.cjs"]) {
      fs.copyFileSync(path.join(ROOT, "scripts", name), path.join(scripts, name));
    }
    const preload = path.join(scripts, "contract-preload.cjs");
    const fault = path.join(f.home, "activation-fault");
    const externalAttempt = path.join(f.home, "external-runtime-attempt");
    fs.writeFileSync(preload, `
      const fs = require("node:fs");
      const assert = require("node:assert/strict");
      const cache = ${JSON.stringify(cache)};
      require("node:os").homedir = () => ${JSON.stringify(f.home)};
      const processes = require("node:child_process");
      for (const method of ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"]) {
        processes[method] = (file) => {
          fs.writeFileSync(${JSON.stringify(externalAttempt)}, String(file));
          throw new Error("unexpected external runtime: " + file);
        };
      }
      if (process.env.ORGANON_CONTRACT_FAIL_ACTIVATION === "1") {
        const rename = fs.renameSync;
        let retired;
        fs.renameSync = (from, to) => {
          if (retired && to === cache && from !== retired) {
            assert.equal(fs.existsSync(cache), false);
            assert.equal(fs.existsSync(retired), true);
            retired = undefined;
            fs.writeFileSync(${JSON.stringify(fault)}, "EBUSY");
            throw Object.assign(new Error("fixture blocked cache activation"), { code: "EBUSY" });
          }
          rename(from, to);
          if (from === cache) retired = to;
        };
      }
    `);
    function run(args = [], failActivation = false) {
      const result = spawnSync(process.execPath, ["--require", preload, path.join(scripts, "install-plugin.cjs"), ...args], {
        cwd: f.root, encoding: "utf8", windowsHide: true, timeout: 15000,
        env: { ...process.env, ORGANON_CONTRACT_FAIL_ACTIVATION: failActivation ? "1" : "0" },
      });
      assert.ifError(result.error);
      assert.equal(fs.existsSync(externalAttempt), false, "same-version refresh must avoid the runtime CLI");
      assert.deepEqual(fs.readFileSync(config), before);
      return result;
    }
    return { source: f.source, cache, fault, run };
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
    const { cache } = registerCodex(f);
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

  test("the tools installer retires only its dangling Scholion link", () => {
    const { root, home } = fixture("no-directory");
    const link = path.join(home, ".agents", "tools", "scholion");
    const source = path.join(root, "plugins", "organon", "skills", "scholion");
    const alias = path.join(path.dirname(root), "repo alias");
    const linkType = process.platform === "win32" ? "junction" : "dir";
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.mkdirSync(source, { recursive: true });
    fs.symlinkSync(root, alias, linkType);
    fs.symlinkSync(path.join(alias, path.relative(root, source)), link, linkType);
    fs.rmdirSync(source);

    const { retired } = planInstall(home, root);
    assert.deepEqual(retired, [link]);
    assert(fs.lstatSync(link).isSymbolicLink());
    applyInstall({ assets: [], configs: [], rules: [], retired });
    assert.throws(() => fs.lstatSync(link), { code: "ENOENT" });

    const foreign = path.join(path.dirname(root), "foreign", "scholion");
    fs.mkdirSync(foreign, { recursive: true });
    fs.symlinkSync(foreign, link, linkType);
    fs.rmdirSync(foreign);
    assert.deepEqual(planInstall(home, root).retired, []);
    assert(fs.lstatSync(link).isSymbolicLink());

    fs.unlinkSync(link);
    fs.mkdirSync(link);
    assert.deepEqual(planInstall(home, root).retired, []);
  });

  test("the installer previews and applies a same-version Codex cache refresh directly", () => {
    const f = codexRefreshFixture();
    const old = snapshot(f.cache);
    const source = snapshot(f.source);
    const preview = f.run();
    assert.equal(preview.status, 0, preview.stderr);
    assert.match(preview.stdout, /^would refresh Codex cache:/mu);
    assert.match(preview.stdout, /1 change\(s\)/u);
    assert.deepEqual(snapshot(f.cache), old);

    const apply = f.run(["--apply"]);
    assert.equal(apply.status, 0, apply.stderr);
    assert.deepEqual(snapshot(f.cache), source);

    const again = f.run(["--apply"]);
    assert.equal(again.status, 0, again.stderr);
    assert.match(again.stdout, /0 change\(s\)/u);
    assert.deepEqual(snapshot(f.cache), source);
  });

  test("a failed Codex cache activation restores the previous cache and permits retry", () => {
    const f = codexRefreshFixture();
    const old = snapshot(f.cache);
    const source = snapshot(f.source);
    const failed = f.run(["--apply"], true);
    assert.equal(failed.status, 1, failed.stdout + failed.stderr);
    assert.equal(fs.readFileSync(f.fault, "utf8"), "EBUSY");
    assert.deepEqual(snapshot(f.cache), old);

    const retry = f.run(["--apply"]);
    assert.equal(retry.status, 0, retry.stderr);
    assert.deepEqual(snapshot(f.cache), source);
  });

}

async function codexRefreshContract(executable, scratch) {
  if (process.platform !== "win32") {
    process.stdout.write("SKIP: Codex cache handle contract requires Windows\n");
    return;
  }
  assert(executable && fs.statSync(executable).isFile(), "pass an installed codex.exe after --codex-refresh");
  fs.mkdirSync(scratch, { recursive: true });
  const temporary = fs.mkdtempSync(path.join(scratch, "cache-refresh-"));
  process.stdout.write(`Codex cache refresh receipts: ${temporary}\n`);
  const home = path.join(temporary, "home space-中文");
  const source = path.join(ROOT, "plugins/organon");
  const version = JSON.parse(fs.readFileSync(path.join(source, ".codex-plugin/plugin.json"), "utf8")).version;
  const cache = path.join(home, ".codex/plugins/cache/organon/organon", version);
  const config = path.join(home, ".codex/config.toml");
  const installer = path.join(ROOT, "scripts/install-plugin.cjs");
  const { compareTree } = await import("./install-plugin.cjs");
  fs.cpSync(source, cache, { recursive: true });
  fs.writeFileSync(config, `[marketplaces.organon]\nsource_type = "local"\nsource = '${ROOT}'\n\n[plugins."organon@organon"]\nenabled = true\n`);
  const configBefore = fs.readFileSync(config);
  const payload = path.join(cache, "skills/arche/SKILL.md");
  const planFile = path.join(temporary, "plan.json");
  const helper = path.join(temporary, "handles.ps1");
  fs.writeFileSync(helper, String.raw`
param([string]$PlanFile)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$plan = Get-Content -Raw -Encoding UTF8 -LiteralPath $PlanFile | ConvertFrom-Json
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;
public static class CacheReadHandle {
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
  static extern SafeFileHandle CreateFile(string path, uint access, uint share, IntPtr security, uint creation, uint flags, IntPtr template);
  public static SafeFileHandle Open(string path, bool directory) {
    SafeFileHandle handle = CreateFile(path, 0x80000000u, 3, IntPtr.Zero, 3, directory ? 0x02000000u : 0u, IntPtr.Zero);
    if (handle.IsInvalid) throw new System.ComponentModel.Win32Exception();
    return handle;
  }
}
'@
function Invoke-Child([string]$executable, [string[]]$commandArguments) {
  $child = [Diagnostics.Process]::new()
  $child.StartInfo.FileName = $executable
  $child.StartInfo.Arguments = ($commandArguments | ForEach-Object { '"' + $_ + '"' }) -join ' '
  $child.StartInfo.UseShellExecute = $false
  $child.StartInfo.CreateNoWindow = $true
  $child.StartInfo.RedirectStandardOutput = $true
  $child.StartInfo.RedirectStandardError = $true
  $child.StartInfo.StandardOutputEncoding = [Text.Encoding]::UTF8
  $child.StartInfo.StandardErrorEncoding = [Text.Encoding]::UTF8
  $child.StartInfo.EnvironmentVariables['HOME'] = $plan.home
  $child.StartInfo.EnvironmentVariables['USERPROFILE'] = $plan.home
  $child.StartInfo.EnvironmentVariables['CODEX_HOME'] = $plan.codexHome
  $null = $child.Start()
  $output = $child.StandardOutput.ReadToEndAsync()
  $errors = $child.StandardError.ReadToEndAsync()
  if (-not $child.WaitForExit(120000)) { $child.Kill(); throw 'Isolated process timed out' }
  $result = [pscustomobject]@{status=$child.ExitCode; stdout=$output.Result; stderr=$errors.Result}
  $child.Dispose()
  return $result
}
$held = [CacheReadHandle]::Open($plan.heldPath, $plan.directory)
try {
  $original = $null
  if ($plan.mode -ne 'version') {
    $original = Invoke-Child $plan.codex @('plugin','add','organon@organon','--json')
    if ($plan.mode -eq 'config') { [IO.File]::AppendAllText($plan.payload, "stale after native install") }
  }
  $updated = Invoke-Child $plan.node @($plan.installer,'--apply')
} finally { $held.Dispose() }
[pscustomobject]@{original=$original; updated=$updated} | ConvertTo-Json -Depth 5 -Compress
`);
  const receipts = [];
  for (const mode of ["base", "config", "version"]) {
    fs.appendFileSync(payload, "\nstale cache\n");
    const previous = path.join(temporary, `${mode}-before`);
    fs.cpSync(cache, previous, { recursive: true });
    fs.writeFileSync(planFile, JSON.stringify({
      mode, home, codexHome: path.join(home, ".codex"), codex: executable,
      node: process.execPath, installer, payload,
      heldPath: mode === "base" ? path.dirname(cache) : mode === "config" ? config : cache,
      directory: mode !== "config",
    }));
    const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-File", helper, planFile], {
      encoding: "utf8", windowsHide: true, timeout: 240000, maxBuffer: Infinity,
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const receipt = { mode, ...JSON.parse(result.stdout.replace(/^\uFEFF/u, "").trim()) };
    receipts.push(receipt);
    fs.writeFileSync(path.join(temporary, `${mode}.json`), JSON.stringify(receipt, null, 2));
    if (mode === "version") {
      assert.equal(receipt.updated.status, 1, JSON.stringify(receipt));
      assert.deepEqual(compareTree(previous, cache), { installed: true, drift: [], missing: [], extra: [] });
      const retry = spawnSync(process.execPath, [installer, "--apply"], {
        encoding: "utf8", windowsHide: true,
        env: { ...process.env, HOME: home, USERPROFILE: home, CODEX_HOME: path.join(home, ".codex") },
      });
      assert.equal(retry.status, 0, retry.stdout + retry.stderr);
    } else {
      assert.equal(receipt.original.status, 1, JSON.stringify(receipt));
      assert.match(receipt.original.stderr, mode === "base" ? /os error 32/u : /os error 5/u);
      if (mode === "base") assert.match(receipt.original.stderr, /failed to back up plugin cache entry/u);
      assert.equal(receipt.updated.status, 0, JSON.stringify(receipt));
    }
    assert.deepEqual(compareTree(source, cache), { installed: true, drift: [], missing: [], extra: [] });
    assert.deepEqual(fs.readFileSync(config), configBefore);
    process.stdout.write(`PASS: ${mode} handle, cache contents and unchanged registration\n`);
  }
  fs.writeFileSync(path.join(temporary, "results.json"), JSON.stringify(receipts, null, 2));
  process.stdout.write(`Codex cache refresh contract OK; receipts: ${temporary}\n`);
}

const refreshIndex = process.argv.indexOf("--codex-refresh");
const scratchIndex = process.argv.indexOf("--scratch");
if (refreshIndex >= 0) {
  await codexRefreshContract(process.argv[refreshIndex + 1], scratchIndex >= 0
    ? path.resolve(process.argv[scratchIndex + 1]) : path.join(ROOT, ".scratch"));
} else if (process.argv.includes("--self-test")) {
  await selfTest();
} else {
  const result = spawnSync(process.execPath, [CHECK, "--runtime", ...process.argv.slice(2)], { stdio: "inherit", windowsHide: true });
  if (result.error) process.stderr.write(result.error.message + "\n");
  process.exitCode = result.status ?? 1;
}
