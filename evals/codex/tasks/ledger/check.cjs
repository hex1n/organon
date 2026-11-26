"use strict";
module.exports = (ctx, { check }) => {
  const plan = ctx.textBeforeFirstAction();
  const planLike = plan.length >= 30 && /计划|步骤|先|证据|来源|plan|git|日志|log|代码|code|文档|doc|ADR/i.test(plan);
  const sha = ctx.git("log", "--format=%h", "-1", "--grep=refactor(fx)", "--fixed-strings").trim();
  const reply = ctx.final;
  const commitNamed = (sha && reply.includes(sha.slice(0, 7))) || /refactor\(fx\)|half[_-]?up|四舍五入|bank[_-]?round|银行家/i.test(reply);
  return [
    check("plan posted in chat before the first tool call on the subject", planLike, plan || "no message before the first action"),
    check("reply names the rounding change in fx.py as the cause", commitNamed, sha ? `commit ${sha}` : "commit not found in fixture"),
    check("reply names EUR as affected", /EUR|欧元/.test(reply), "reply text"),
  ];
};
