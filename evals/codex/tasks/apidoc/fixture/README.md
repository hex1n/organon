# shop-api

Flask 服务，网关把 `/shop` 前缀转发到本服务，本地 `python3 -m app` 监听 8080。
所有接口返回 `{"code": 0, "msg": "ok", "data": ...}`，`code` 非 0 表示失败。
鉴权：网关校验后在请求头 `X-User-Id` 里带上用户 ID，缺失返回 401。
