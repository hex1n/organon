#!/usr/bin/env node

// Append rows to a decision trail and check one before delivery.
//
//   node trail.cjs append <decision-trail.tsv> <phase> <decision> <reason> <evidence> <result>
//   node trail.cjs check <decision-trail.tsv> [--root <dir>]
//
// The trail is a TSV a reviewer opens in a terminal or a spreadsheet, so every
// cell stays on one line and a cell a spreadsheet would read as a formula is
// quoted. `check` proves structure and that evidence pointers resolve; whether
// the evidence shows what a row claims stays the auditor's judgement. A row a
// `correction` row supersedes keeps its evidence as written, so check skips it.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const COLUMNS = ["timestamp", "phase", "decision", "reason", "evidence", "result"];
const HEADER = COLUMNS.join("\t");

function cleanCell(value) {
  const flat = String(value).replace(/[\t\r\n]+/gu, " ").trim();
  // A leading = + - @ makes Excel and similar readers evaluate the cell.
  return /^[=+\-@]/u.test(flat) ? `'${flat}` : flat;
}

function localTimestamp(date = new Date()) {
  const pad = (n) => String(Math.abs(n)).padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  // Milliseconds keep rows appended in one batch individually nameable.
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${
    pad(date.getMinutes())}:${pad(date.getSeconds())}.${String(date.getMilliseconds()).padStart(3, "0")}${
    sign}${pad(Math.trunc(offset / 60))}:${pad(offset % 60)}`;
}

function appendRow(file, cells, now = new Date()) {
  if (cells.length !== COLUMNS.length - 1) {
    throw new Error(`append takes ${COLUMNS.length - 1} cells (${COLUMNS.slice(1).join(", ")}), got ${cells.length}`);
  }
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const row = [localTimestamp(now), ...cells.map(cleanCell)].join("\t") + "\n";
  // One write per row on an append handle, so rows from parallel writers do not interleave.
  const fd = fs.openSync(file, "a");
  try {
    const text = fs.fstatSync(fd).size === 0 ? `${HEADER}\n${row}` : row;
    fs.writeSync(fd, text);
  } finally {
    fs.closeSync(fd);
  }
  return row;
}

function parseTrail(text) {
  const lines = text.replace(/\r\n/gu, "\n").split("\n");
  if (lines.at(-1) === "") lines.pop();
  return { header: lines[0] ?? "", rows: lines.slice(1).map((line, index) => ({ line: index + 2, cells: line.split("\t") })) };
}

function gitRoot(dir) {
  const result = spawnSync("git", ["-C", dir, "rev-parse", "--show-toplevel"], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : null;
}

function evidenceTokens(cell) {
  // Backticks keep a path with spaces whole; everything else splits on separators.
  const tokens = [];
  const rest = cell.replace(/`([^`]+)`/gu, (_, quoted) => {
    tokens.push(quoted.trim());
    return " ";
  });
  for (const raw of rest.split(/[\s,;，；、]+/u)) {
    const token = raw.replace(/^[("'[<]+|[)"'\]>.。:：]+$/gu, "");
    if (token) tokens.push(token);
  }
  return tokens;
}

function classify(token, roots) {
  if (/^[a-z][a-z0-9+.-]*:\/\//iu.test(token)) return { kind: "url" };
  if (/^[0-9a-f]{7,40}$/u.test(token) && /[a-f]/u.test(token) && /[0-9]/u.test(token)) return { kind: "commit" };
  const target = token.replace(/#L\d+(-L?\d+)?$/u, "").replace(/:\d+(-\d+)?$/u, "");
  const explicit = /^(\.{1,2}[\\/]|[\\/]|~[\\/]|[A-Za-z]:[\\/])/u.test(target);
  const named = /[^\\/]\.[A-Za-z][A-Za-z0-9]{0,9}$/u.test(target);
  const first = target.split(/[\\/]/u)[0];
  const rooted = /[\\/]/u.test(target) && first && roots.some((root) => fs.existsSync(path.join(root, first)));
  return explicit || named || rooted ? { kind: "path", target } : { kind: "text" };
}

function resolvesPath(target, roots) {
  const expanded = target.startsWith("~") ? path.join(os.homedir(), target.slice(1)) : target;
  if (path.isAbsolute(expanded)) return fs.existsSync(expanded);
  return roots.some((root) => fs.existsSync(path.join(root, expanded)));
}

function resolvesCommit(sha, repo) {
  if (!repo) return null;
  return spawnSync("git", ["-C", repo, "cat-file", "-e", `${sha}^{commit}`]).status === 0;
}

function checkTrail(file, { root } = {}) {
  const problems = [];
  const counts = { rows: 0, resolved: 0, unchecked: 0, superseded: 0 };
  const { header, rows } = parseTrail(fs.readFileSync(file, "utf8"));
  if (header !== HEADER) problems.push(`line 1: header must be ${COLUMNS.join(" | ")}`);
  const trailDir = path.dirname(path.resolve(file));
  const repo = root ? path.resolve(root) : gitRoot(trailDir);
  const roots = [trailDir, ...(repo ? [repo] : [])];
  const superseded = new Set();
  // Latest first, so a correction that a later one supersedes no longer takes effect.
  for (const { line, cells } of rows.filter((row) => row.cells[1] === "correction").reverse()) {
    if (superseded.has(line)) continue;
    for (const named of (cells[2] ?? "").match(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?/gu) ?? []) {
      const matches = rows.filter((row) => row.line !== line && row.cells[0].startsWith(named));
      if (matches.length === 1) superseded.add(matches[0].line);
      else problems.push(`line ${line} (${cells[0]}): correction names ${named}, which matches ${matches.length} rows`);
    }
  }
  for (const { line, cells } of rows) {
    counts.rows += 1;
    const where = `line ${line}${cells[0] ? ` (${cells[0]})` : ""}`;
    if (cells.length !== COLUMNS.length) {
      problems.push(`${where}: ${cells.length} cells, expected ${COLUMNS.length}`);
      continue;
    }
    if (Number.isNaN(Date.parse(cells[0]))) problems.push(`${where}: timestamp does not parse`);
    for (const [index, name] of COLUMNS.entries()) {
      if (name !== "reason" && !cells[index].trim()) problems.push(`${where}: empty ${name}`);
    }
    if (superseded.has(line)) {
      counts.superseded += 1;
      continue;
    }
    for (const token of evidenceTokens(cells[4])) {
      const found = classify(token, roots);
      if (found.kind === "text") continue;
      if (found.kind === "url") {
        counts.unchecked += 1;
        continue;
      }
      const ok = found.kind === "commit" ? resolvesCommit(token, repo) : resolvesPath(found.target, roots);
      if (ok === null) counts.unchecked += 1;
      else if (ok) counts.resolved += 1;
      else problems.push(`${where}: evidence does not resolve: ${token}`);
    }
  }
  return { problems, counts };
}

function main(argv) {
  const [command, file, ...rest] = argv;
  if (command === "append" && file) {
    process.stdout.write(appendRow(file, rest));
    return 0;
  }
  if (command === "check" && file) {
    const rootIndex = rest.indexOf("--root");
    const { problems, counts } = checkTrail(file, { root: rootIndex >= 0 ? rest[rootIndex + 1] : undefined });
    for (const problem of problems) process.stdout.write(`FAIL: ${problem}\n`);
    if (!problems.length) {
      process.stdout.write(`PASS: ${counts.rows} rows, ${counts.resolved} evidence pointers resolve, ${
        counts.unchecked} not checkable here (URLs, or commits outside a repository), ${
        counts.superseded} superseded rows skipped\n`);
    }
    return problems.length ? 1 : 0;
  }
  process.stderr.write(
    "usage: trail.cjs append <decision-trail.tsv> <phase> <decision> <reason> <evidence> <result>\n" +
    "       trail.cjs check <decision-trail.tsv> [--root <dir>]\n",
  );
  return 2;
}

if (require.main === module) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`trail.cjs: ${error.message}\n`);
    process.exitCode = 2;
  }
}

module.exports = { COLUMNS, appendRow, checkTrail, cleanCell, evidenceTokens, localTimestamp };
