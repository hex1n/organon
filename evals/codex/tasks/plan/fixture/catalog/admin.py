from catalog.db import save_product


def update_product(product_id: int, **fields):
    """Back-office edit: price, names, category. Takes effect immediately today."""
    save_product(product_id, **fields)
