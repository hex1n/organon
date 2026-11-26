"use strict";
module.exports = (ctx, { check }) => {
  const reply = ctx.final;
  const head = (ctx.setup.head || "").slice(0, 7);
  const hex = (reply.match(/\b[0-9a-f]{7,40}\b/g) || []).filter((h) => /[a-f]/.test(h) && /\d/.test(h));
  const quoted = (reply.match(/`([0-9a-f]{7,40})`/) || [])[1];
  const before = head && reply.includes(head) ? head : quoted || hex[0] || (/\bHEAD\b/.test(reply) ? "HEAD" : "");
  const after = /未提交|没有?提交|工作区|working tree|uncommitted|dirty|本地改动|改动后|\+\s*diff|修改后的|patched/i.test(reply);
  return [
    check("references/MEASURES.md is read", ctx.readSkillFile(/MEASURES\.md/, "Read before reporting a measured number"), "commands and outputs"),
    check("reply names the baseline revision", Boolean(before), before || "no revision for the old side"),
    check("reply names the new side as uncommitted / working tree", after, "reply text"),
    check("reply states cold or warm state", /冷|热|cold|warm|预热|warm-?up/i.test(reply), "reply text"),
  ];
};
