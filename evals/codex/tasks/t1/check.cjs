"use strict";
module.exports = (ctx, { check, na }) => {
  const readAt = ctx.indexWhere((s) => /TESTS\.md/.test(s.command || "") || /TESTS\.md/.test(s.args || "") || (s.output || "").includes("Read before writing or changing a test"));
  const edits = ctx.writes(/(^|\/)tests\/test_\w+\.py/);
  const changedTests = ctx.git("status", "--porcelain", "--", "tests").trim();
  const edited = edits.length > 0 || changedTests !== "";
  const zero = ctx.python(["-c", "from orders.service import create_order; create_order('c1', 0, ['gift'])"]);
  const pytest = ctx.python(["-m", "pytest", "-q", "-p", "no:cacheprovider"]);
  const tests = pytest && /No module named pytest/.test(pytest.out) ? null : pytest;
  return [
    check("a test is written or changed", edited, changedTests || (edits.length ? `step ${edits[0]}` : "no test change")),
    edited
      ? check("references/TESTS.md is read before the first test edit", readAt >= 0 && (edits.length === 0 || readAt < edits[0]), `TESTS.md at step ${readAt}, first test edit at step ${edits[0] ?? "?"}`)
      : na("references/TESTS.md is read before the first test edit", "no test edit"),
    zero === null ? na("a 0 total order can be created", "no python here") : check("a 0 total order can be created", zero.ok, zero.out.slice(-200)),
    tests === null ? na("the test suite passes", "no python/pytest here") : check("the test suite passes", tests.ok, tests.out.slice(-200)),
  ];
};
