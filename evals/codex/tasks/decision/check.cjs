"use strict";
module.exports = (ctx, { check }) => {
  const adr = ctx.glob(/^docs\/decisions\/0003[^/]*\.md$/);
  const trail = ctx.commands().filter((c) => /trail\.cjs/.test(c));
  return [
    check("ADR 0003 is written in docs/decisions", adr.length > 0, adr.join(", ") || ctx.glob(/^docs\/decisions\//).join(", ")),
    check("the ADR records the no-backfill edge case (不追溯)", adr.length > 0 && /追溯|backfill|历史订单/.test(ctx.read(adr[0])), "ADR text"),
    check("trail.cjs append is used", trail.some((c) => /\bappend\b/.test(c)), "commands"),
    check("trail.cjs check is run", trail.some((c) => /\bcheck\b/.test(c)), "commands"),
    check("no code is changed", !ctx.git("status", "--porcelain", "--", "billing").trim(), ctx.git("status", "--porcelain", "--", "billing").trim() || "billing/ unchanged"),
  ];
};
