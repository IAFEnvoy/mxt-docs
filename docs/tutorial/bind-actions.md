---
title: KubeJS 绑定行为
description: "四张绑定表各自的钩子：什么时候执行、受什么限制、条件怎么写、先后怎么算。"
---

# KubeJS 绑定行为

[KubeJS 创建物品并绑定行为](./create-items-with-kubejs.md)讲的是"物品怎么注册"和"哪张表认领它"。这页接着往下走，只回答一个问题：**钩子里的行为到底什么时候跑。**

四张绑定表各自挂在自己的时机上，谁也不等谁：物品的表在"用完"之后跑，武器的三个钩子分别挂在右键、命中和每 tick 上，丹药的行为在吃完之后接上（它们写在丹药定义上，不写在绑定上）。写错一行代码不会报错——它只是永远不执行。

## 你要搭建什么

这页继续用主篇那四件物品，改动落在它们已有的绑定文件里：

| 文件 | 这页加上什么 |
| --- | --- |
| `data/mxt/data_maps/item/item_binding.json` | 两个有先后关系的实体行为。 |
| `data/mxt/data_maps/item/item_binding.json` | 一条带描述、会在提示框里显示勾叉的条件。 |
| `data/mxt/data_maps/item/weapon_binding.json` | 右键、命中、每 tick 三个钩子各一个行为。 |
| `data/example/mxt/pill/qi_pill.json` | 过量那一行的行为。 |

## 第 1 步 —— 各表各有哪些钩子

| 表 | 钩子 | 类型 | 可省 |
| --- | --- | --- | --- |
| `item_binding` | `actions`（**数组**） | 实体行为 | 是，默认空 |
| `weapon_binding` | `use_action` | 实体行为 | 是 |
| `weapon_binding` | `attack_action` | 双实体行为 | 是 |
| `weapon_binding` | `tick_action` | 实体行为 | 是 |
| `pill` | `on_consume` | 实体行为 | 是 |
| `pill` | `on_overdose` | 实体行为 | 是 |
| `technique_binding` | —— | 没有任何行为钩子 | —— |

三条要先记住的：

- **省略一个钩子不是"什么都不写"，而是写入一个空操作。** 空操作什么都不做，也不会报错，所以"我明明没写"和"我写了但没生效"在日志里长得一样。
- **单个行为与行为数组**：除 `item_binding.actions` 之外，其余钩子两种写法都收；`actions` **只能写数组**，写单个对象会让那份文件解码失败。
- **钩子写在不对的表里会被静默丢掉。** 表不声明某个键时，那个键就是未知键，加载时直接忽略——`item_binding` 里写 `use_action`、`pill_binding` 里写 `on_consume`，都不会报错，也都不会生效。

## 第 2 步 —— 通用绑定的行为

```json
// data/mxt/data_maps/item/item_binding.json
{
  "values": {
    "kubejs:qi_pill": {
      "conditions": [
        {
          "condition": {"type": "mxt:has_realm", "aura": "example:qi"},
          "description": "condition.example.needs_qi_chain"
        }
      ],
      "actions": [
        {"type": "mxt:add_resource", "resource": "example:qi", "amount": 25},
        {"type": "mxt:apply_effect", "effect": "minecraft:regeneration", "duration_ticks": 60}
      ]
    }
  }
}
```

`actions` 在**一次完整的使用周期结束时**按数组顺序执行，对丹药就是"吃掉之后"。这里有两个后果：

- 物品必须有使用周期。食物与带 `minecraft:consumable` 组件的物品有；一件只有名字的普通物品没有，`actions` 永远不会跑。
- 行为跑的时候，物品**已经被消耗掉了**。"消耗"与"使用"不是两道门，是同一件事的两个时刻：条件在开始使用时判，行为在结束时跑。

条件只在"开始使用"这道门上查一次。**行为执行时不复查**——开始使用之后条件再怎么变，这一次结算照旧，也不会补跑第二次。

## 第 3 步 —— 武器的三个钩子

```json
// data/mxt/data_maps/item/weapon_binding.json
{
  "values": {
    "kubejs:spirit_sword": {
      "attributes": [
        {"attribute": "minecraft:attack_damage", "id": "example:spirit_sword/damage", "amount": 8, "operation": "add_value"}
      ],
      "use_action": {
        "type": "mxt:apply_effect",
        "effect": "minecraft:speed",
        "duration_ticks": 100
      },
      "attack_action": {
        "type": "mxt:target_action",
        "action": {"type": "mxt:damage", "amount": 3}
      },
      "tick_action": {"type": "mxt:no_op"}
    }
  }
}
```

| 钩子 | 什么时候跑 | 限制 |
| --- | --- | --- |
| `use_action` | 右键"使用物品" | 只认**主手**；瞄准方块或生物时那一次右键不算"使用物品"，不会触发 |
| `attack_action` | 玩家攻击到实体 | 只认**主手**；生物挥砍不算，只有玩家打 |
| `tick_action` | 每 tick 一次（满速下一拍 20 次） | 只认**主手**；服务端执行 |

