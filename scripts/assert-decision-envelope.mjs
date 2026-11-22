#!/usr/bin/env node

// Pin the decision envelope that one skill writes and another reads.
//
// A skill must stay independently distributable, so each side carries its own
// copy of the envelope's YAML shape: the writer with a placeholder per field,
// the reader with the fields left blank. The copies therefore cannot match byte
// for byte. What must match is the field order and every closed vocabulary; a
// field renamed or a decision value added on one side would leave the reader
// consuming an envelope it no longer describes.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
// The field only an envelope carries; a YAML block that has it is a copy.
const ENVELOPE_FIELD = /^decision_flip_condition:/mu;

function collectMarkdown(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...collectMarkdown(full));
    else if (entry.name.endsWith(".md")) found.push(full);
  }
  return found;
}

// A value is kept only when it is a closed vocabulary; a `<placeholder>` or a
// blank is the copy's own way of leaving the field open.
function shapeOf(block) {
  return block.split(/\r?\n/u).filter((line) => line.trim() !== "").map((line) => {
    const field = /^([a-z_]+):\s*(.*)$/u.exec(line);
    if (!field) return line;
    const [, name, value] = field;
    return value === "" || value.startsWith("<") ? name : `${name}: ${value}`;
  });
}

const skillsDir = path.join(ROOT, "plugins", "organon", "skills");
const copies = [];
for (const file of fs.existsSync(skillsDir) ? collectMarkdown(skillsDir) : []) {
  const text = fs.readFileSync(file, "utf8");
  const blocks = [...text.matchAll(/```yaml\r?\n([\s\S]*?)```/gu)]
    .map((match) => match[1])
    .filter((block) => ENVELOPE_FIELD.test(block));
  if (blocks.length === 0) continue;
  const relative = path.relative(ROOT, file).replace(/\\/gu, "/");
  if (blocks.length > 1) {
    process.stdout.write(`FAIL: ${relative} carries ${blocks.length} decision envelope blocks; one copy per file\n`);
    process.exitCode = 1;
    continue;
  }
  copies.push({ relative, shape: shapeOf(blocks[0]) });
}

const [reference, ...rest] = copies;
const drifted = rest.filter((copy) => copy.shape.join("\n") !== reference.shape.join("\n"));
for (const copy of drifted) {
  const length = Math.max(reference.shape.length, copy.shape.length);
  let at = 0;
  while (at < length && reference.shape[at] === copy.shape[at]) at += 1;
  process.stdout.write(`FAIL: ${copy.relative} drifted from ${reference.relative} at envelope field ${at + 1}\n`);
  process.stdout.write(`  ${reference.relative}: ${JSON.stringify(reference.shape[at] ?? "<end of envelope>")}\n`);
  process.stdout.write(`  ${copy.relative}: ${JSON.stringify(copy.shape[at] ?? "<end of envelope>")}\n`);
}
if (drifted.length > 0) process.exitCode = 1;
if (process.exitCode !== 1) {
  process.stdout.write(copies.length < 2
    ? `PASS: ${copies.length} decision envelope ${copies.length === 1 ? "copy" : "copies"}, nothing to compare\n`
    : `PASS: ${copies.length} decision envelope copies with ${reference.shape.length} matching fields (${copies.map((copy) => copy.relative).join(", ")})\n`);
}
