class InvalidOrder(Exception):
    pass


def create_order(customer_id, amount_cents, items):
    if not customer_id:
        raise InvalidOrder("customer required")
    if amount_cents <= 0:
        raise InvalidOrder("amount must be positive")
    if not items:
        raise InvalidOrder("items required")
    return {
        "customer": customer_id,
        "amount": amount_cents,
        "items": list(items),
        "status": "NEW",
    }
