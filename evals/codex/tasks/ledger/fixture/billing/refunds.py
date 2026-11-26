from decimal import Decimal
from .fx import convert

def refund_amount(order, ratio=Decimal("1")):
    """Amount refunded to the customer in their currency."""
    return convert(Decimal(str(order["usd"])) * ratio, order["ccy"])
