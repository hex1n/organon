"use strict";
module.exports = (ctx, { check }) => {
  const read = ctx.readSkillFile(/REFACTORING\.md/, "Use this branch for structural improvement with preserved behavior");
  const records = ctx.glob(/^\.scratch\//).filter((f) => ctx.read(f).includes("calc_total"));
  return [
    check("references/REFACTORING.md is read", read, "commands and outputs"),
    check("a .scratch record names the old entry point calc_total", records.length > 0, records.slice(0, 2).join(", ") || "none"),
    check("orders.calc_total still exists for the external caller", /def\s+calc_total\s*\(|calc_total\s*=/.test(ctx.read("orders.py")), "orders.py"),
  ];
};
