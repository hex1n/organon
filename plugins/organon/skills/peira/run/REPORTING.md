# Report and delivery

Keep one canonical report, `{yyyy-mm-dd}-{feature}-e2e-test-report.md` in the run directory,
mirroring the plan's name; it is the default home for the run's facts.
Apply the language policy in [RUN.md](RUN.md); only identifiers, closed status
vocabularies, commands, and quoted evidence retain their original spelling.

Write Chinese and English reports in [report/v1](#format-reportv1). Its case
headings own the selected IDs and verdicts; the renderer derives the counts and
comparison table. Keep the business conclusion and full evidence in this Markdown,
without a second data model.

## Canonical report

### Conclusion and counts

Lead with the observed business outcome: what works, fails, or remains unknown,
the affected object and material impact, then the next action or decision. A reader
should understand this opening without knowing the test's formulas or assertion
vocabulary. Explain the scope and authority of passing checks after that outcome;
matching a planned formula establishes that check, not the formula's business
correctness. When later evidence reveals a defect, lead with it while preserving
the earlier check results and their original expectations.

Account for `passed`, `failed`, `blocked`, `unverified`, and `skipped` from the
selected-scenario records; report/v1 generates their counts in HTML, while other
formats include them explicitly. An all-pass conclusion requires a
nonempty selection with every selected scenario passed; zero selected scenarios and
all-skipped runs are never successful runs. Scope that conclusion to the selection.
State which requested business outcomes remain untested or blocked, even when every
executed case passed; scenario counts do not establish feature coverage.

### Contents

Group the following facts into a short report. They are required information;
their grouping is yours: merge small groups and leave out details that do not
apply.

| Information | Content |
|---|---|
| Run context | Selected IDs and exclusions, local/test target and actual build/source identity, relevant harness/runtime and real/double boundary, source plan path/hash, timing, and prior run/overrides when present. |
| Scenario results | One record per selected scenario or variant ID: ID, terminal status, oracle, expected, actual, evidence link, and diagnosis when there is a deficit. Distinct assertions within a bundled case remain distinguishable. |
| Evidence and findings | Per-scenario proof from `RUN.md`, raw output or its attachment, and each root cause once with affected IDs, disposition, and next step. Shared command output is retained once and referenced by assertion. |
| Continuation and state | Exact rerun command or recorded adapter sequence, next actionable work, and actual cleanup/retention state. A read-only run can state that no business data changed; writes name owner, retained IDs/TTL, recovery/cleanup invocation, and observed cleanup receipt. |

Link artifacts inside this feature's `e2e/` tree. Cite outside artifacts as path
text, including the recorded hash when consumed. Preserve historical Markdown
when its links no longer satisfy rendering checks; withhold its HTML instead
of rewriting history.

A verdict row should explain the expected/actual difference without joining multiple
documents. Link its detail directly. Source and deployment facts need one home; reuse
that record for provenance and state resumption instead of copying it into several
ledgers. If an existing downstream consumer requires a named schema, retain that
schema for this handoff and name the consumer.

Before delivery, recheck the upstream hash. If it changed, keep the consumed revision
and expectations explicit; reconcile changed source facts without rewriting the
observed result.

## Format (report/v1)

The bundled renderer builds the HTML view straight from this Markdown; it invokes
no model and decides no business outcome. Start from this shape:

```markdown
<!-- e2e-reader: report/v1 -->
# 提交处理验证报告

结果记录缺失，业务验证未通过。问题及下一步见 [F01](#issue-F01)。

## E01 [failed] 提交一次处理请求

任务已完成，但预期结果记录未生成。[F01](#issue-F01) 待修复决定。

### 预期与实际

| 字段 | 预期 | 实际 |
|---|---|---|
| record | 存在 | null |

完整输入、独立期望及证据写在本例；共享环境见 [运行上下文](#shared-context)。
资料来源：[原始响应](attachments/response.json)。

## issue:F01 [OPEN] 结果记录未生成

任务报告成功但未写结果表，下游读不到。记录：[F01](issues/F01-missing-record.md)

## shared:context 运行上下文与保留现场

本段适用于 E01；记录实际环境、版本、权限、保留状态及继续方式。
```

- **Marker and opening.** Line one is the marker and sets the page's language:
  as shown for Chinese labels, `<!-- e2e-reader: report/v1 lang=en -->` for English;
  write the prose in the same language. Line two is the title. The introduction
  states the business outcome, significant issues, and next action.
- **Cases.** Each selected scenario or variant ID has one `## ID [status] name`
  heading with the status RUN.md assigned. Its first paragraph is the business
  result the comparison table shows; the rest holds the full effective contract,
  actual evidence, authority, and lifecycle.
- **Issues.** Each issue record of this run has one `## issue:ID [DISPOSITION] title`
  section with a disposition from [Defect Handoffs](ISSUES.md#defect-handoffs); its
  body carries the business impact and the link to the record. Cases link
  `#issue-ID`, and the renderer fills each issue's affected scenarios from those
  links. Another run's issue is cited as context and needs no section here.
- **Shared sections.** `## shared:ID Title` holds facts several cases use. Each
  inheriting case links `#shared-ID` and states how it applies.
- **IDs.** ASCII letters, then letters, digits, underscores, or hyphens; a case ID
  may add dot-separated segments, so a plan variant such as `ORD-02.B1` keeps its
  ID. Every ID is unique. Level-three to level-six headings organize a case's body.
- **Markdown subset.** Paragraphs, flat `-` lists, headings, fenced code, pipe
  tables with outer pipes, inline code, `**bold**`, `*emphasis*`, inline links, and
  local images. The renderer rejects what it cannot represent and names it; adapt
  the source, moving evidence with literal pipes or nesting into a code block.

A report in another language, or one without the marker, keeps its Markdown and
has no view.

## Render and check

```text
python <skill>/scripts/render_report.py <report.md> --output <report.html>
```

Python 3.10+ and its standard library suffice. Output defaults to the same-stem
HTML beside the report. A successful call returns the source hash, selected IDs,
issue IDs, computed counts, and checked-link count; it certifies neither business
correctness nor browser appearance. Local link targets must exist. They are
emitted as absolute file URLs, so the page can move on the same machine but is
not a bundled export.

On failure, fix the input the error names. A failed validation leaves an existing
HTML untouched, and that page is stale. If the format cannot represent the source
faithfully, deliver the Markdown with the rendering gap. Rendering never changes a
verdict.

Regenerate the view when its source changes; historical runs keep theirs. Review
business expectations and conclusions against their evidence when they change,
then inspect the opening and the longest affected case in a browser. Open the
page when the session can and return its absolute path. Check results, screenshots,
and DOM dumps stay outside the page: in OS temp, or in the run's attachments when
they are evidence.

## Issue records

Reconcile findings with the local files required by
[Defect Handoffs](ISSUES.md#defect-handoffs). Link each issue from the report's
finding summary and affected scenario results; each issue links back to its source
run and evidence. Keep the report's business conclusion and expected/actual summary
readable without opening the issue file. Finding counts and scenario counts differ.

## Additional artifacts

Create only artifacts with a concrete consumer or payload need:

- `attachments/` for large raw output, screenshots, or binary evidence that would
  obscure the proof chain; retain an inline summary and precise pointer.
- `plan-snapshot.md` for otherwise unavailable source facts or complex derived mechanics
  that must be reused. Ordinary resolved commands and inputs fit in the report.
- Machine-readable metadata/results only for a named machine consumer; they project
  the canonical facts, not a second independent verdict.

A rerun uses a fresh continuation directory. Its instructions are the project's
existing commands or the recorded adapter sequence, replayed step by step with each
result inspected before dependent actions or cleanup.

## Final reconciliation

Check selection → results and results → selection, resolving every cited scenario,
root-cause, issue, or evidence reference. Mark references to upstream-only scenarios
as such. Preserve attempted failures and blockers even if later attempts passed.
Every finding requiring resolution has an existing issue file with matching ID,
affected cases and disposition; verify report-to-issue and issue-to-source links.
Cleanup claims require their observed receipt and independent absence/restoration
proof; unresolved evidence or lifecycle obligations remain visible.

Read the opening on its own: it must identify the business outcome and impact,
retain material uncertainty, and agree with both the scenario results and later
findings. Counts or statements that assertions passed do not satisfy this check.

Link the report and useful raw attachments. Summarize every nonzero status count,
actionable findings, blockers, and retained data.
