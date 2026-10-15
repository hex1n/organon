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

  // Claude reads hooks/hooks.json, Codex reads the hooks block in its manifest;
  // both must register the same events and run scripts that ship in the plugin.
  const claudeHooks = fs.existsSync(path.join(ROOT, pluginDir, "hooks", "hooks.json"))
    ? readJson(path.join(pluginDir, "hooks", "hooks.json"), failures)?.hooks ?? {}
    : {};
  const codexHooks = codex.hooks?.hooks ?? {};
  const events = (hooks) => Object.keys(hooks).sort().join(", ");
  if (events(claudeHooks) !== events(codexHooks)) {
    failures.push(`hook events differ: Claude [${events(claudeHooks)}] vs Codex [${events(codexHooks)}]`);
  }
  for (const hooks of [claudeHooks, codexHooks]) {
    for (const handler of Object.values(hooks).flat().flatMap((group) => group.hooks ?? [])) {
      for (const command of [handler.command, handler.commandWindows].filter(Boolean)) {
        // Each runtime substitutes its own placeholder in the command text; Codex
        // spawns the command without a shell, so $VAR and %VAR% stay literal.
        const placeholder = hooks === claudeHooks ? "${CLAUDE_PLUGIN_ROOT}" : "${PLUGIN_ROOT}";
        const quoted = /"([^"]+)"/u.exec(command)?.[1] ?? "";
        const script = quoted.startsWith(placeholder + "/") ? quoted.slice(placeholder.length + 1) : null;
        if (!script || !fs.existsSync(path.join(ROOT, pluginDir, ...script.split(/[\\/]/u)))) {
          failures.push(`hook command runs no script inside the plugin: ${command}`);
        }
      }
    }
  }

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
