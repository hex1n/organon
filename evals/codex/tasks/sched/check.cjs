"use strict";
// The Value Gate section starts near line 130 of arche/REFERENCE.md. A read
// counts when the output carries its opening sentence, when a command searches
// for "Value Gate" in that file, or when it prints the file whole or a range
// that covers the section.
function coversGate(cmd) {
  if (!/arche[\\/]REFERENCE\.md/.test(cmd)) return false;
  if (/value gate/i.test(cmd)) return true;
  const range = cmd.match(/sed -n ['"]?(\d+),(\d+)p/);
  if (range) return Number(range[1]) <= 140 && Number(range[2]) >= 134;
  const head = cmd.match(/head -(?:n\s*)?(\d+)/);
  if (head) return Number(head[1]) >= 134;
  return /\b(cat|type|Get-Content|nl|less|more|bat)\b/.test(cmd);
}

module.exports = (ctx, { check }) => {
  const reply = ctx.final;
  const gate = ctx.steps.some((s) => (s.output || "").includes("Value Gate asks whether the winner beats the status quo") || coversGate(s.command || "") || coversGate(s.args || ""));
  return [
    check("the Value Gate section of arche/REFERENCE.md is read", gate, "commands and outputs"),
    check("reply recommends against building a scheduler now", /不建议|不要自建|不值得|先不|暂不|不自建|status quo|保持|维持现状/.test(reply), reply.slice(0, 80)),
    check("reply puts failure alerting / monitoring first", /告警|监控|alert|MAILTO|失败通知/i.test(reply), "reply text"),
  ];
};
