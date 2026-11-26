from catalog.db import query_products


def list_products(category_id: int, locale: str, page: int = 1, size: int = 20):
    """Product listing page. Names and descriptions are localized per locale."""
    rows = query_products(category_id=category_id, locale=locale, offset=(page - 1) * size, limit=size)
    return [{"id": r.id, "name": r.name, "price": str(r.price)} for r in rows]
