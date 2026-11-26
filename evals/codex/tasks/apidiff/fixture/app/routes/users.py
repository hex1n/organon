from flask import Blueprint, request
from app import ok
from app.auth import login_required

bp = Blueprint("users", __name__)


@bp.get("/me")
@login_required
def me():
    return ok({"userId": request.headers["X-User-Id"], "nickname": "demo"})
