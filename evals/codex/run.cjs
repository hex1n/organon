#!/usr/bin/env node
"use strict";

// Runs the organon probe tasks in Codex: for each task x model x repetition it
// builds a clean working copy, calls `codex exec --json`, grades the event
// stream and the files left behind, and writes results.csv. See README.md.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");
const { parse } = require("./lib/events.cjs");
const { rolloutAgents } = require("./lib/rollout.cjs");
const { makeContext, check, na } = require("./lib/check.cjs");
const { build, copyDir } = require("./lib/fixture.cjs");

const HERE = __dirname;
const TASKS = path.join(HERE, "tasks");

const USAGE = `usage: node evals/codex/run.cjs --models <m1,m2> [options]

  --models a,b        models passed to codex exec -m (use "default" to omit -m)
  --runs N            repetitions per task and model (default 1)
  --tasks a,b         only these tasks (default: all; see --list)
  --out DIR           results directory (default evals/codex/out/<timestamp>)
  --codex PATH        codex executable (default "codex")
  --invoke TEMPLATE   prompt template (default "$organon:{skill} {prompt}")
  --sandbox MODE      codex sandbox (default workspace-write)
  --config k=v        extra codex -c override, repeatable
  --timeout MIN       minutes per run before it is stopped (default 30)
  --keep              keep every working copy (failed ones are always kept)
  --dry-run           build the working copies and print the commands only
  --list              list the tasks
  -- ARGS             anything after -- is passed to codex exec as is

  Grade one finished run again:
  node evals/codex/run.cjs --check <task> --events <events.jsonl> --workdir <dir> [--last <last.txt>] [--rollout <rollout.jsonl>]
  node evals/codex/run.cjs --regrade <out or send-back dir>   (regrade saved runs with the current checks)`;

function parseArgs(argv) {
  const opts = { models: [], runs: 1, tasks: [], codex: "codex", invoke: "$organon:{skill} {prompt}", sandbox: "workspace-write", config: [], timeout: 30, extra: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => { if (i + 1 >= argv.length) throw new Error(`${a} needs a value`); return argv[++i]; };
    if (a === "--") { opts.extra = argv.slice(i + 1); break; }
    else if (a === "--models") opts.models = next().split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--runs") opts.runs = Number(next());
    else if (a === "--tasks") opts.tasks = next().split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--out") opts.out = path.resolve(next());
    else if (a === "--codex") opts.codex = next();
    else if (a === "--invoke") opts.invoke = next();
    else if (a === "--sandbox") opts.sandbox = next();
    else if (a === "--config") opts.config.push(next());
    else if (a === "--timeout") opts.timeout = Number(next());
    else if (a === "--keep") opts.keep = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--list") opts.list = true;
    else if (a === "--check") opts.check = next();
    else if (a === "--regrade") opts.regrade = path.resolve(next());
    else if (a === "--events") opts.events = path.resolve(next());
    else if (a === "--workdir") opts.workdir = path.resolve(next());
    else if (a === "--last") opts.last = path.resolve(next());
    else if (a === "--rollout") opts.rollout = path.resolve(next());
    else if (a === "-h" || a === "--help") opts.help = true;
    else throw new Error(`unknown option ${a}`);
  }
  return opts;
}

function loadTasks(names) {
  const all = fs.readdirSync(TASKS, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(TASKS, e.name, "task.json")))
    .map((e) => ({ id: e.name, dir: path.join(TASKS, e.name), ...JSON.parse(fs.readFileSync(path.join(TASKS, e.name, "task.json"), "utf8")) }))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (!names.length) return all;
  const missing = names.filter((n) => !all.some((t) => t.id === n));
  if (missing.length) throw new Error(`unknown task(s): ${missing.join(", ")}; see --list`);
  return all.filter((t) => names.includes(t.id));
}

function promptFor(task, template) {
  return template.replace(/\{skill\}/g, task.skill).replace(/\{prompt\}/g, task.prompt);
}

function codexArgs(opts, task, model, workdir, lastFile) {
  const args = ["exec", "--json", "--skip-git-repo-check", "-C", workdir, "--sandbox", opts.sandbox, "--output-last-message", lastFile];
  if (model && model !== "default") args.push("-m", model);
  for (const kv of [...(task.codexConfig || []), ...opts.config]) args.push("-c", kv);
  args.push(...opts.extra, "-");
  return args;
}

