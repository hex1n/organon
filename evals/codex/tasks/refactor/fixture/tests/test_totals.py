from orders import calc_total
from cart import cart_preview
from invoice import invoice_lines

ITEMS = [{"name": "a", "price": 60, "qty": 2}]

def test_member_discount():
    assert calc_total(ITEMS, member=True) == 108.0
    assert cart_preview(ITEMS, member=True)["total"] == 108.0
    assert invoice_lines(ITEMS, member=True)[-1] == "TOTAL 108.0"

def test_no_discount():
    assert calc_total(ITEMS) == 120
