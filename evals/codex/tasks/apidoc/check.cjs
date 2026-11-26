"use strict";
// The authority named in the reply: a contract/design/schema, or the code when
// none exists ("以 `feature/x`（abc1234）的代码为准"). "Based on the code at X"
// alone names evidence, not authority, so it does not count.
const AUTH = /契约|设计文档|OpenAPI|schema|代码为准|按代码|权威|contract|authorit|source of truth/i;
// Any document the run added or rewrote in docs/interfaces/, whatever its name.
const isNewDoc = (f) => /^docs\/interfaces\/[^/]+\.md$/i.test(f) && !/^docs\/interfaces\/User_API_Doc\.md$/.test(f);
module.exports = (ctx, { check }) => {
  const docs = ctx.glob(/^docs\/interfaces\//).filter(isNewDoc);
  const text = docs.length ? ctx.read(docs[0]) : "";
  const reply = ctx.final;
  const head = (ctx.setup.head || "").slice(0, 7);
  return [
    check("the order API doc sits in docs/interfaces/ beside the existing doc", docs.length > 0, docs.join(", ") || "none"),
    check("the doc keeps the existing doc's layout (通用约定, 接口列表)", text.includes("通用约定") && text.includes("接口列表"), "doc headings"),
    check("reply names the code revision the doc was written from", (head && reply.includes(head)) || /\b[0-9a-f]{7,40}\b/.test(reply), head ? `HEAD ${head}` : "reply text"),
    check("reply states the doc's authority (contract, design or code)", AUTH.test(reply), (reply.match(AUTH) || ["no match"])[0]),
  ];
};