function grade(task, workdir, run, final, setup) {
  const ctx = makeContext({ dir: workdir, run, final, task, setup });
  try {
    const list = require(path.join(task.dir, "check.cjs"))(ctx, { check, na });
    return list;
  } catch (error) {
    return [check("grader ran", false, error.stack || String(error))];
  }
}

function csv(value) {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function quoteWin(arg) {
  return /[\s"&|<>^]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg;
}

function runCodex(opts, args, prompt, eventsFile, stderrFile) {
  return new Promise((resolve) => {
    const win = process.platform === "win32";
    const child = spawn(win ? quoteWin(opts.codex) : opts.codex, win ? args.map(quoteWin) : args, { shell: win, stdio: ["pipe", "pipe", "pipe"] });
    const out = fs.createWriteStream(eventsFile);
    const err = fs.createWriteStream(stderrFile);
    const flushed = Promise.all([new Promise((r) => out.on("finish", r)), new Promise((r) => err.on("finish", r))]);
    child.stdout.pipe(out);
    child.stderr.pipe(err);
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGTERM"); setTimeout(() => child.kill("SIGKILL"), 5000); }, opts.timeout * 60000);
    child.on("error", (error) => { err.write(String(error)); });
    child.on("close", (code) => {
      clearTimeout(timer);
      out.end(); err.end();
      flushed.then(() => resolve({ code: timedOut ? "timeout" : code }));
    });
    child.stdin.on("error", () => {});
    child.stdin.end(prompt);
  });
}

function saveWorkdirChanges(workdir, dest) {
  const git = (...a) => spawnSync("git", ["-c", "safe.directory=*", ...a], { cwd: workdir, encoding: "utf8" }).stdout || "";
  const status = git("status", "--porcelain", "--untracked-files=all");
  fs.writeFileSync(path.join(dest, "diff.txt"), `${status}\n${git("diff", "HEAD")}`);
  let budget = 2 * 1024 * 1024;
  for (const line of status.split("\n")) {
    const file = line.slice(3).trim().replace(/^"|"$/g, "");
    if (!file || line.startsWith(" D") || line.startsWith("D ")) continue;
    const src = path.join(workdir, file);
    let st;
    try { st = fs.statSync(src); } catch { continue; }
    if (!st.isFile() || st.size > 256 * 1024 || st.size > budget) continue;
    budget -= st.size;
    const to = path.join(dest, "files", file);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(src, to);
  }
}

// Regrade saved runs with the current checks: use the kept workdir when it is
// still there, else rebuild the fixture and lay the saved changed files over it.
// The rollout is looked up by thread id, so on the machine that ran Codex the
// hidden subagent spawns are counted too.
function regrade(outDir) {
  const tasks = Object.fromEntries(loadTasks([]).map((t) => [t.id, t]));
  const runsDir = path.join(outDir, "runs");
  const fmt = (c) => (c.result === null ? "NA" : c.result ? "1" : "0");
  for (const id of fs.readdirSync(runsDir).sort()) {
    const runDir = path.join(runsDir, id);
    let saved;
    try { saved = JSON.parse(fs.readFileSync(path.join(runDir, "checks.json"), "utf8")); } catch { continue; }
    const task = tasks[saved.task];
    if (!task) continue;
    const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "organon-codex-regrade-"));
    try {
      const fresh = path.join(scratch, "w");
      const setup = build(task.dir, fresh, task.frozen || []);
      let workdir = saved.workdir && fs.existsSync(saved.workdir) ? saved.workdir : fresh;
      if (workdir === fresh) {
        if (fs.existsSync(path.join(runDir, "files"))) copyDir(path.join(runDir, "files"), fresh);
        const diff = fs.existsSync(path.join(runDir, "diff.txt")) ? fs.readFileSync(path.join(runDir, "diff.txt"), "utf8") : "";
        for (const line of diff.split("\n")) if (/^( D|D ) /.test(line)) fs.rmSync(path.join(fresh, line.slice(3).trim()), { force: true });
      }
      const run = parse(fs.readFileSync(path.join(runDir, "events.jsonl"), "utf8"));
      run.rollout = rolloutAgents(run.threadId);
      const lastFile = path.join(runDir, "last.txt");
      const last = fs.existsSync(lastFile) ? fs.readFileSync(lastFile, "utf8").trim() : "";
      const checks = grade(task, workdir, run, last || run.final, setup);
      const counted = checks.filter((c) => c.result !== null);
      const ok = counted.length > 0 && counted.every((c) => c.result);
      const where = workdir === fresh ? "saved files" : "kept workdir";
      const spawns = run.rollout.found ? `, rollout: ${run.rollout.spawns} subagent spawns` : ", no rollout";
      console.log(`${ok ? "pass" : "FAIL"} ${id} (${where}${spawns})`);
      for (const c of checks) {
        const before = (saved.checks || []).find((o) => o.name === c.name);
        if (!before || fmt(before) !== fmt(c) || c.result === false) console.log(`  ${before ? fmt(before) : "-"} -> ${fmt(c)}  ${c.name}: ${c.evidence}`);
      }
      fs.writeFileSync(path.join(runDir, "checks.regraded.json"), JSON.stringify({ rollout: { found: run.rollout.found, spawns: run.rollout.spawns, names: run.rollout.names }, checks }, null, 2));
    } finally {
      fs.rmSync(scratch, { recursive: true, force: true });
    }
  }
}

