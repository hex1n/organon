"use strict";
const AUTH = /契约|设计文档|OpenAPI|schema|以.{0,6}代码为准|contract/i;
module.exports = (ctx, { check }) => {
  const docs = ctx.glob(/^docs\/interfaces\/.*Order.*\.md$/i);
  const reply = ctx.final;
  const head = (ctx.setup.head || "").slice(0, 7);
  const body = reply + "\n" + docs.map((d) => ctx.read(d)).join("\n");
  return [
    check("COMPATIBILITY.md is read", ctx.readSkillFile(/COMPATIBILITY\.md/, "For a document describing changes to an interface"), "commands and outputs"),
    check("the change document sits in docs/interfaces/", docs.length > 0, docs.join(", ") || "none"),
    check("reply or doc flags the incompatible changes", /不兼容|breaking|破坏|必须改|要改|出问题|出错/i.test(body), "reply + doc"),
    check("reply or doc names remark -> note", /remark/.test(body) && /\bnote\b/.test(body), "reply + doc"),
    check("reply names the code revision", (head && reply.includes(head)) || /\b[0-9a-f]{7,40}\b/.test(reply), head ? `HEAD ${head}` : "reply text"),
    check("reply states the doc's authority", AUTH.test(reply), (reply.match(AUTH) || ["no match"])[0]),
  ];
};
