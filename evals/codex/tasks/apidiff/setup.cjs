"use strict";
// main holds the original orders API; feature/order-v2 changes it.
const path = require("node:path");
const fs = require("node:fs");

module.exports = ({ dir, git, commit, edit }) => {
  git(["add", "-A"]);
  commit("orders api");
  git(["checkout", "-q", "-b", "feature/order-v2"]);
  const file = path.join(dir, "app/routes/orders.py");
  edit(file, [
    ['        if not it.get("skuId") or int(it.get("qty", 0)) <= 0:\n            return fail(40002, "invalid item")',
     '        if not it.get("skuId") or not 0 < int(it.get("qty", 0)) <= 99:\n            return fail(40002, "invalid item")'],
    ['        "remark": body.get("remark", ""),\n        "couponCode": body.get("couponCode"),\n    }',
     '        "note": body.get("note", ""),\n        "couponCode": body.get("couponCode"),\n        "payAmount": "0.00",\n    }'],
    ['    return ok({"orderId": order_id, "status": "CREATED", "items": [], "remark": ""})',
     '    return ok({"orderId": order_id, "status": "CREATED", "items": [], "note": ""})'],
  ]);
  fs.appendFileSync(file, '\n\n@bp.get("/<order_id>/logistics")\n@login_required\ndef logistics(order_id):\n    return ok({"orderId": order_id, "carrier": None, "trackingNo": None, "events": []})\n');
  git(["add", "-A"]);
  commit("orders v2: note field, qty cap, payAmount, logistics", { date: "2026-11-02T10:00:00" });
};
