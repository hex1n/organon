#!/usr/bin/env node

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SKILLS = path.join(ROOT, "plugins", "organon", "skills");
const require = createRequire(new URL("./skill-validation/package.json", import.meta.url));
const { isMap, parseDocument } = require("yaml");

const delimiter = /^---[ \t]*$/u;

function checkFrontmatter(source) {
  const [opening, ...lines] = source.split(/\r?\n/u);
  const end = lines.findIndex((line) => delimiter.test(line));
  if (!delimiter.test(opening) || end === -1) {
    throw new Error("expected a YAML frontmatter block delimited by standalone --- lines");
  }

  const document = parseDocument(lines.slice(0, end).join("\n"), {
    strict: true,
    uniqueKeys: true,
  });
  if (document.errors.length) throw document.errors[0];
  if (!isMap(document.contents)) throw new Error("frontmatter must be a mapping");

  const metadata = document.toJS();
  for (const field of ["name", "description"]) {
    if (!Object.hasOwn(metadata, field) ||
        typeof metadata[field] !== "string" || !metadata[field].trim()) {
      throw new Error(`${field} must be a nonempty string`);
    }
  }
}

const files = fs.readdirSync(SKILLS, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name === "SKILL.md")
  .map((entry) => path.join(entry.parentPath, entry.name))
  .sort();

if (!files.length) {
  process.stderr.write(`FAIL: no SKILL.md files in ${path.relative(ROOT, SKILLS)}\n`);
  process.exitCode = 1;
}

for (const file of files) {
  try {
    checkFrontmatter(fs.readFileSync(file, "utf8"));
  } catch (error) {
    process.stderr.write(`FAIL: ${path.relative(ROOT, file)}: ${error.message}\n`);
    process.exitCode = 1;
  }
}
if (!process.exitCode) {
  process.stdout.write(`PASS: ${files.length} skill frontmatter blocks\n`);
}
