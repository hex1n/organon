"use strict";
module.exports = (ctx, { check }) => {
  const pre = ctx.textBeforeFirstAction();
  const h = ctx.read("docs/verify/HARNESS.md");
  const secs = ["Launch", "Doctor", "Drive", "Evidence", "Cleanup"].filter((s) => new RegExp("^#+.*" + s, "mi").test(h));
  const runs = [...new Set(ctx.glob(/^\.scratch\/[^/]+\/e2e\/runs\/[^/]+\//).map((f) => f.split("/").slice(0, 5).join("/")))];
  const features = ctx.glob(/^docs\/verify\/features\/[^/]+\.md$/);
  return [
    check("mode and starting point are stated before the first tool call", /harness/i.test(pre), pre || "no message before the first action"),
    check("docs/verify/HARNESS.md has a targets table and the five sections", h && secs.length === 5 && h.includes("|"), `sections ${secs.join(",")}`),
    check("the proof run is saved under .scratch/{feature}/e2e/runs/{stamp}/", runs.length > 0, runs.slice(0, 2).join(", ") || "none"),
    check("HARNESS.md links that run record", /\.scratch\/[^)\s`]*\/e2e\/runs\//.test(h), "HARNESS.md text"),
    check("docs/verify/features/index.md and a feature file are written", features.includes("docs/verify/features/index.md") && features.length >= 2, features.join(", ") || "none"),
    check("claims carry a dated verified status", /verified\**\s+20\d\d-\d\d-\d\d/i.test(h), "HARNESS.md text"),
  ];
};
