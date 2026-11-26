# 订单接口变更说明

> 对比基线为 `main`，目标分支为 `feature/order-v2`。本文覆盖 3 个 HTTP 接口，包括 2 个修改和 1 个新增。

## 前端需要改什么

1. 创建订单时改发 `note`。创建和详情响应均改读 `data.note`，并从请求、响应类型中移除 `remark`。旧请求只传 `remark` 时，接口会忽略该值并返回 `note: ""`。
2. 将每个 `items[].qty` 的输入和提交校验设为 JSON 整数 `1`–`99`。旧版接受的单项数量 `100` 在新版会收到 HTTP `400`、`code=40002`。
3. 创建响应新增字符串字段 `data.payAmount`，当前固定为 `"0.00"`。有严格响应校验的客户端需要允许该字段。金额含义见[创建订单](#create-order)。
4. 需要查询物流时，使用订单 ID 调用[查询订单物流](#order-logistics)。当前响应对应物流空态。

## 1. 通用约定

- 基础地址为 `https://{gateway}/shop`。接口列表中的路径拼接在此地址后。
- 三个接口都要求登录。网关在请求头 `X-User-Id` 中注入用户 ID。缺失或值为空时返回 HTTP `401`、`code=40100`、`msg="unauthorized"`。
- JSON 业务响应包含 `code`、`msg` 和 `data`。成功返回 HTTP `200`、`code=0`、`msg="ok"`。业务错误返回非零 `code`，`data` 为 `null`。客户端也要能处理缺少 JSON 包装的 HTTP 错误。
- 示例中的订单 ID 和 SKU ID 在对接时替换为业务中的实际值。

## 2. 接口列表

| 接口 | 方法 | 路径 | 变更 | 对旧客户端的兼容性 |
|---|---|---|---|---|
| [创建订单](#create-order) | `POST` | `/api/v1/orders` | 修改 | `breaking` |
| [查询订单详情](#get-order) | `GET` | `/api/v1/orders/{orderId}` | 修改 | `breaking` |
| [查询订单物流](#order-logistics) | `GET` | `/api/v1/orders/{orderId}/logistics` | 新增 | `compatible` |

## 3. 接口详情

<a name="create-order"></a>
### 3.1 创建订单

`POST /shop/api/v1/orders`

请求和响应的 `remark` 改为 `note`，单项 `qty` 增加上限 `99`，响应新增 `payAmount`。

**请求**使用 `Content-Type: application/json`，请求体为 JSON 对象。

| 字段 | 位置 | 前端发送类型 | 必填 | 变更 | 兼容性 | 说明 |
|---|---|---|---|---|---|---|
| `items` | body | array | 是 | 无 | — | 非空数组，每一项都是商品对象。缺失、`null` 或 `[]` 返回 `40001`。 |
| `items[].skuId` | body | string | 是 | 无 | — | 传非空 SKU ID。缺失、`null` 或空字符串返回 `40002`。 |
| `items[].qty` | body | integer | 是 | 修改 | `breaking` | 旧版允许正整数，新版范围为 `1`–`99`，含两端。省略或整数越界返回 `40002`。 |
| `note` | body | string 或 null | 否 | 新增 | `breaking` | 接替 `remark`。省略时响应为 `""`。显式传 `null` 时响应为 `null`，传 `""` 时原样返回。 |
| `remark` | body | JSON 值 | 已删除（旧版可省略） | 删除 | `breaking` | 旧版订单备注，省略时默认 `""`。新版忽略传入值。 |
| `couponCode` | body | string 或 null | 否 | 无 | — | 优惠券码。省略或传 `null` 时响应为 `null`，传 `""` 时原样返回。 |

```json
{
  "items": [{"skuId": "SKU-123", "qty": 2}],
  "note": "请放前台"
}
```

**响应**字段位于 `data` 中。

| 字段 | 类型 | 变更 | 兼容性 | 说明 |
|---|---|---|---|---|
| `orderId` | string | 无 | — | 当前固定为示例 ID `O111111111111`。 |
| `status` | string | 无 | — | 固定为 `CREATED`。 |
| `items` | array | 无 | — | 按请求顺序返回商品，每项包含 `skuId` 和 `qty`。 |
| `items[].skuId` | JSON 值 | 无 | — | 原样返回传入的 SKU ID。按上述请求格式传字符串时，返回字符串。 |
| `items[].qty` | integer | 修改 | `breaking` | 返回该商品的数量。取值范围从正整数缩小到 `1`–`99`。 |
| `note` | JSON 值 | 新增 | `breaking` | 接替 `remark`。按上述请求格式发送时，回显字符串或 `null`，省略时为 `""`。 |
| `remark` | JSON 值 | 删除 | `breaking` | 旧响应回显的订单备注，省略时为 `""`。 |
| `couponCode` | JSON 值 | 无 | — | 按上述请求格式发送时，回显字符串或 `null`，省略时为 `null`。 |
| `payAmount` | string | 新增 | `not-assessed` | 当前固定为 `"0.00"`。币种、单位和非零金额格式为 `unconfirmed`。在这些信息确认前按占位值处理。 |

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "orderId": "O111111111111",
    "status": "CREATED",
    "items": [{"skuId": "SKU-123", "qty": 2}],
    "note": "请放前台",
    "couponCode": null,
    "payAmount": "0.00"
  }
}
```

| HTTP 状态 | `code` | `msg` | 触发条件 |
|---|---|---|---|
| `400` | `40001` | `items required` | 请求体缺失，或 `items` 缺失、为 `null` 或空数组。 |
| `400` | `40002` | `invalid item` | 任一商品的 `skuId` 缺失或值为空，或 `qty` 缺失、转换为整数后超出 `1`–`99`。 |

前端提交前应校验商品项为对象、`qty` 为整数。`qty` 为 `null` 或无法转换为整数时可能收到 HTTP `500`。

<a name="get-order"></a>
### 3.2 查询订单详情

`GET /shop/api/v1/orders/{orderId}`

响应的 `remark` 改为 `note`。

**请求**中 `orderId` 是必填的路径字符串，以大写 `O` 开头。无请求体。

**响应**字段位于 `data` 中。

| 字段 | 类型 | 变更 | 兼容性 | 说明 |
|---|---|---|---|---|
| `orderId` | string | 无 | — | 请求中的订单 ID。 |
| `status` | string | 无 | — | 当前固定为 `CREATED`。 |
| `items` | array | 无 | — | 当前固定为 `[]`。 |
| `note` | string | 新增 | `breaking` | 接替 `remark`，当前固定为 `""`。创建响应中的备注回显可用于创建当次的确认页。 |
| `remark` | string | 删除 | `breaking` | 旧接口的备注字段，固定为 `""`。 |

`orderId` 以其他字符开头时返回 HTTP `404`、`code=40400`、`msg="order not found"`。

<a name="order-logistics"></a>
### 3.3 查询订单物流

`GET /shop/api/v1/orders/{orderId}/logistics`

新增按订单 ID 查询物流的接口。当前任意匹配此路径的订单 ID 都返回物流空态，前端应从已有订单数据取得订单 ID。

**请求**中 `orderId` 是必填的路径字符串。无请求体。

**响应**字段位于 `data` 中。

| 字段 | 类型 | 说明 |
|---|---|---|
| `orderId` | string | 请求中的订单 ID。 |
| `carrier` | null | 承运商，当前为 `null`。非空值的类型为 `unconfirmed`。 |
| `trackingNo` | null | 运单号，当前为 `null`。非空值的类型为 `unconfirmed`。 |
| `events` | array | 物流事件，当前为 `[]`。数组元素结构为 `unconfirmed`。 |

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "orderId": "O111111111111",
    "carrier": null,
    "trackingNo": null,
    "events": []
  }
}
```
