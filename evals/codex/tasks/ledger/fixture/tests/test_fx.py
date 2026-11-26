from decimal import Decimal
from billing.fx import convert

def test_usd_identity():
    assert convert(Decimal("10.00"), "USD") == Decimal("10.00")
