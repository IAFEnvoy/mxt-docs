---
title: 战利品与进度条件
description: MiXianTu 提供的战利品函数、战利品条件与进度准则，以及它们的字段和 JSON 示例。
---

# 战利品与进度条件

除数据包注册表之外，MiXianTu 还注册了一小批原版类型，让内容包可以在普通的战利品表、战利品修饰器和进度中读取并改变玩家的修炼状态。它们以 `"type": "mxt:..."` 的形式写在普通的原版 JSON 里——没有特殊的文件布局。

## 文件位置

| 种类 | 使用位置 |
| --- | --- |
| 进度准则 | `data/<namespace>/advancement/<path>.json` 中的 `criteria` 段 |
| 战利品函数与战利品条件 | `data/<namespace>/loot_table/<path>.json`，或任何接受原版战利品函数与条件的 JSON，例如方块或实体战利品表以及战利品修饰器 |

## 进度准则

四种准则形状相同：一个可选的 `definition` 过滤器，加上标准的原版玩家谓词。

| 准则 | 触发时机 | `definition` 的取值 |
| --- | --- | --- |
| `mxt:breakthrough` | 一次突破成功 | 所达到的境界阶段 |
| `mxt:ability` | 使用一个技能，包括作为一次复合施法的一部分所执行的每个技能 | 该技能 |
| `mxt:alchemy` | 一批炼丹完成 | 该配方 |
| `mxt:tribulation` | 一次天劫成功完成 | 该天劫 |

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `player` | `ContextAwarePredicate` | 无 | 作用于获得该进度的玩家的标准原版谓词 |
| `definition` | Identifier | 无 | 只对该定义触发；省略时任何定义都会触发该准则 |

```json
{
  "criteria": {
    "foundation": {
      "trigger": "mxt:breakthrough",
      "conditions": {
        "definition": "example:foundation"
      }
    }
  },
  "requirements": [["foundation"]]
}
```

## 战利品条件

战利品条件使用原版的 `"condition"` 分派键：`{"condition": "mxt:has_ability", ...}`。

| 条件 | 为真的情形 | 必填字段 |
| --- | --- | --- |
| `mxt:has_ability` | 该实体已被授予此技能 | `ability` |
| `mxt:has_curse` | 该实体带有查询所接受的诅咒（`curse?`、`tags?`、`stacks?`、`remaining_ticks?` 全部可选，且都必须对同一个实例成立） | — |
| `mxt:realm` | 该实体处于该境界，任意资源链均可 | `realm` |
| `mxt:has_spirit_root` | 该实体拥有该灵根 | `spirit_root` |
| `mxt:has_physique` | 该实体拥有该体质 | `physique` |
| `mxt:js` | 一个服务端脚本回调返回 `true` | `id` |

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `entity` | `EntityTarget` | `this` | 检查战利品上下文中的哪个实体：`this`、`attacker`、`direct_attacker`、`attacking_player`、`target_entity` 或 `interacting_entity` |

当所选实体不在战利品上下文中时，该条件为假。

```json
{
  "conditions": [
    {"condition": "mxt:has_spirit_root", "spirit_root": "example:fire_root"},
    {"condition": "mxt:realm", "realm": "example:foundation"}
  ]
}
```

`mxt:js` 接受一个用 `MxtLoot.condition(...)` 注册的 `id`，以及一个可选的 `params` 对象。与内置条件不同，它没有 `entity` 字段：回调收到完整的原版 `LootContext`，由它自己决定读取哪个实体。

```json
{"condition": "mxt:js", "id": "example:first_clear", "params": {"dungeon": "example:fire_temple"}}
```

## 战利品函数

战利品函数使用原版的 `"function"` 分派键：`{"function": "mxt:grant_ability", ...}`。每个函数也都接受原版的 `conditions` 字段。

| 函数 | 效果 |
| --- | --- |
| `mxt:grant_ability` | 授予实体一个持久技能来源，并刷新它的事件规则订阅 |
| `mxt:set_artifact_owner` | 把掉落出的法器归属给某个实体，然后运行该法器原型的 `refine_action` |
| `mxt:apply_curse` | 对某个实体施加一个诅咒，以 `loot` 作为施加来源 |
| `mxt:js` | 用服务端脚本返回的内容替换生成的物品栈 |

### `mxt:grant_ability`

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `ability` | Identifier | **必填** | 要授予的技能 |
| `entity` | `EntityTarget` | `this` | 接受该技能的实体 |
| `source` | Identifier | `mxt:loot` | 随授予一起记录的来源 id，以便按来源撤销该技能 |

```json
{
  "function": "mxt:grant_ability",
  "ability": "example:fire_manual",
  "source": "example:fire_temple"
}
```

### `mxt:set_artifact_owner`

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `entity` | `EntityTarget` | `this` | 成为该法器拥有者的实体 |

如果该物品栈已经属于另一个拥有者，则什么也不会发生：掉落物保持原样，`refine_action` 也不会运行。

```json
{
  "function": "mxt:set_artifact_owner"
}
```

### `mxt:apply_curse`

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `curse` | Identifier | **必填** | 要施加的诅咒 |
| `stacks` | Integer `1..256` | `1` | 施加多少层该诅咒 |
| `entity` | `EntityTarget` | `this` | 接受该诅咒的实体 |

```json
{
  "function": "mxt:apply_curse",
  "curse": "example:blood_oath",
  "stacks": 2
}
```

### `mxt:js`

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | String | **必填** | 用 `MxtLoot.function(...)` 注册的回调 ID |
| `params` | Object | `{}` | 传给回调的任意 JSON |

```json
{
  "function": "mxt:js",
  "id": "example:bless",
  "params": {"multiplier": 3}
}
```

回调收到生成的物品栈和 `LootContext`，并返回要保留的物品栈：原样返回入参表示不动掉落物，返回新的物品栈表示替换它，返回 `null` 表示保留原物品。回调缺失或执行失败时，物品栈保持不变，并记录一条警告。

## 综合示例

一个只对已经拥有对应灵根的玩家掉落一本手册的箱子：

```json
{
  "type": "minecraft:chest",
  "pools": [
    {
      "rolls": 1,
      "entries": [
        {"type": "minecraft:item", "name": "minecraft:book"}
      ],
      "conditions": [
        {"condition": "mxt:has_spirit_root", "spirit_root": "example:fire_root"}
      ],
      "functions": [
        {"function": "mxt:grant_ability", "ability": "example:fire_manual"}
      ]
    }
  ]
}
```
