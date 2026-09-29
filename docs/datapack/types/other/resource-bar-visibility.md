---
title: resource_bar_visibility_type（资源条显示条件）
description: 资源条显示条件族 resource_bar_visibility_type 的八种条件、字段、默认值与加载期约束。
---

# resource_bar_visibility_type（资源条显示条件）

显示条件纯粹是显示策略：它决定是否绘制资源条，绝不影响数值的结算。它写在 [resource](../../json/resource.md) 内联 `bars` 的 `visibility` 里，不写 `visibility` 时按 `mxt:always` 算。

这一族由模组注册，数据包只能选用，不能新增。

### `mxt:always`

始终可见。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:always"}
```

### `mxt:non_full`

当前值低于最大值时可见。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:non_full"}
```

### `mxt:non_zero`

`maximum - minimum` 为正时可见，差值为零或负数时隐藏。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:non_zero"}
```

### `mxt:recently_changed`

在数值最后一次变化后的一段时间里可见。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `hold_ticks` | Long | `60` | 变化后保持可见的 tick 数 |

```json
{"type": "mxt:recently_changed", "hold_ticks": 120}
```

### `mxt:resource_range`

当前值落在闭区间里时可见。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `min` | Double | **必填** | 包含下界 |
| `max` | Double | **必填** | 包含上界 |

```json
{"type": "mxt:resource_range", "min": 1, "max": 50}
```

### `mxt:and`

每个嵌套显示条件都可见时可见。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `values` | 显示条件数组 | **必填** | 嵌套的显示条件 |

```json
{"type": "mxt:and", "values": [{"type": "mxt:non_full"}, {"type": "mxt:non_zero"}]}
```

### `mxt:or`

任意一个嵌套显示条件可见时可见。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `values` | 显示条件数组 | **必填** | 嵌套的显示条件 |

```json
{"type": "mxt:or", "values": [{"type": "mxt:non_full"}, {"type": "mxt:recently_changed"}]}
```

### `mxt:not`

取反一个嵌套显示条件。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | 显示条件 | **必填** | 要取反的显示条件 |

```json
{"type": "mxt:not", "value": {"type": "mxt:non_full"}}
```

---

`hold_ticks` 必须非负，`resource_range` 的 `min` / `max` 都必须有限、且 `max` 不低于 `min`，两端都包含。`mxt:non_zero` 看的是 `maximum - minimum`，跟当前值无关。这几条不满足都在加载期报错。
