from functools import wraps
from flask import request
from app import fail


def login_required(fn):
    @wraps(fn)
    def wrapper(*a, **kw):
        if not request.headers.get("X-User-Id"):
            return fail(40100, "unauthorized", 401)
        return fn(*a, **kw)
    return wrapper
