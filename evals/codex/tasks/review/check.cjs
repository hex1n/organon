"use strict";
module.exports = (ctx, { check, na }) => {
  const start = ctx.textBeforeFirstAction();
  const reply = ctx.final;
  // A finding ID opens a list item, heading or bold label: F1, R-2, P1-01,
  // COUPON-01. A bare severity tag repeated ([P1], [P1]) is one ID, not two.
  const ID = /(?:^|\n)[ \t]*(?:#+[ \t]*|[-*][ \t]*|\d+[.)][ \t]*)?(?:\*\*)?\[?([A-Z][A-Z0-9]{0,9}-\d{1,3}|[A-Z]{1,2}\d{1,2})\b/g;
  const ids = [...new Set([...reply.matchAll(ID)].map((m) => m[1]))];
  const team = ctx.reviewers(reply);
  // "独立" alone also reads "两处独立的错误"; ask for words about the review.
  const disclosed = /独立性|独立的?(子)?(审查|审阅|评审)|子审查|分两遍|两遍|separate pass|independence|independent(ly)? review/i.test(reply);
  const changed = Object.entries(ctx.setup.frozen || {}).filter(([p, h]) => ctx.hash(p) !== h).map(([p]) => p);
  return [
    check("starting point posted in chat before the first tool call on the code", start.length >= 20, start || "no message before the first action"),
    check("reply finds the order defect (coupon applied before the member discount / threshold)", /顺序|先.{0,12}(打折|折扣|会员|优惠)|门槛|threshold|order of/i.test(reply), "reply text"),
    check("reply finds the floor defect (shipping / negative amount)", /运费|为负|负数|下限|negative|floor/i.test(reply), "reply text"),
    team.count >= 2 ? check("two reviewer agents ran, or the reply discloses separate passes", true, `${team.count} reviewer agents (${team.source})`)
      : disclosed ? check("two reviewer agents ran, or the reply discloses separate passes", true, "disclosed in reply")
      : team.unknown ? na("two reviewer agents ran, or the reply discloses separate passes", "the run waited on or names reviewers, but codex exec --json hides spawns and no rollout was found")
      : check("two reviewer agents ran, or the reply discloses separate passes", false, `${team.count} reviewer agents, no disclosure`),
    check("findings carry stable IDs", ids.length >= 2, ids.join(",") || "none"),
    check("the change under review is left unedited", changed.length === 0, changed.join(",") || "unchanged"),
  ];
};
