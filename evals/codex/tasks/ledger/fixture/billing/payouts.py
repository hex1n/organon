"""payouts: part of the billing service."""
from decimal import Decimal

def summarize_payouts(rows):
    total = sum((Decimal(str(r["amount"])) for r in rows), Decimal("0"))
    return {"count": len(rows), "total": total}
