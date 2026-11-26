"""Money rounding. ADR-0007: all settlement amounts use banker's rounding to minor units."""
from decimal import Decimal, ROUND_HALF_EVEN, ROUND_HALF_UP

def bank_round(x: Decimal, places: int = 2) -> Decimal:
    return x.quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_EVEN)

def half_up(x: Decimal, places: int = 2) -> Decimal:
    return x.quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP)
