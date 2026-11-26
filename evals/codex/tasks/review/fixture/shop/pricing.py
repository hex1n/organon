from decimal import Decimal, ROUND_HALF_UP

CENT = Decimal("0.01")


def member_price(subtotal: Decimal, is_member: bool) -> Decimal:
    if is_member:
        return (subtotal * Decimal("0.95")).quantize(CENT, ROUND_HALF_UP)
    return subtotal


def payable(subtotal: Decimal, shipping: Decimal, is_member: bool) -> Decimal:
    goods = member_price(subtotal, is_member)
    return goods + shipping
