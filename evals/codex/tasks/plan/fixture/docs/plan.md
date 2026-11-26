# 方案：商品列表页加进程内缓存

## 目标
列表页 P99 从 800ms 降到 200ms 以下。

## 做法
1. 在 `catalog/listing.py` 的 `list_products` 外面加 `functools.lru_cache(maxsize=10000)`，缓存键是 `(category_id, page, size)`。
2. 缓存不设过期时间，靠 LRU 自然淘汰。
3. 后台改价（`catalog/admin.py` 的 `update_product`）后调用 `list_products.cache_clear()` 清空缓存。

## 上线
直接发布，有问题回滚代码即可。

## 验证
上线后看监控里的 P99。
