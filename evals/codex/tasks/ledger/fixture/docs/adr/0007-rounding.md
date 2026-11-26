# ADR-0007: Rounding of money

Status: accepted (2025-03)

All amounts that reach a settlement file or the ledger are rounded to the currency's minor unit with banker's rounding (ROUND_HALF_EVEN). Customer-facing refunds use the same rule so refunds reconcile exactly with the PSP file.
