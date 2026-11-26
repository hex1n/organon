from decimal import Decimal
from .rounding import bank_round

RATES = {"USD": Decimal("1"), "EUR": Decimal("0.9213"), "JPY": Decimal("151.37"), "GBP": Decimal("0.7895")}
PLACES = {"USD": 2, "EUR": 2, "GBP": 2, "JPY": 0}

def convert(amount_usd: Decimal, ccy: str) -> Decimal:
    return bank_round(amount_usd * RATES[ccy], PLACES[ccy])
