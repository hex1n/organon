"use strict";
// The committed pricing code, then an uncommitted coupon change to review.
const fs = require("node:fs");
const path = require("node:path");

const COUPONS = `from dataclasses import dataclass
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
`;

const PRICING = `from decimal import Decimal, ROUND_HALF_UP

from shop.coupons import coupon_discount

CENT = Decimal("0.01")


def member_price(subtotal: Decimal, is_member: bool) -> Decimal:
    if is_member:
        return (subtotal * Decimal("0.95")).quantize(CENT, ROUND_HALF_UP)
    return subtotal


def payable(subtotal: Decimal, shipping: Decimal, is_member: bool, coupon=None) -> Decimal:
    discount = coupon_discount(subtotal, coupon)
    goods = member_price(subtotal - discount, is_member)
    return goods + shipping
`;

const TEST = `from decimal import Decimal as D
from shop.coupons import Coupon
from shop.pricing import payable

C = Coupon("FULL100-20", D("100"), D("20"))


def test_coupon_applies_over_threshold():
    assert payable(D("120"), D("10"), False, C) == D("110")


def test_coupon_below_threshold():
    assert payable(D("90"), D("10"), False, C) == D("100")
`;

module.exports = ({ dir, git, commit }) => {
  git(["add", "-A"]);
  commit("pricing: member discount and shipping");
  fs.writeFileSync(path.join(dir, "shop/coupons.py"), COUPONS);
  fs.writeFileSync(path.join(dir, "shop/pricing.py"), PRICING);
  fs.writeFileSync(path.join(dir, "tests/test_coupons.py"), TEST);
};
