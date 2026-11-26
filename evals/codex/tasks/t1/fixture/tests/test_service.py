import pytest

from orders.service import InvalidOrder, create_order


def test_creates_order():
    order = create_order("c1", 1999, ["sku-1"])
    assert order["amount"] == 1999
    assert order["status"] == "NEW"


def test_rejects_missing_customer():
    with pytest.raises(InvalidOrder):
        create_order("", 100, ["sku-1"])


def test_rejects_nonpositive_amount():
    for amount in (0, -1, -500):
        with pytest.raises(InvalidOrder):
            create_order("c1", amount, ["sku-1"])


def test_rejects_empty_items():
    with pytest.raises(InvalidOrder):
        create_order("c1", 100, [])
