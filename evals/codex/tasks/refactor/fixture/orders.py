def calc_total(items, member=False):
    subtotal = sum(i["price"] * i["qty"] for i in items)
    if member and subtotal >= 100:
        subtotal = subtotal * 0.9
    elif subtotal >= 200:
        subtotal = subtotal * 0.95
    return round(subtotal, 2)
