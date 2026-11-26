from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class Coupon:
    code: str
    threshold: Decimal
    amount: Decimal


def coupon_discount(subtotal: Decimal, coupon: "Coupon | None") -> Decimal:
    if coupon is None:
        return Decimal("0")
    if subtotal >= coupon.threshold:
        return coupon.amount
    return Decimal("0")
