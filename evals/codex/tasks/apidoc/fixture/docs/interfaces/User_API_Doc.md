# 用户接口文档

## 1. 通用约定

- 基础地址：`https://{gateway}/shop`
- 鉴权：请求头 `X-User-Id`（网关注入），缺失返回 HTTP 401、`code=40100`。
- 返回包装：`{"code": 0, "msg": "ok", "data": ...}`；`code` 非 0 为失败。

## 2. 接口列表

| 接口 | 方法 | 路径 |
|---|---|---|
| 当前用户 | GET | `/api/v1/users/me` |

## 3. 接口详情

### 3.1 当前用户

`GET /shop/api/v1/users/me`

请求参数：无。

响应 `data`：

| 字段 | 类型 | 说明 |
|---|---|---|
| userId | string | 用户 ID |
| nickname | string | 昵称 |
