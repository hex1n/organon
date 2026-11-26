from decimal import Decimal

DESTINATIONS = ("original", "balance")


def plan_refund(order, amount: Decimal, destination: str = "original"):
    if destination not in DESTINATIONS:
        raise ValueError("bad destination")
    if amount <= 0 or amount > order["paid"]:
        raise ValueError("bad amount")
    return {"order_id": order["id"], "amount": amount, "destination": destination}
