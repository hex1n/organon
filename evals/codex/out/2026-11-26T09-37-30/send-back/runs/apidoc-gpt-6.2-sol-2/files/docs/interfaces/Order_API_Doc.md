# 订单接口文档

本文覆盖创建订单、查询详情、查询列表和取消订单，共 4 个 HTTP 接口。

## 1. 通用约定

- 基础地址为 `https://{gateway}/shop`。接口列表中的路径相对于该地址。
- 网关校验登录后注入 `X-User-Id`。该请求头缺失或为空时，应用返回 HTTP `401`、`code=40100`、`msg="unauthorized"`。前端凭证的传递方式待网关联调确认。
- 成功返回 HTTP `200` 和 `{"code": 0, "msg": "ok", "data": ...}`。业务失败时 `code` 非 `0`，`data` 为 `null`。前端需处理 HTTP 错误，框架和网关可能返回其他格式。
- 请求带 JSON 对象时设置 `Content-Type: application/json`。标为 `JSON 值` 的字段按输入原样回传，正式字段类型待确认。有内容时前端可传字符串。
- 订单 ID 是字符串。详情和取消的路径参数 `{orderId}` 取订单响应中的 `data.orderId`。示例值用于说明请求和响应格式。
- 当前版本可用于联调请求和响应。真实订单的保存、归属校验、状态流转，以及创建和取消的重试语义待确认。

## 2. 接口列表

| 接口 | 方法 | 路径 |
|---|---|---|
| [创建订单](#create-order) | POST | `/api/v1/orders` |
| [查询订单详情](#get-order) | GET | `/api/v1/orders/{orderId}` |
| [查询订单列表](#list-orders) | GET | `/api/v1/orders` |
| [取消订单](#cancel-order) | POST | `/api/v1/orders/{orderId}/cancel` |

## 3. 接口详情

<a id="create-order"></a>

### 3.1 创建订单

`POST /shop/api/v1/orders`

| 请求字段 | 位置 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `items` | body | object[] | 是 | 至少一项，每项包含 `skuId` 和 `qty` |
| `items[].skuId` | body | JSON 值 | 是 | 商品 SKU ID。服务端拒绝空字符串、`null`、`false`、`0` 和空数组或空对象 |
| `items[].qty` | body | integer | 是 | 数量。传大于 `0` 的 JSON 整数，后端按转成整数后的值校验 |
| `remark` | body | JSON 值 | 否 | 订单备注。省略时返回 `""`，显式传 `null` 时返回 `null` |
| `couponCode` | body | JSON 值 | 否 | 优惠券码。省略或传 `null` 时返回 `null`，空字符串原样返回 |

```json
{
  "items": [{"skuId": "SKU-001", "qty": 2}],
  "remark": "请放前台"
}
```

响应 `data` 包含[订单](#order-type)的字段，以及 `couponCode`（JSON 值）。当前返回固定订单号 `O111111111111`，状态为 `CREATED`。商品明细按请求顺序返回，`qty` 为转换后的整数。

| HTTP 状态 | `code` | `msg` | 触发条件 |
|---|---|---|---|
| 400 | 40001 | `items required` | 请求体缺失或无法解析为 JSON，或 `items` 缺失、为 `null` 或为空数组 |
| 400 | 40002 | `invalid item` | 商品项缺少 `skuId` 或其值无效，或 `qty` 缺失、转换后小于等于 `0` |

`qty` 为 `null` 或无法转为整数时会触发通用 HTTP 错误。结构不符的请求体也可能触发此类错误。

<a id="get-order"></a>

### 3.2 查询订单详情

`GET /shop/api/v1/orders/{orderId}`

- 路径参数 `orderId`（string，必填）为订单 ID，须以大写 `O` 开头。

响应 `data` 为[订单](#order-type)。当前对所有符合前缀要求的 ID 返回该 ID、`CREATED`、空商品列表和空备注。

| HTTP 状态 | `code` | `msg` | 触发条件 |
|---|---|---|---|
| 404 | 40400 | `order not found` | `orderId` 的首字符不是大写 `O` |

<a id="list-orders"></a>

### 3.3 查询订单列表

`GET /shop/api/v1/orders`

| 请求字段 | 位置 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| `page` | query | integer | 否 | 页码，默认 `1`。前端从 `1` 开始传正整数 |
| `size` | query | integer | 否 | 每页条数，默认 `20`，大于 `100` 时按 `100` 处理。前端传 `1` 到 `100` |
| `status` | query | string | 否 | [订单状态](#order-status)，区分大小写。省略或传空字符串时不限状态 |

| 响应字段 | 类型 | 说明 |
|---|---|---|
| `data.page` | integer | 实际页码 |
| `data.size` | integer | 应用上限后的每页条数 |
| `data.total` | integer | 总条数，当前固定为 `0` |
| `data.list` | array | 订单列表，当前固定为 `[]`。非空时的元素结构和排序待确认 |

| HTTP 状态 | `code` | `msg` | 触发条件 |
|---|---|---|---|
| 400 | 40003 | `invalid status` | 非空 `status` 超出枚举范围 |

`page` 或 `size` 传空字符串或无法转为整数的值会触发通用 HTTP 错误。使用默认值时省略该参数。

<a id="cancel-order"></a>

### 3.4 取消订单

`POST /shop/api/v1/orders/{orderId}/cancel`

- 路径参数 `orderId`（string，必填）为订单 ID。当前接受任意单段路径 ID，可取消的订单状态待确认。
- 请求体字段 `reason`（JSON 值，选填）为取消原因。省略请求体、字段缺失或传 `null` 时返回 `null`，空字符串原样返回。

响应 `data` 含 `orderId`（string，路径中的订单 ID）、`status`（string，固定为 `CANCELLED`）和 `reason`（JSON 值）。

## 4. 共享类型

<a id="order-type"></a>

### 订单

| 响应字段 | 类型 | 说明 |
|---|---|---|
| `data.orderId` | string | 订单 ID |
| `data.status` | string | [订单状态](#order-status) |
| `data.items` | object[] | 商品明细 |
| `data.items[].skuId` | JSON 值 | 商品 SKU ID |
| `data.items[].qty` | integer | 商品数量 |
| `data.remark` | JSON 值 | 订单备注 |

<a id="order-status"></a>

### 订单状态

| 值 | 含义 |
|---|---|
| `CREATED` | 已创建 |
| `PAID` | 已支付 |
| `SHIPPED` | 已发货 |
| `CANCELLED` | 已取消 |
