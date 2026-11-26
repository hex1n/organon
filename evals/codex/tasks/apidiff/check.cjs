"use strict";
// The authority named in the reply: a contract/design/schema, or the code when
// none exists ("以 `feature/x`（abc1234）的代码为准"). "Based on the code at X"
// alone names evidence, not authority, so it does not count.
const AUTH = /契约|设计文档|OpenAPI|schema|代码为准|按代码|权威|contract|authorit|source of truth/i;
// Any document the run added or rewrote in docs/interfaces/, whatever its name.
const isNewDoc = (f) => /^docs\/interfaces\/[^/]+\.md$/i.test(f) && !/^docs\/interfaces\/User_API_Doc\.md$/.test(f);
module.exports = (ctx, { check }) => {
  const docs = ctx.glob(/^docs\/interfaces\//).filter(isNewDoc);
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
