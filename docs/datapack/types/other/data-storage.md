---
title: data_storage_type（数据存储）
description: mxt:data_storage_type 的各项：六种内容可写状态、容器与默认状态的声明字段与状态字段，以及 family + id 的地址写法。
---

# data_storage_type（数据存储）

技能运行期留下的状态按**种类**存，每份值顶层的 `type` 取自注册表 `mxt:data_storage_type`。种类决定这份值存什么，字段分两半：**声明字段**是这个种类在宿主上被声明时定下的参数，**状态字段**是写值的一方填进去的当前值。

内容写入用实体行为 [`mxt:modify_storage`](../action/entity_action_types)，读取用六个 `mxt:storage_toggle` / `mxt:storage_timer` / `mxt:storage_resource` / `mxt:storage_target` / `mxt:storage_charges` / `mxt:storage_cooldown` 实体条件。这些条件各自的字段、判定与什么时候被读，见[技能施放](/technical/ability)。只有宿主**声明过**的种类写得进也读得到；哪个技能类型声明哪些种类见[技能类型](./ability)。

## `data_storage_type`

下面九项里，前六项是内容能写的那六种；`mxt:container`、`mxt:active_state` 与 `mxt:empty` 都不在这六种里。

### `mxt:toggle`

一个开关。

| 种类 | 声明字段 | 状态字段 |
| --- | --- | --- |
| `mxt:toggle` | 无 | `default`、`state` |

```json
{"type": "mxt:toggle", "default": false, "state": true}
```

`state` 是当前开关；它没写过时读作 `default`，`default` 缺省 `false`。

### `mxt:timer`

一段正在跑的计时。

| 种类 | 声明字段 | 状态字段 |
| --- | --- | --- |
| `mxt:timer` | `duration` | `ends_at` |

```json
{"type": "mxt:timer", "duration": 100, "ends_at": 2400}
```

`duration` 是这次计时有多长，`ends_at` 是它结束的那一 tick。读取方只看 `ends_at`，没有它就是没在跑。

### `mxt:resource`

为某个数值存的一个数。

| 种类 | 声明字段 | 状态字段 |
| --- | --- | --- |
| `mxt:resource` | 无 | `resource`、`amount` |

```json
{"type": "mxt:resource", "resource": "example:qi", "amount": 5}
```

`resource` 指向哪个数值，`amount` 是为它保存的数量；两者都由写值方给，都可以省。

### `mxt:target_lock`

锁着一个目标。

| 种类 | 声明字段 | 状态字段 |
| --- | --- | --- |
| `mxt:target_lock` | `range` | `target` |

```json
{"type": "mxt:target_lock", "range": 16, "target": "5c1f0b3a-9c1e-4f5a-8b2d-7e6a1c2d3e4f"}
```

`range` 是这个种类声明的一部分；`target` 是被锁定实体的 UUID，写成字符串。

### `mxt:charges`

一池可用的次数。

| 种类 | 声明字段 | 状态字段 |
| --- | --- | --- |
| `mxt:charges` | `maximum`、`recharge_ticks` | `remaining`、`last_change` |

```json
{"type": "mxt:charges", "maximum": 3, "recharge_ticks": "100 - level * 5"}
```

```json
{"type": "mxt:charges", "maximum": 3, "recharge_ticks": 100, "remaining": 1}
```

技能定义上写的 `charges` 就是这个种类的两个声明字段：最多几次、每多少刻回一次。`remaining` 是还剩几次，没写过就读作满；`last_change` 是上一次变化的 tick，也是自动回复的锚点。

### `mxt:cooldown`

一段冷却。

| 种类 | 声明字段 | 状态字段 |
| --- | --- | --- |
| `mxt:cooldown` | 无 | `duration`、`started_at` |

```json
{"type": "mxt:cooldown", "duration": 40, "started_at": 1200}
```

长度不写在这个种类上，技能自己的 `cooldown` 字段写多长，这里就存多长；`started_at` 是这次冷却开始的那一 tick。没带 `duration` 的存值读作零长度冷却，也就是没在冷却。内容写它要当心：写进去的 `duration` 真的会拦住施放，起点按写入那一刻算。

### `mxt:container`

承载物自带储物格里的内容。

| 种类 | 声明字段 | 状态字段 |
| --- | --- | --- |
| `mxt:container` | 无 | `contents` |

```json
{"type": "mxt:container", "contents": [{"id": "minecraft:iron_ingot", "count": 2}]}
```

格数不在这里写，来自 `mxt:storage` 技能类型自己的 `slots`。`contents` 按格数补齐，空堆表示空格。它住在物品那一侧的组件 `mxt:storage` 上，内容写不进去，六个条件里也没有读它的那一个。

### `mxt:active_state`

默认就在的那一个。

| 种类 | 声明字段 | 状态字段 |
| --- | --- | --- |
| `mxt:active_state` | 无 | `active` |

```json
{"type": "mxt:active_state", "active": true}
```

所有宿主都带着它，记的是 `condition` 上一次求值的结果，运行期拿它判断技能什么时候算生效；`active` 缺省 `false`。它不是给内容读的开关，要读开关用 `mxt:toggle`。

### `mxt:empty`

空种类。

| 种类 | 声明字段 | 状态字段 |
| --- | --- | --- |
| `mxt:empty` | 无 | 无 |

```json
{"type": "mxt:empty"}
```

它表示这个宿主自己不保存状态，两种字段都没有。

## 地址

数据包侧用两个字段寻址：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `family` | 注册表 id | **必填** | 宿主所在的数据包注册表 |
| `id` | 标识符 | **必填** | 宿主自身 |

今天 `family` 只有 `mxt:ability`，`id` 就是技能自己的 id。**一对地址只有一条记录**，写入是整份替换：同一个宿主加同一种类写两次，第二条换掉第一条；同一个宿主上每种种类最多一条，因为种类本身就是槽位，不给槽位起名字，所以一个技能不可能同时存两份 `mxt:charges`。

`mxt:storage_cooldown` 是读取那一侧的例外：每次付款都会写冷却，所以走付款闸门的技能都能被它读出来。

```json
{
  "type": "mxt:modify_storage",
  "family": "mxt:ability",
  "id": "example:iron_palm",
  "value": {"type": "mxt:charges", "maximum": 3, "recharge_ticks": 100, "remaining": 2}
}
```
