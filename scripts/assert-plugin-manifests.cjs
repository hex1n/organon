#!/usr/bin/env node

// Keep the two plugin manifests and the two marketplaces describing one plugin.
//
// Claude Code and Codex each read their own manifest, and an update reaches a
// GitHub install only when `version` rises. A release that bumps one manifest
// ships a new version to one runtime and leaves the other on the old one.

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

function readJson(relative, failures) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
  } catch (error) {
    failures.push(`${relative}: ${error.message}`);
    return null;
  }
}

function check() {
  const failures = [];
  const claudeMarket = readJson(".claude-plugin/marketplace.json", failures);
  const codexMarket = readJson(".agents/plugins/marketplace.json", failures);
  if (!claudeMarket || !codexMarket) return { failures };

  const claudeEntry = claudeMarket.plugins?.[0];
  const codexEntry = codexMarket.plugins?.[0];
  const claudeSource = claudeEntry?.source;
  const codexSource = codexEntry?.source?.path;
  if (claudeMarket.plugins?.length !== 1 || codexMarket.plugins?.length !== 1) {
    failures.push("each marketplace lists exactly one plugin");
  }
  if (claudeSource !== codexSource) failures.push(`marketplace sources differ: ${claudeSource} vs ${codexSource}`);
  if (claudeEntry?.name !== codexEntry?.name) failures.push(`marketplace plugin names differ: ${claudeEntry?.name} vs ${codexEntry?.name}`);
  if (!claudeSource) return { failures };

  const pluginDir = path.normalize(claudeSource);
  const claude = readJson(path.join(pluginDir, ".claude-plugin", "plugin.json"), failures);
  const codex = readJson(path.join(pluginDir, ".codex-plugin", "plugin.json"), failures);
  if (!claude || !codex) return { failures };

  for (const field of ["name", "version", "description"]) {
    if (claude[field] !== codex[field]) failures.push(`plugin ${field} differs: ${claude[field]} vs ${codex[field]}`);
  }
  if (claude.name !== claudeEntry.name) failures.push(`marketplace names ${claudeEntry.name}, manifest names ${claude.name}`);

  const skillsDir = path.join(ROOT, pluginDir, codex.skills ?? "skills");
  const skills = fs.existsSync(skillsDir)
    ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
    : [];
  if (!skills.length) failures.push(`${path.relative(ROOT, skillsDir)} holds no skills`);
  for (const skill of skills) {
    if (!fs.existsSync(path.join(skillsDir, skill, "SKILL.md"))) failures.push(`${skill} has no SKILL.md`);
  }
  return { failures, name: claude.name, version: claude.version, skills: skills.length };
}

function main() {
  const { failures, name, version, skills } = check();
  for (const failure of failures) process.stdout.write(`FAIL: ${failure}\n`);
  if (!failures.length) process.stdout.write(`PASS: ${name} ${version}, ${skills} skills, manifests and marketplaces agree\n`);
  process.exitCode = failures.length ? 1 : 0;
}

if (require.main === module) main();

module.exports = { check };
