from flask import Flask, jsonify


def ok(data=None):
    return jsonify({"code": 0, "msg": "ok", "data": data})


def fail(code, msg, status=400):
    return jsonify({"code": code, "msg": msg, "data": None}), status


def create_app():
    app = Flask(__name__)
    from app.routes.users import bp as users_bp
    from app.routes.orders import bp as orders_bp
    app.register_blueprint(users_bp, url_prefix="/api/v1/users")
    app.register_blueprint(orders_bp, url_prefix="/api/v1/orders")
    return app
