from decimal import Decimal as D
from shop.pricing import payable


def test_member_discount():
    assert payable(D("100"), D("10"), True) == D("105.00")


def test_non_member():
    assert payable(D("100"), D("10"), False) == D("110")
