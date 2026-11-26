"use strict";
const AUTH = /契约|设计文档|OpenAPI|schema|以.{0,6}代码为准|contract/i;
module.exports = (ctx, { check }) => {
  const docs = ctx.glob(/^docs\/interfaces\/.*Order.*\.md$/i);
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
