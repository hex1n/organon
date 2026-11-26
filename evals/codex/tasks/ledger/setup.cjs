"use strict";
// Four backdated commits: the import, the first week of reconcile logs, the
// 11-16 rounding refactor in fx.py, then the logs that show the drift.
const fs = require("node:fs");
const path = require("node:path");

module.exports = ({ dir, fixture, git, commit, edit }) => {
  const logs = path.join(dir, "logs");
  const all = fs.readdirSync(logs).sort();
  fs.rmSync(logs, { recursive: true, force: true });
  git(["add", "-A"]);
  commit("billing: initial import", { name: "dana", date: "2026-11-01T10:00:00" });
  fs.mkdirSync(logs);
  const copy = (names) => names.forEach((n) => fs.copyFileSync(path.join(fixture, "logs", n), path.join(logs, n)));
  copy(all.filter((n) => /reconcile-2026-11-1[0-5]\.log$/.test(n)));
  git(["add", "logs"]);
  commit("logs: reconcile 11-10..11-15", { name: "ci-bot", date: "2026-11-15T23:50:00" });
  edit(path.join(dir, "billing/fx.py"), [
    ["from .rounding import bank_round", "from .rounding import half_up  # unify with checkout display rounding"],
    ["return bank_round(amount_usd", "return half_up(amount_usd"],
  ]);
  git(["add", "billing/fx.py"]);
  commit("refactor(fx): use the same rounding helper as checkout display", { name: "milo", date: "2026-11-16T15:20:00" });
  copy(all);
  git(["add", "logs"]);
  commit("logs: reconcile 11-16..11-23", { name: "ci-bot", date: "2026-11-23T23:50:00" });
};
