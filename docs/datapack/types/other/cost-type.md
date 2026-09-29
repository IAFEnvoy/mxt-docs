---
title: cost_type（消耗）
description: 消耗 mxt:cost_type 的全部内置条目、字段、默认值与判定规则。
---

# cost_type（消耗）

需要消耗东西的字段统一是数组，每项写一种 `Cost`。写 `type` 的四种由固有注册表 `mxt:cost_type` 分派：`mxt:resource`、`mxt:aura`、`mxt:item`、`mxt:js`；另一种是不写 `type`、只写 `id` 与 `amount` 的简写，读作 `mxt:resource`。整族由模组注册，数据包只能选用，不能新增。整份数组的全有或全无语义、通道规则与共用的求值口径见[共享数据类型 · `Cost`](../shared_data_types.md#cost)。

这一族被满包引用——技能、法器、功法、符箓、修炼、阵法、丹药等定义里凡是「要扣什么」的字段都写成一组 `Cost`，所以它没有专属的定义页，只是一页独立的类型页；`costs` 出现在哪张定义里由那张定义页自己写。

### `mxt:resource`

从付款者的数值账户中消耗一个数据包数值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `resource` | 数值 id | **必填** | 要消耗的数值 |
| `amount` | `NumberProvider` | **必填** | 要消耗的数量；必须求值为有限正数 |

```json
{"type": "mxt:resource", "resource": "example:qi", "amount": "5 + level"}
```

### `mxt:aura`

按灵气身份消耗。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `aura` | 灵气 id | **必填** | 要消耗的灵气身份 |
| `amount` | `NumberProvider` | **必填** | 要消耗的数量；必须求值为有限正数 |

```json
{"type": "mxt:aura", "aura": "example:fire_qi", "amount": 2}
```

扣的是什么由付款通道决定：付款者自己支付时扣**这门灵气所度量的那个数值**（付款者身上装的是数值，不是灵气），从共享灵气池或方块存量支付时扣这门灵气本身，后者按整单位向上取整。两条通道的差别见[共享数据类型 · `Cost`](../shared_data_types.md#cost)。

### `mxt:item`

从玩家背包中消耗匹配的物品。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `ItemMatcher` | **必填** | 哪些物品可以被消耗；见 [ItemMatcher](../shared_data_types.md#itemmatcher) |
| `amount` | `NumberProvider` | **必填** | 要消耗的匹配物品数量，向上取整；结果非正或非有限表示这笔 `Cost` 无法支付 |

```json
{"type": "mxt:item", "items": "#minecraft:logs", "amount": 8}
```

### `mxt:js`

检查与支付都交给服务端脚本回调。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | String | **必填** | 用 `MxtCosts.register` 注册的回调 id |
| `params` | Object | `{}` | 传给回调的任意 JSON |

```json
{"type": "mxt:js", "id": "example:quest_token", "params": {"count": 3}}
```

脚本 `Cost` 在服务端先检查、后支付，并且需要一个玩家。回调收到的是付款者与 `params`，而不是技能的公式上下文，因为 `Cost` 只用付款者求值。

**不写 `type` 的简写。** 数组里的一项也可以只写 `id` 与 `amount`，它会被读作 `mxt:resource`：

```json
{"id": "example:qi", "amount": 5}
```

上面这一项等价于 `{"type": "mxt:resource", "resource": "example:qi", "amount": 5}`。

付款者是**活着的实体**（玩家、生物、召唤物都算），不一定是玩家。`mxt:item` 需要玩家背包，付款者不是玩家（或阵法没有阵主）时就是**付不出**，而不是定义写错了；`mxt:js` 需要玩家，并且**在所有其它通道都付完之后最后运行**——脚本消耗不做暂存，所以脚本必须自己对它保持幂等。

整份数组是**全有或全无**的：任何一项付不出，就什么都不扣。同一数组里两项指向同一个存储（同一个数值写两次，或同一门灵气写两次）会让定义**加载失败**；而一个 `mxt:resource` 与一个用该数值度量的 `mxt:aura` 会把金额相加，那不是错误。解不出来的条目也会让定义加载失败，不会被静默丢弃。
