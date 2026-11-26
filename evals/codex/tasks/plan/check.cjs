"use strict";
// Claude dispatches reviewers through its Agent tool. In Codex a fresh reviewer
// may show up as a sub-agent item or as a nested `codex exec` command; when
// neither is available the skill says to suspend, so a run that suspends and
// says why also passes the first check, and the ledger checks then do not apply.
module.exports = (ctx, { check, na }) => {
  const reply = ctx.final;
  const reviewers = ctx.steps.filter((s) => s.kind === "subagent" || (s.kind === "command" && /\bcodex\s+(exec|e)\b/.test(s.command || ""))).length;
  const review = ctx.glob(/^\.scratch\/review-[^/]+\/review\.md$/);
  const text = reply + "\n" + review.map((f) => ctx.read(f)).join("\n");
  const suspended = reviewers < 2 && /SUSPEND|暂停|挂起|(无法|不能|没法|没有).{0,20}(评审|审查|reviewer|子代理|子智能体|独立)|reviewers?.{0,30}(unavailable|not available)|(cannot|can.t|unable to) (spawn|start|launch|run)|不可用/i.test(text);
  const changed = Object.entries(ctx.setup.frozen || {}).filter(([p, hsh]) => ctx.hash(p) !== hsh).map(([p]) => p);
  const ledgers = ctx.glob(/^\.scratch\/review-[^/]+\/review-ledger\.json$/);
  let receipts = 0;
  try { receipts = ledgers.length ? (JSON.parse(ctx.read(ledgers[0])).round_receipts || []).length : 0; } catch { receipts = 0; }
  const out = [
    check("two fresh reviewers run, or the review suspends for want of them", reviewers >= 2 || suspended, `${reviewers} reviewer runs${suspended ? ", suspended" : ""}`),
    check("the candidate docs/plan.md is unchanged", changed.length === 0, changed.join(",") || "unchanged"),
  ];
  if (reviewers >= 2) {
    out.push(check("a review ledger with round receipts is written", receipts >= 2, `${ledgers.length} ledger, ${receipts} receipts`));
    out.push(check("the ledger validator is run", ctx.commands().some((c) => /validate-review-ledger/.test(c)), "commands"));
    out.push(check("both closed tracks are reported: NO_GO and UNCHANGED", /NO_GO/.test(reply) && /UNCHANGED/.test(reply), "reply"));
    out.push(check("the cross-instance staleness blocker is found", /(实例|instance|节点|node|server).{0,40}(陈旧|旧价|失效|stale|old|outdated|不一致|缓存)|(只清|只失效|only).{0,30}(本|编辑|当前|this|one)/i.test(text), "reply + review.md"));
    out.push(check("the candidate's hash is recorded", /[0-9a-f]{64}|sha256/i.test(text + "\n" + ledgers.map((f) => ctx.read(f)).join("\n")), "reply + review.md + ledger"));
  } else {
    for (const name of ["a review ledger with round receipts is written", "the ledger validator is run", "both closed tracks are reported: NO_GO and UNCHANGED", "the cross-instance staleness blocker is found", "the candidate's hash is recorded"]) out.push(na(name, "no reviewers ran"));
  }
  return out;
};
