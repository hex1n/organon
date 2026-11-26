# 订单接口文档

> 范围涵盖创建、详情、列表和取消，共 4 个 HTTP 接口。

## 1. 通用约定

- 基础地址为 `https://{gateway}/shop`。联调环境的网关域名和浏览器登录凭证形式待确认。
- 所有接口均需登录。网关校验登录态后注入 `X-User-Id`。该请求头缺失或为空时返回 HTTP 401、`code=40100`、`msg="unauthorized"`。
- 发送 JSON 请求体时使用 `Content-Type: application/json`，请求体为 JSON 对象。
- 成功返回 HTTP 200 和 `{"code":0,"msg":"ok","data":...}`。文档中列出的业务错误沿用同一结构，`code` 非 0，`data` 为 `null`。前端先检查 HTTP 状态，再读取业务 `code`。响应无法按 JSON 解析时，按请求失败处理。
- 示例用于联调，实际请求使用页面选中的商品和接口返回的订单号。订单持久化、归属校验、可取消状态及重复提交语义待确认。涉及创建后查询、取消后刷新和自动重试的流程，需用联调环境验证。

## 2. 接口列表

| 接口 | 方法 | 路径 |
|---|---|---|
| [创建订单](#create-order) | POST | `/api/v1/orders` |
| [查询订单详情](#get-order) | GET | `/api/v1/orders/{order_id}` |
| [查询订单列表](#list-orders) | GET | `/api/v1/orders` |
| [取消订单](#cancel-order) | POST | `/api/v1/orders/{order_id}/cancel` |

## 3. 接口详情

<a id="create-order"></a>

### 3.1 创建订单

`POST /shop/api/v1/orders`

| 字段 | 位置 | JSON 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `items` | body | [OrderItem](#order-item)[] | 是 | 至少一项。每项均需提供商品 SKU 和数量。 |
| `remark` | body | JSON 值 | 否 | 订单备注。省略时回传 `""`，显式传入 `null` 或空串时原样回传。业务类型待确认，前端传字符串。 |
| `couponCode` | body | JSON 值 | 否 | 优惠券码。省略或传入 `null` 时回传 `null`，空串原样回传。业务类型和优惠券使用规则待确认，前端有券码时传字符串。 |

请求示例

```json
{"items":[{"skuId":"SKU123","qty":2}],"remark":"请电话联系"}
```

成功时，`data` 为 [Order](#order) 并始终包含 `couponCode`。商品项按请求顺序返回。当前创建响应的状态固定为 `CREATED`，订单号固定为 `O111111111111`。

```json
{"code":0,"msg":"ok","data":{"orderId":"O111111111111","status":"CREATED","items":[{"skuId":"SKU123","qty":2}],"remark":"请电话联系","couponCode":null}}
```

| HTTP 状态 | `code` | `msg` | 触发条件 |
|---|---|---|---|
| 400 | `40001` | `items required` | 请求体缺失或 JSON 解析失败，或 `items` 缺失、为 `null` 或为空数组。 |
| 400 | `40002` | `invalid item` | 任一商品项的 `skuId` 缺失或为假值（如 `null` 或 `""`），或 `qty` 缺失、转为整数后小于等于 0。 |

`qty` 为 `null` 或无法转换为整数时，可能触发 HTTP 500。

<a id="get-order"></a>

### 3.2 查询订单详情

`GET /shop/api/v1/orders/{order_id}`

- `order_id`（path，string，必填）为创建响应中的 `orderId`。当前详情路由校验其以大写 `O` 开头。

成功时，`data` 为 [Order](#order)。当前响应回传路径中的订单号，`status` 固定为 `CREATED`，`items` 为 `[]`，`remark` 为 `""`。

```json
{"code":0,"msg":"ok","data":{"orderId":"O111111111111","status":"CREATED","items":[],"remark":""}}
```

| HTTP 状态 | `code` | `msg` | 触发条件 |
|---|---|---|---|
| 404 | `40400` | `order not found` | 路径中的 `order_id` 以大写 `O` 以外的字符开头。 |

<a id="list-orders"></a>

### 3.3 查询订单列表

`GET /shop/api/v1/orders`

| 字段 | 位置 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `page` | query | 整数字符串 | 否 | 页码，省略时为 `1`。前端从 `1` 开始发送。 |
| `size` | query | 整数字符串 | 否 | 每页条数，省略时为 `20`，超过 `100` 时按 `100` 处理。前端发送 `1` 至 `100`。 |
| `status` | query | string | 否 | 按[订单状态](#order-status)筛选，区分大小写。省略或传入空串表示查询全部状态。 |

请求示例为 `GET /shop/api/v1/orders?page=1&size=20&status=PAID`。

| `data` 字段 | 类型 | 说明 |
|---|---|---|
| `page` | integer | 本次使用的页码。 |
| `size` | integer | 取上限后的每页条数。 |
| `total` | integer | 订单总数，当前固定为 `0`。 |
| `list` | array | 当前固定为 `[]`。有数据时的列表项结构、筛选和排序行为待确认。 |

```json
{"code":0,"msg":"ok","data":{"page":1,"size":20,"total":0,"list":[]}}
```

| HTTP 状态 | `code` | `msg` | 触发条件 |
|---|---|---|---|
| 400 | `40003` | `invalid status` | `status` 为枚举范围外的非空字符串。 |

`page` 或 `size` 为空串或无法转换为整数时，可能触发 HTTP 500。

<a id="cancel-order"></a>

### 3.4 取消订单

`POST /shop/api/v1/orders/{order_id}/cancel`

- `order_id`（path，string，必填）为要取消的订单号。
- `reason`（body，JSON 值，可选）为取消原因。可以省略整个请求体。省略请求体、发送 `{}`、省略 `reason` 或传入 `null` 时均回传 `null`，空串原样回传。业务类型待确认，前端填写时传字符串。

请求示例

```json
{"reason":"买错商品"}
```

成功时，`data.orderId`（string）为路径中的订单号，`data.status`（string）固定为 `CANCELLED`，`data.reason` 为取消原因。

```json
{"code":0,"msg":"ok","data":{"orderId":"O111111111111","status":"CANCELLED","reason":"买错商品"}}
```

## 4. 数据类型

<a id="order"></a>

### Order

| 字段 | JSON 类型 | 说明 |
|---|---|---|
| `orderId` | string | 订单号，用于详情和取消接口的路径参数。 |
| `status` | string | [订单状态](#order-status)。 |
| `items` | [OrderItem](#order-item)[] | 订单商品。 |
| `remark` | JSON 值 | 订单备注，允许为 `null`。 |

<a id="order-item"></a>

### OrderItem

| 字段 | 请求位置 | JSON 类型 | 创建时必填 | 说明 |
|---|---|---|---|---|
| `skuId` | body | JSON 值 | 是 | 商品 SKU。服务端按真值校验并原样回传。业务类型待确认，前端传非空字符串。 |
| `qty` | body | integer | 是 | 商品数量。前端传大于 `0` 的 JSON 整数，服务端转为整数后校验并回传。 |

<a id="order-status"></a>

### 订单状态

| 值 | 含义 |
|---|---|
| `CREATED` | 已创建 |
| `PAID` | 已支付 |
| `SHIPPED` | 已发货 |
| `CANCELLED` | 已取消 |
