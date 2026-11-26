def invoice_lines(items, member=False):
    lines = [f'{i["name"]} x{i["qty"]}' for i in items]
    subtotal = sum(i["price"] * i["qty"] for i in items)
    if member and subtotal >= 100:
        subtotal = subtotal * 0.9
    elif subtotal >= 200:
        subtotal = subtotal * 0.95
    lines.append(f"TOTAL {round(subtotal, 2)}")
    return lines
