---
title: resource_value_provider_type（资源数值来源）
description: 资源数值来源族 resource_value_provider_type 的八种来源、字段、默认值与边界。
---

# resource_value_provider_type（资源数值来源）

资源数值来源为一条数值解析出一个数字：当前值、定义上限、恢复速度、距离上限还差多少，以及两种灵气浓度。它不写在资源条里，而是由脚本求值——把对象交给 `MxtValues.evaluateResource(entity, resource, definition)`，`mxt:js` 的回调用 `MxtValues.resourceValue(id, callback)` 注册，见 [KubeJS API 参考](../../../kubejs/api/values.md)。

这一族由模组注册，数据包只能选用，不能新增。

### `mxt:current`

实体上存下来的当前值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:current"}
```

### `mxt:max`

这条数值的定义里求值出来的 `max`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:max"}
```

### `mxt:regen`

该数值的灵气定义里的 `regen`，也就是每 tick 的自然恢复量。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:regen"}
```

### `mxt:missing`

距离上限还差多少，永远不低于 `0`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:missing"}
```

### `mxt:environment_concentration`

该位置的环境模板浓度，不含区块库存以及方块、阵法的贡献。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:environment_concentration"}
```

### `mxt:actual_concentration`

该位置最终解析出来的浓度，包含所有已生效来源。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:actual_concentration"}
```

### `mxt:constant`

一个固定的数值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `NumberProvider` | **必填** | 要解析的数值 |

```json
{"type": "mxt:constant", "value": "level * 10"}
```

### `mxt:js`

由脚本回调决定的数值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | String | **必填** | 用 `MxtValues.resourceValue(id, callback)` 注册的回调 ID |
| `params` | Object | `{}` | 传给回调的任意 JSON |

```json
{"type": "mxt:js", "id": "example:qi_bonus", "params": {"scale": 2}}
```

---

`mxt:regen` 读不到对应的灵气定义时解析为 `0`。两个浓度来源读世界状态，因此需要一个实体：没有实体时解析为 `0`，服务端从世界状态算，客户端读同步下来的灵气池。`mxt:js` 的回调缺失或抛异常时记一条警告，并按 `0` 解析。

两个浓度 ID 同时存在于两处，别混：写在资源条的 `context` 里时它们是上下文，读客户端同步下来的池子、不需要实体；写成本页的类型时要有实体，服务端自己从世界状态算。
