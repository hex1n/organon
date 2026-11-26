# Daily refund reconciliation

`settlement.daily_report` compares refunds we issued with the PSP settlement file and logs the signed difference to logs/reconcile-YYYY-MM-DD.log. A non-zero diff is an incident for finance.
