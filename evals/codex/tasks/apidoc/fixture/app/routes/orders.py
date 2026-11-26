from flask import Blueprint, request
from app import ok, fail
from app.auth import login_required

bp = Blueprint("orders", __name__)

STATUSES = ("CREATED", "PAID", "SHIPPED", "CANCELLED")


@bp.post("")
@login_required
def create_order():
    body = request.get_json(silent=True) or {}
    items = body.get("items")
    if not items:
        return fail(40001, "items required")
    for it in items:
        if not it.get("skuId") or int(it.get("qty", 0)) <= 0:
            return fail(40002, "invalid item")
    order = {
        "orderId": "O" + "1" * 12,
        "status": "CREATED",
        "items": [{"skuId": it["skuId"], "qty": int(it["qty"])} for it in items],
        "remark": body.get("remark", ""),
        "couponCode": body.get("couponCode"),
    }
    return ok(order)


@bp.get("/<order_id>")
@login_required
def get_order(order_id):
    if not order_id.startswith("O"):
        return fail(40400, "order not found", 404)
    return ok({"orderId": order_id, "status": "CREATED", "items": [], "remark": ""})


@bp.get("")
@login_required
def list_orders():
    page = int(request.args.get("page", 1))
    size = min(int(request.args.get("size", 20)), 100)
    status = request.args.get("status")
    if status and status not in STATUSES:
        return fail(40003, "invalid status")
    return ok({"page": page, "size": size, "total": 0, "list": []})


@bp.post("/<order_id>/cancel")
@login_required
def cancel_order(order_id):
    reason = (request.get_json(silent=True) or {}).get("reason")
    return ok({"orderId": order_id, "status": "CANCELLED", "reason": reason})
