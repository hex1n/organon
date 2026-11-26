# Codex probe results

codex: codex-cli 0.172.0
invoke: `$organon:{skill} {prompt}`
runs: 44, all checks passed: 31

| task | model | check | passed |
|---|---|---|---|
| apidiff | gpt-6.2-astra | COMPATIBILITY.md is read | 2/2 |
| apidiff | gpt-6.2-astra | the change document sits in docs/interfaces/ | 2/2 |
| apidiff | gpt-6.2-astra | reply or doc flags the incompatible changes | 2/2 |
| apidiff | gpt-6.2-astra | reply or doc names remark -> note | 2/2 |
| apidiff | gpt-6.2-astra | reply names the code revision | 2/2 |
| apidiff | gpt-6.2-astra | reply states the doc's authority | 2/2 |
| apidiff | gpt-6.2-sol | COMPATIBILITY.md is read | 2/2 |
| apidiff | gpt-6.2-sol | the change document sits in docs/interfaces/ | 1/2 |
| apidiff | gpt-6.2-sol | reply or doc flags the incompatible changes | 1/2 |
| apidiff | gpt-6.2-sol | reply or doc names remark -> note | 2/2 |
| apidiff | gpt-6.2-sol | reply names the code revision | 2/2 |
| apidiff | gpt-6.2-sol | reply states the doc's authority | 0/2 |
| apidoc | gpt-6.2-astra | the order API doc sits in docs/interfaces/ beside the existing doc | 2/2 |
| apidoc | gpt-6.2-astra | the doc keeps the existing doc's layout (通用约定, 接口列表) | 2/2 |
| apidoc | gpt-6.2-astra | reply names the code revision the doc was written from | 2/2 |
| apidoc | gpt-6.2-astra | reply states the doc's authority (contract, design or code) | 2/2 |
| apidoc | gpt-6.2-sol | the order API doc sits in docs/interfaces/ beside the existing doc | 2/2 |
| apidoc | gpt-6.2-sol | the doc keeps the existing doc's layout (通用约定, 接口列表) | 2/2 |
| apidoc | gpt-6.2-sol | reply names the code revision the doc was written from | 2/2 |
| apidoc | gpt-6.2-sol | reply states the doc's authority (contract, design or code) | 0/2 |
| decision | gpt-6.2-astra | ADR 0003 is written in docs/decisions | 2/2 |
| decision | gpt-6.2-astra | the ADR records the no-backfill edge case (不追溯) | 2/2 |
| decision | gpt-6.2-astra | trail.cjs append is used | 2/2 |
| decision | gpt-6.2-astra | trail.cjs check is run | 2/2 |
| decision | gpt-6.2-astra | no code is changed | 2/2 |
| decision | gpt-6.2-sol | ADR 0003 is written in docs/decisions | 2/2 |
| decision | gpt-6.2-sol | the ADR records the no-backfill edge case (不追溯) | 2/2 |
| decision | gpt-6.2-sol | trail.cjs append is used | 2/2 |
| decision | gpt-6.2-sol | trail.cjs check is run | 2/2 |
| decision | gpt-6.2-sol | no code is changed | 2/2 |
| harness | gpt-6.2-astra | mode and starting point are stated before the first tool call | 2/2 |
| harness | gpt-6.2-astra | docs/verify/HARNESS.md has a targets table and the five sections | 2/2 |
| harness | gpt-6.2-astra | the proof run is saved under .scratch/{feature}/e2e/runs/{stamp}/ | 2/2 |
| harness | gpt-6.2-astra | HARNESS.md links that run record | 2/2 |
| harness | gpt-6.2-astra | docs/verify/features/index.md and a feature file are written | 2/2 |
| harness | gpt-6.2-astra | claims carry a dated verified status | 2/2 |
| harness | gpt-6.2-sol | mode and starting point are stated before the first tool call | 2/2 |
| harness | gpt-6.2-sol | docs/verify/HARNESS.md has a targets table and the five sections | 2/2 |
| harness | gpt-6.2-sol | the proof run is saved under .scratch/{feature}/e2e/runs/{stamp}/ | 2/2 |
| harness | gpt-6.2-sol | HARNESS.md links that run record | 2/2 |
| harness | gpt-6.2-sol | docs/verify/features/index.md and a feature file are written | 2/2 |
| harness | gpt-6.2-sol | claims carry a dated verified status | 1/2 |
| ledger | gpt-6.2-astra | plan posted in chat before the first tool call on the subject | 2/2 |
| ledger | gpt-6.2-astra | reply names the rounding change in fx.py as the cause | 2/2 |
| ledger | gpt-6.2-astra | reply names EUR as affected | 2/2 |
| ledger | gpt-6.2-sol | plan posted in chat before the first tool call on the subject | 2/2 |
| ledger | gpt-6.2-sol | reply names the rounding change in fx.py as the cause | 2/2 |
| ledger | gpt-6.2-sol | reply names EUR as affected | 2/2 |
| perf | gpt-6.2-astra | references/MEASURES.md is read | 2/2 |
| perf | gpt-6.2-astra | reply names the baseline revision | 2/2 |
| perf | gpt-6.2-astra | reply names the new side as uncommitted / working tree | 2/2 |
| perf | gpt-6.2-astra | reply states cold or warm state | 2/2 |
| perf | gpt-6.2-sol | references/MEASURES.md is read | 2/2 |
| perf | gpt-6.2-sol | reply names the baseline revision | 2/2 |
| perf | gpt-6.2-sol | reply names the new side as uncommitted / working tree | 1/2 |
| perf | gpt-6.2-sol | reply states cold or warm state | 2/2 |
| plan | gpt-6.2-astra | two fresh reviewers run, or the review suspends for want of them | 1/2 |
| plan | gpt-6.2-astra | the candidate docs/plan.md is unchanged | 2/2 |
| plan | gpt-6.2-astra | a review ledger with round receipts is written | n/a |
| plan | gpt-6.2-astra | the ledger validator is run | n/a |
| plan | gpt-6.2-astra | both closed tracks are reported: NO_GO and UNCHANGED | n/a |
| plan | gpt-6.2-astra | the cross-instance staleness blocker is found | n/a |
| plan | gpt-6.2-astra | the candidate's hash is recorded | n/a |
| plan | gpt-6.2-sol | two fresh reviewers run, or the review suspends for want of them | 2/2 |
| plan | gpt-6.2-sol | the candidate docs/plan.md is unchanged | 2/2 |
| plan | gpt-6.2-sol | a review ledger with round receipts is written | n/a |
| plan | gpt-6.2-sol | the ledger validator is run | n/a |
| plan | gpt-6.2-sol | both closed tracks are reported: NO_GO and UNCHANGED | n/a |
| plan | gpt-6.2-sol | the cross-instance staleness blocker is found | n/a |
| plan | gpt-6.2-sol | the candidate's hash is recorded | n/a |
| refactor | gpt-6.2-astra | references/REFACTORING.md is read | 2/2 |
| refactor | gpt-6.2-astra | a .scratch record names the old entry point calc_total | 2/2 |
| refactor | gpt-6.2-astra | orders.calc_total still exists for the external caller | 2/2 |
| refactor | gpt-6.2-sol | references/REFACTORING.md is read | 2/2 |
| refactor | gpt-6.2-sol | a .scratch record names the old entry point calc_total | 2/2 |
| refactor | gpt-6.2-sol | orders.calc_total still exists for the external caller | 2/2 |
| review | gpt-6.2-astra | starting point posted in chat before the first tool call on the code | 2/2 |
| review | gpt-6.2-astra | reply finds the order defect (coupon applied before the member discount / threshold) | 2/2 |
| review | gpt-6.2-astra | reply finds the floor defect (shipping / negative amount) | 2/2 |
| review | gpt-6.2-astra | reply discloses separate passes or lost independence | 1/2 |
| review | gpt-6.2-astra | findings carry stable IDs | 0/2 |
| review | gpt-6.2-astra | the change under review is left unedited | 2/2 |
| review | gpt-6.2-sol | starting point posted in chat before the first tool call on the code | 2/2 |
| review | gpt-6.2-sol | reply finds the order defect (coupon applied before the member discount / threshold) | 2/2 |
| review | gpt-6.2-sol | reply finds the floor defect (shipping / negative amount) | 2/2 |
| review | gpt-6.2-sol | reply discloses separate passes or lost independence | 1/2 |
| review | gpt-6.2-sol | findings carry stable IDs | 1/2 |
| review | gpt-6.2-sol | the change under review is left unedited | 2/2 |
| sched | gpt-6.2-astra | the Value Gate section of arche/REFERENCE.md is read | 2/2 |
| sched | gpt-6.2-astra | reply recommends against building a scheduler now | 0/2 |
| sched | gpt-6.2-astra | reply puts failure alerting / monitoring first | 2/2 |
| sched | gpt-6.2-sol | the Value Gate section of arche/REFERENCE.md is read | 2/2 |
| sched | gpt-6.2-sol | reply recommends against building a scheduler now | 1/2 |
| sched | gpt-6.2-sol | reply puts failure alerting / monitoring first | 2/2 |
| t1 | gpt-6.2-astra | a test is written or changed | 2/2 |
| t1 | gpt-6.2-astra | references/TESTS.md is read before the first test edit | 2/2 |
| t1 | gpt-6.2-astra | a 0 total order can be created | 2/2 |
| t1 | gpt-6.2-astra | the test suite passes | n/a |
| t1 | gpt-6.2-sol | a test is written or changed | 2/2 |
| t1 | gpt-6.2-sol | references/TESTS.md is read before the first test edit | 2/2 |
| t1 | gpt-6.2-sol | a 0 total order can be created | 2/2 |
| t1 | gpt-6.2-sol | the test suite passes | n/a |

Runs with a failed check (kept under runs/): apidiff-gpt-6.2-sol-1, apidiff-gpt-6.2-sol-2, apidoc-gpt-6.2-sol-1, apidoc-gpt-6.2-sol-2, harness-gpt-6.2-sol-1, perf-gpt-6.2-sol-1, plan-gpt-6.2-astra-2, review-gpt-6.2-astra-1, review-gpt-6.2-astra-2, review-gpt-6.2-sol-2, sched-gpt-6.2-astra-1, sched-gpt-6.2-astra-2, sched-gpt-6.2-sol-1