`attributes` 与三个钩子不一样：属性修饰符**两侧都刷**，所以把武器放在副手也吃攻击力与攻速。

## 第 4 步 —— 丹药的钩子

丹药的两个行为钩子写在**丹药定义**（[pill](../datapack/json/pill.md)）上，不写在绑定上：`on_consume` 在正常消耗流程结束之后跑，`on_overdose` 只在丹毒累积越线时才跑。两者与 `item_binding` 的行为彼此独立：同一枚丹药同时挂两张表时**两个都会跑**，顺序是 `item_binding` 的行为在前、`on_consume` 在后，`on_overdose` 在丹毒越线之后。哪一族物品是这份丹药、能服用几次由[丹药绑定](../datapack/json/pill_binding.md)给。

## 第 5 步 —— 条件的两副面孔

```json
// data/mxt/data_maps/item/item_binding.json
{
  "values": {
    "kubejs:root_pellet": {
      "conditions": [
        {"type": "mxt:has_spirit_root", "spirit_root": "example:fire_root"},
        {
          "condition": {"type": "mxt:has_realm", "aura": "example:qi"},
          "description": "condition.example.needs_qi_chain"
        }
      ],
      "actions": [
        {"type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root"}
      ]
    }
  }
}
```

同一个 `conditions` 数组里两种写法可以混用：

- **裸条件**参与判定，但不显示。
- **`{condition, description}`** 也参与判定，并且在提示框里多画一行：绿色的 `✔` 或红色的 `✖`，后面跟 `description` 指向的文本。`description` 是**语言键**，不是自由文本。

两条容易踩的：

- 物品解析出的**品质自己也带条件**，它和绑定条件走同一道门。提示框上的 `✖` 可能来自品质，不是来自绑定。
- 绑定条件在**实体自己的上下文**里求值，拿不到攻击事件里的东西。"对方血量""对方是不是生物"这类只在 `attack_action` 自己的上下文里存在，写进武器的 `conditions` 里读不到（读不到按 0 处理，于是条件几乎永远不成立）。

## 第 6 步 —— 先后顺序

- **同一张表里：先条件，后行为。** 条件不成立就整条不跑。
- **同一次使用周期里：**`item_binding` 的行为 → `pill.on_consume` → 丹毒累积 → 越线才 `pill.on_overdose`。
- **跨表之间没有统一顺序。** 每张表挂在自己的事件上，谁先谁后由事件决定，不要依赖"功法学习和物品行为谁先跑"这种顺序。

## 在游戏里验证

```text
(load the world again)     → the binding changes load
```

1. 拿一枚 `kubejs:qi_pill`，看提示框：带 `description` 的那条条件应该显示一行彩色勾叉。
2. 不满足条件时右键：物品会被拒绝使用，动作栏给你一句话；满足之后吃掉，看灵气是否按 `actions` 的数值上涨。
3. 拿 `kubejs:spirit_sword`，右键对着**空气**看 `use_action` 的效果；再对着**方块**右键，确认那一次不触发。
4. 用剑攻击一个目标，确认 `attack_action` 的额外伤害。
5. 吃满十枚丹药，确认过量那一行执行。
6. 把 `tick_action` 临时换成一个能看见的行为（例如给自己一个很短的正面效果），站着不动看它是否每 tick 刷一次，确认完再换回空操作。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 行为从不执行，也没有报错 | 钩子写在了不声明它的表里，或者物品没有使用周期（`item_binding` 的行为需要一次完整的使用周期）。 |
| 右键武器没反应 | 你正对着方块或生物——那一次右键不走"使用物品"。 |
| 副手的武器没有行为 | 三个钩子只认主手。`attributes` 不受这个限制。 |
| 条件明明成立了，物品还是用不了 | 同一道门上还有品质自己的条件与使用次数、冷却。 |
| 条件写进 `weapon_binding.conditions` 后永远不成立 | 那里读不到攻击事件里的目标信息，只能读实体自己的状态。 |
| `actions` 只写了一个对象 | `item_binding.actions` 只收数组。 |
| 两个行为同时想用一个钩子 | 一个钩子只能写一个行为；要连着做几件事就写成数组（或在数组里放一个序列）。 |
| 改了绑定没反应 | `/reload` 不重读数据包注册表，也不重读数据表；重新加载世界。 |

## 接下来

- [KubeJS 创建物品并绑定行为](./create-items-with-kubejs.md) —— 物品怎么注册、四张表各自认领什么。
- [定义技能](./add-an-ability.md) —— 行为里那些技能是从哪来的。
- [实体行为](../datapack/types/action/entity_action_types.md)、[双实体行为](../datapack/types/action/bientity_action_types.md)、[实体条件](../datapack/types/condition/entity_condition_types.md) —— 可以填进钩子的全部类型。
- [KubeJS API 参考](../kubejs/api-reference.md) —— 想在脚本里写行为本身。
