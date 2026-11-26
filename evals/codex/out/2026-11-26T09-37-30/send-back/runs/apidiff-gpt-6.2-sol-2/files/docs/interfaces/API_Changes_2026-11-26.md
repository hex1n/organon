# 订单接口变更说明

> 对比分支为 `feature/order-v2`，基线为 `main`。范围为 3 个 HTTP 接口，修改 2 个，新增 1 个。

## 前端改动

1. 下单请求把 `remark` 改成 `note`，下单和详情响应都改读 `data.note`。旧请求继续发送 `remark` 时，下单仍可成功，但备注会被忽略。新版详情的 `data.note` 当前固定为空字符串。下单成功页如需显示刚提交的备注，可使用下单响应。
2. 下单时将每个 `items[].qty` 限制为 **1 到 99 的整数**，并处理 HTTP `400`、`code=40002`。例如，单项数量为 `100` 的请求在 `main` 可以成功，在新版会失败。
3. 更新下单响应类型，加入字符串 `data.payAmount`。当前值固定为 `"0.00"`，实际应付金额和币种待确认，支付逻辑暂勿使用该值。
4. 物流入口可调用新增的查询接口。当前响应中的承运方和运单号均为 `null`，事件列表为 `[]`，按暂无物流信息展示。

若前端需要同时兼容两个后端版本，下单可同时发送同值的 `note` 和 `remark`，响应仅在 `note` 字段缺失时回退到 `remark`。数量统一限制为 1 到 99，并在新版后端启用物流入口。

## 1. 通用约定

- 基础地址为 `https://{gateway}/shop`。接口列表中的路径相对于该地址。
- 使用现有登录凭证请求网关。网关注入 `X-User-Id`，服务收到的请求缺少此头或其值为空时，返回 HTTP `401`、`code=40100`、`msg="unauthorized"`。
- 成功返回 HTTP `200`，JSON 包装包含 `code=0`、`msg="ok"` 和 `data`。接口返回业务错误时，`code` 非零且 `data` 为 `null`。客户端按 HTTP 状态和 `code` 处理，非 JSON 错误走通用失败分支。
- `orderId` 是字符串。将订单接口返回的值用作路径参数 `order_id`。示例中的 ID 和请求值仅供参考。

## 2. 接口列表

