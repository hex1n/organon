from dedupe import find_duplicates

def test_order_and_case():
    rs = [{"email": "B@x"}, {"email": "a@x"}, {"email": "b@x"}, {"email": "A@x"}, {"email": "c@x"}]
    assert find_duplicates(rs) == ["b@x", "a@x"]
