#!/usr/bin/env node

// Pin the derived-view guidance that several skills each carry a copy of.
//
// A skill must stay independently distributable, so the diagram layout and
// inspection rules are duplicated into every skill that delivers a diagram or
// interactive view, while each skill keeps its own source and scope rules
// outside the block. Unpinned, the copies drifted within one commit; here every
// copy between the two markers must match byte for byte.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OPEN = "<!-- >>> shared-derived-views -->";
const CLOSE = "<!-- <<< shared-derived-views -->";

function collectMarkdown(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...collectMarkdown(full));
    else if (entry.name.endsWith(".md")) found.push(full);
  }
  return found;
}

const skillsDir = path.join(ROOT, "plugins", "organon", "skills");
const copies = [];
for (const file of fs.existsSync(skillsDir) ? collectMarkdown(skillsDir) : []) {
  const text = fs.readFileSync(file, "utf8");
  const start = text.indexOf(OPEN);
  const end = text.indexOf(CLOSE);
  if (start === -1 && end === -1) continue;
  const relative = path.relative(ROOT, file).replace(/\\/gu, "/");
  if (start === -1 || end === -1 || end < start || text.indexOf(OPEN, start + 1) !== -1) {
    process.stdout.write(`FAIL: ${relative} needs exactly one balanced shared-derived-views block\n`);
    process.exitCode = 1;
    continue;
  }
  copies.push({ relative, block: text.slice(start, end + CLOSE.length) });
}

if (copies.length === 0) {
  process.stdout.write("PASS: no shared derived-view blocks to pin\n");
} else {
  const [reference, ...rest] = copies;
  const drifted = rest.filter((copy) => copy.block !== reference.block);
  for (const copy of drifted) {
    const left = reference.block.split("\n");
    const right = copy.block.split("\n");
    const at = left.findIndex((line, index) => line !== right[index]);
    process.stdout.write(`FAIL: ${copy.relative} drifted from ${reference.relative} at block line ${at + 1}\n`);
    process.stdout.write(`  ${reference.relative}: ${JSON.stringify(left[at] ?? "<end of block>")}\n`);
    process.stdout.write(`  ${copy.relative}: ${JSON.stringify(right[at] ?? "<end of block>")}\n`);
  }
  if (drifted.length > 0) process.exitCode = 1;
  else process.stdout.write(`PASS: ${copies.length} identical shared derived-view blocks (${copies.map((copy) => copy.relative).join(", ")})\n`);
}