function writeSummary(outDir, rows, runs, meta) {
  const header = "task,skill,model,run,check,result,evidence\n";
  fs.writeFileSync(path.join(outDir, "results.csv"), header + rows.map((r) => [r.task, r.skill, r.model, r.run, r.check, r.result, r.evidence].map(csv).join(",")).join("\n") + "\n");
  const runCols = ["id", "task", "skill", "model", "run", "exit_code", "turn_failed", "seconds", "input_tokens", "cached_input_tokens", "output_tokens", "reasoning_tokens", "events", "parse_errors", "subagent_spawns", "passed", "failed", "na", "pass"];
  fs.writeFileSync(path.join(outDir, "runs.csv"), runCols.join(",") + "\n" + runs.map((r) => runCols.map((c) => csv(r[c])).join(",")).join("\n") + "\n");
  const groups = new Map();
  for (const r of rows) {
    const key = `${r.task}\u0000${r.model}\u0000${r.check}`;
    const g = groups.get(key) || { task: r.task, model: r.model, check: r.check, pass: 0, total: 0 };
    if (r.result !== "NA") { g.total += 1; if (r.result === "1") g.pass += 1; }
    groups.set(key, g);
  }
  const lines = [`# Codex probe results`, "", `codex: ${meta.version}`, `invoke: \`${meta.invoke}\``, `runs: ${runs.length}, all checks passed: ${runs.filter((r) => r.pass === 1).length}`, "", "| task | model | check | passed |", "|---|---|---|---|"];
  for (const g of groups.values()) lines.push(`| ${g.task} | ${g.model} | ${g.check} | ${g.total ? `${g.pass}/${g.total}` : "n/a"} |`);
  const failed = runs.filter((r) => r.pass !== 1).map((r) => r.id);
  lines.push("", failed.length ? `Runs with a failed check (kept under runs/): ${failed.join(", ")}` : "No failed runs.");
  fs.writeFileSync(path.join(outDir, "summary.md"), lines.join("\n") + "\n");
}

