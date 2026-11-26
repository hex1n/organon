from .reconcile import diff

def daily_report(orders, refunded):
    d = diff(orders, refunded)
    return {"orders": len(orders), "diff": str(d)}
