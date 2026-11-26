from decimal import Decimal
from .rounding import bank_round
from .fx import RATES, PLACES

def expected_refund(order, ratio=Decimal("1")):
    """What the PSP settlement file should show, per ADR-0007."""
    return bank_round(Decimal(str(order["usd"])) * ratio * RATES[order["ccy"]], PLACES[order["ccy"]])

def diff(orders, refunded):
    return sum((refunded[o["id"]] - expected_refund(o) for o in orders), Decimal("0"))