| 接口 | 方法 | 路径 | 变更类型 | 兼容性 |
|---|---|---|---|---|
| [创建订单](#create-order) | POST | `/api/v1/orders` | `modified` | `breaking` |
| [订单详情](#get-order) | GET | `/api/v1/orders/{order_id}` | `modified` | `breaking` |
| [查询物流](#order-logistics) | GET | `/api/v1/orders/{order_id}/logistics` | `added` | `compatible` |

兼容性按旧客户端访问新服务评估。字段标为 `not-assessed` 时，仍需确认旧客户端的响应解码器是否接受新增字段。

## 3. 接口详情

<a name="create-order"></a>

### 3.1 创建订单

`POST /shop/api/v1/orders`

请求 `remark` → `note`，单项 `qty` 增加上限。响应 `data.remark` → `data.note`，新增 `data.payAmount`。

请求体为 JSON 对象，使用 `Content-Type: application/json`。

| 字段 | 位置 | 类型 | 必填 | 变更 | 兼容性 | 说明 |
|---|---|---|---|---|---|---|
| `items` | `body` | `object[]` | 是 | `unchanged` | - | 商品明细，至少一项。|
| `items[].skuId` | `body` | `string`（发送格式） | 是 | `unchanged` | - | 商品 SKU ID，发送非空字符串。|
| `items[].qty` | `body` | `integer` | 是 | `modified` | `breaking` | `> 0` → `1–99`，含两端。服务端先转换为整数再检查范围。请发送 JSON 整数。|
| `note` | `body` | `string` 或 `null`（发送格式） | 否 | `added` | `compatible` | 订单备注。省略时响应为 `""`。显式传 `null` 或 `""` 时原样返回。|
| `remark` | `body` | `string` 或 `null`（旧接入格式） | 否（旧版） | `deleted` | `breaking` | 旧版备注字段，省略时响应为 `""`。新版忽略该字段，请改传 `note`。|
| `couponCode` | `body` | `string` 或 `null`（发送格式） | 否 | `unchanged` | - | 优惠券码。省略或传 `null` 时响应为 `null`，空字符串原样返回。|

```json
{
  "items": [{"skuId": "SKU-001", "qty": 2}],
  "note": "请置于前台",
  "couponCode": "SAVE10"
}
```

响应字段

| 字段 | 类型 | 变更 | 兼容性 | 说明 |
|---|---|---|---|---|
| `data.orderId` | `string` | `unchanged` | - | 订单 ID，当前固定为 `"O111111111111"`。|
| `data.status` | `string` | `unchanged` | - | 成功时为 `CREATED`。|
| `data.items` | `object[]` | `unchanged` | - | 明细按请求顺序返回。|
| `data.items[].skuId` | JSON 值 | `unchanged` | - | 原样返回请求中的 `skuId`。|
| `data.items[].qty` | `integer` | `modified` | `compatible` | 成功响应仍回传转换后的整数。随请求限制，取值范围由 `> 0` → `1–99`。|
| `data.note` | JSON 值 | `added` | `not-assessed` | 回传请求中的 `note`，省略时为 `""`。|
| `data.remark` | JSON 值（旧版） | `deleted` | `breaking` | 旧版回传请求中的 `remark`，省略时为 `""`。|
| `data.couponCode` | JSON 值 | `unchanged` | - | 回传请求中的 `couponCode`，省略时为 `null`。|
| `data.payAmount` | `string` | `added` | `not-assessed` | 应付金额字段，当前固定为 `"0.00"`。|

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "orderId": "O111111111111",
    "status": "CREATED",
    "items": [{"skuId": "SKU-001", "qty": 2}],
    "note": "请置于前台",
    "couponCode": "SAVE10",
    "payAmount": "0.00"
  }
}
```

接口错误

| HTTP 状态 | `code` | `msg` | 触发条件 |
|---|---|---|---|
| `400` | `40001` | `items required` | 请求体或 `items` 缺失，或 `items` 为 `null`、`[]`。|
| `400` | `40002` | `invalid item` | 某项 `skuId` 缺失、为 `null` 或空字符串，或者 `qty` 缺失、转换后的整数不在 `1–99`。|

`qty` 为 `null` 或不可转换的字符串时可能触发 HTTP `500`。提交前校验数量类型及范围。

<a name="get-order"></a>

### 3.2 订单详情

`GET /shop/api/v1/orders/{order_id}`

响应 `data.remark` → `data.note`。

无查询参数和请求体。

| 字段 | 位置 | 类型 | 必填 | 变更 | 兼容性 | 说明 |
|---|---|---|---|---|---|---|
| `order_id` | `path` | `string` | 是 | `unchanged` | - | 订单 ID，需以大写 `O` 开头。|

响应字段

| 字段 | 类型 | 变更 | 兼容性 | 说明 |
|---|---|---|---|---|
| `data.orderId` | `string` | `unchanged` | - | 路径中的订单 ID。|
| `data.status` | `string` | `unchanged` | - | 当前固定为 `CREATED`。|
| `data.items` | 空数组 | `unchanged` | - | 当前固定为 `[]`。|
| `data.remark` | `string`（旧版） | `deleted` | `breaking` | 旧版固定为 `""`。|
| `data.note` | `string` | `added` | `not-assessed` | 订单备注字段，当前固定为 `""`。|

```json
{
  "code": 0,
  "msg": "ok",
  "data": {"orderId": "O111111111111", "status": "CREATED", "items": [], "note": ""}
}
```

路径中的 `order_id` 未以大写 `O` 开头时，返回 HTTP `404`、`code=40400`、`msg="order not found"`。

<a name="order-logistics"></a>

### 3.3 查询物流

`GET /shop/api/v1/orders/{order_id}/logistics`

新增按订单 ID 查询物流的路由。请求需要路径参数 `order_id`（字符串），无查询参数和请求体。

| 字段 | 类型 | 说明 |
|---|---|---|
| `data.orderId` | `string` | 路径中的订单 ID。|
| `data.carrier` | `null` | 承运方，当前固定为 `null`。|
| `data.trackingNo` | `null` | 运单号，当前固定为 `null`。|
| `data.events` | 空数组 | 物流事件，当前固定为 `[]`。事件字段及顺序待确认。|

```json
{
  "code": 0,
  "msg": "ok",
  "data": {"orderId": "O111111111111", "carrier": null, "trackingNo": null, "events": []}
}
```

带登录态且匹配该路径的请求都会返回空物流结果，订单存在性和发货状态需通过其他业务信息判断。