function makeSendBack(outDir, runs) {
  const dest = path.join(outDir, "send-back");
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const f of ["results.csv", "runs.csv", "summary.md"]) fs.copyFileSync(path.join(outDir, f), path.join(dest, f));
  for (const r of runs.filter((x) => x.pass !== 1)) fs.cpSync(path.join(outDir, "runs", r.id), path.join(dest, "runs", r.id), { recursive: true });
  return dest;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) { console.log(USAGE); return 0; }
  if (opts.list) {
    for (const t of loadTasks([])) console.log(`${t.id.padEnd(9)} ${t.skill.padEnd(10)} ${t.rule}`);
    return 0;
  }
  if (opts.regrade) { regrade(opts.regrade); return 0; }
  if (opts.check) {
    const [task] = loadTasks([opts.check]);
    if (!opts.events || !opts.workdir) throw new Error("--check needs --events and --workdir");
    const run = parse(fs.readFileSync(opts.events, "utf8"));
    run.rollout = rolloutAgents(run.threadId, opts.rollout);
    const last = opts.last && fs.existsSync(opts.last) ? fs.readFileSync(opts.last, "utf8").trim() : "";
    const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "organon-codex-setup-"));
    const setup = build(task.dir, path.join(scratch, "w"), task.frozen || []);
    fs.rmSync(scratch, { recursive: true, force: true });
    console.log(JSON.stringify(grade(task, opts.workdir, run, last || run.final, setup), null, 2));
    return 0;
  }
  if (!opts.models.length) { console.error(USAGE); return 2; }
  const tasks = loadTasks(opts.tasks);
  let version = "(dry run)";
  if (!opts.dryRun) {
    const v = spawnSync(opts.codex, ["--version"], { encoding: "utf8", shell: process.platform === "win32" });
    if (v.status !== 0) { console.error(`cannot run "${opts.codex} --version": ${v.error || v.stderr}`); return 2; }
    version = v.stdout.trim();
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = opts.out || path.join(HERE, "out", stamp);
  fs.mkdirSync(path.join(outDir, "runs"), { recursive: true });
  const rows = [];
  const runs = [];
  const total = tasks.length * opts.models.length * opts.runs;
  let n = 0;
  for (const task of tasks) {
    for (const model of opts.models) {
      for (let rep = 1; rep <= opts.runs; rep += 1) {
        n += 1;
        const id = `${task.id}-${model.replace(/[^\w.-]+/g, "_")}-${rep}`;
        const runDir = path.join(outDir, "runs", id);
        fs.mkdirSync(runDir, { recursive: true });
        const workdir = fs.mkdtempSync(path.join(os.tmpdir(), `organon-codex-${task.id}-`));
        const setup = build(task.dir, workdir, task.frozen || []);
        const prompt = promptFor(task, opts.invoke);
        const lastFile = path.join(runDir, "last.txt");
        const args = codexArgs(opts, task, model, workdir, lastFile);
        fs.writeFileSync(path.join(runDir, "prompt.txt"), prompt);
        if (opts.dryRun) {
          console.log(`[${n}/${total}] ${id}\n  cd ${workdir}\n  ${opts.codex} ${args.join(" ")}  < prompt.txt`);
          continue;
        }
        process.stdout.write(`[${n}/${total}] ${id} ... `);
        const started = Date.now();
        const { code } = await runCodex(opts, args, prompt, path.join(runDir, "events.jsonl"), path.join(runDir, "stderr.txt"));
        const seconds = Math.round((Date.now() - started) / 1000);
        const run = parse(fs.readFileSync(path.join(runDir, "events.jsonl"), "utf8"));
        run.rollout = rolloutAgents(run.threadId);
        const last = fs.existsSync(lastFile) ? fs.readFileSync(lastFile, "utf8").trim() : "";
        const checks = grade(task, workdir, run, last || run.final, setup);
        const counted = checks.filter((c) => c.result !== null);
        const passed = counted.filter((c) => c.result).length;
        const ok = code === 0 && !run.turnFailed && counted.length > 0 && passed === counted.length;
        for (const c of checks) rows.push({ task: task.id, skill: task.skill, model, run: rep, check: c.name, result: c.result === null ? "NA" : c.result ? "1" : "0", evidence: c.evidence });
        const record = { id, task: task.id, skill: task.skill, model, run: rep, exit_code: code, turn_failed: run.turnFailed ? 1 : 0, seconds, input_tokens: run.usage.input, cached_input_tokens: run.usage.cached, output_tokens: run.usage.output, reasoning_tokens: run.usage.reasoning, events: run.events, parse_errors: run.parseErrors, subagent_spawns: run.rollout.found ? run.rollout.spawns : "", passed, failed: counted.length - passed, na: checks.length - counted.length, pass: ok ? 1 : 0 };
        runs.push(record);
        fs.writeFileSync(path.join(runDir, "checks.json"), JSON.stringify({ ...record, workdir, setup, checks }, null, 2));
        if (!ok) saveWorkdirChanges(workdir, runDir);
        else if (!opts.keep) fs.rmSync(workdir, { recursive: true, force: true });
        console.log(`${ok ? "pass" : "FAIL"} ${passed}/${counted.length} checks, exit ${code}, ${seconds}s${ok ? "" : ` (workdir ${workdir})`}`);
        writeSummary(outDir, rows, runs, { version, invoke: opts.invoke });
      }
    }
  }
  if (opts.dryRun) return 0;
  const dest = makeSendBack(outDir, runs);
  console.log(`\nresults: ${path.join(outDir, "results.csv")}\nsummary: ${path.join(outDir, "summary.md")}\nsend back the folder: ${dest}`);
  return 0;
}

if (require.main === module) {
  main().then((code) => { process.exitCode = code; }, (error) => { console.error(error.message || error); process.exitCode = 2; });
}

module.exports = { parseArgs, loadTasks, promptFor, codexArgs, grade };
