from decimal import Decimal as D
from shop.coupons import Coupon
from shop.pricing import payable

C = Coupon("FULL100-20", D("100"), D("20"))


def test_coupon_applies_over_threshold():
    assert payable(D("120"), D("10"), False, C) == D("110")


def test_coupon_below_threshold():
    assert payable(D("90"), D("10"), False, C) == D("100")
