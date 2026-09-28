---
title: 编写双修功法
description: "在修炼行为上写一条只有身边有人时才出成果的法门：判据怎么拼、两人各自怎么进得去、对方走开时停不停，以及怎么在游戏里验证。"
---

# 编写双修功法

这一篇接在[定义灵气与境界](./define-aura-and-realms.md)后面：那篇搭出了单人修炼循环，这篇在同一个包里再加一条**身边有人才拿得到成果**的法门。框架不为双修准备任何加成，它只是一条判据；快多少、花多少、给什么都由你写。

## 你要搭建什么

- 一条 `cultivate_action`，它"这一拍拿不拿得到成果"问的是"旁边有没有一个拿着功法手册的好友"。
- 那条判据由三样现成的东西拼成：`mxt:partner`（扫附近的人）、`mxt:target_condition`（把问题问到对方身上）、`mxt:main_hand_item`（问对方主手拿着什么）。
- 两个选择：对方走开时，是"我还坐着、只是没有成果"，还是"我也跟着停"。
- 两个人各自拿到那本手册的办法。

## 第 1 步 —— 一条法门

```json
// data/example/mxt/cultivate_action/dual_meditation.json
{
  "priority": 10,
  "tick_interval": 20,
  "absorb_amount": "3 + realm_rank * 0.15",
  "aura_costs": [{ "type": "mxt:aura", "aura": "example:qi", "amount": 1 }],
  "cultivate_condition": {
    "type": "mxt:partner",
    "range": 5.0,
    "count": { "min": 1, "max": 1 },
    "bientity_condition": {
      "type": "and",
      "conditions": [
        { "type": "friend" },
        { "type": "target_condition",
          "condition": { "type": "mxt:main_hand_item",
            "item_condition": { "type": "mxt:has_component", "component": "mxt:technique" } } }
      ]
    }
  }
}
```

| 字段 | 在这里干什么 |
| --- | --- |
| `priority` | 比单人那条高，两条都能用时选这条。 |
| `cultivate_condition` | 这一拍给不给成果。不成立时不扣钱、不给收获，人照旧坐在那儿。 |
| `absorb_amount` | 双修的回报写在这里，高于单人法门即可。 |
| `tick_interval` / `aura_costs` | 结算间隔与花费，和单人法门一样按拍算。 |

`mxt:partner` 以自己为球心扫 `range` 格内的存活生物，自己不算，每个候选过一遍 `bientity_condition`——那里 actor 是自己、target 是候选。`count` 是命中数量的窗口，`{ "min": 1, "max": 1 }` 就是"正好一个人"；不写 `max` 就是"至少一个"。

内层的 `mxt:target_condition` 把一条**实体条件**作用到候选身上，所以里面的 `mxt:main_hand_item` 问的是**对方**的主手，不是自己的。`mxt:has_component` 配 `component: "mxt:technique"` 只要求"那一叠是功法手册"，不挑哪一门——两个人拿不同功法的手册也算；要限定同一门，看第 4 步。

`mxt:friend` 让判据只认好友。门派内部的双修换成 `mxt:same_team`，不需要任何关系的就整条删掉。

注意：`mxt:main_hand_item` 只看**主手**，拿在副手不算，空手也不成立。

## 第 2 步 —— 判据中不要包含「对方在修炼」

这是同一条法门里唯一容易写错的地方。`start_condition` 与 `cultivate_condition` 是**挑法门时就要问的**（谁能坐下、坐下有没有成果），而"对方也在修炼"在没人坐下之前必然为假：

- 写进 `start_condition` 或 `cultivate_condition`：两个人都还没坐下，双方的法门都不适用，于是**谁也进不去**。
- 写进 `tick_condition`：只在已经开始修炼之后才问，所以第一个人坐得下；它的含义是"对方一起身我也停"。

所以"此刻能不能一起拿成果"要问**手上拿着什么**（坐下之前就能成立），"在不在修炼"只能写在 `tick_condition` 里：

```json
"tick_condition": {
  "type": "mxt:partner",
  "range": 5.0,
  "bientity_condition": {
    "type": "and",
    "conditions": [
      { "type": "target_condition", "condition": { "type": "mxt:cultivating" } },
      { "type": "friend" }
    ]
  }
}
```

不加这一段，双修就是"各修各的，只是必须有人陪着"；加上，它就是"两个人一起入定、一个散了另一个也散"。

## 第 3 步 —— 需要场地时使用 start_condition

"得坐在蒲团上"这类要求写在 `start_condition` 里，它只决定能不能坐下，坐在那儿之后不再问：

```json
"start_condition": {
  "type": "mxt:on_block",
  "condition": { "type": "mxt:block_tag", "tag": "example:meditation_seats" }
}
```

标签文件放在 `data/example/tags/block/meditation_seats.json`，把允许的方块写进去。想改成"骑着某个东西"就用 `mxt:riding` 套一条双实体条件，写法与 `mxt:partner` 的内层一样。

## 第 4 步 —— 双方手册的来源

判据问的是"主手持有的是否功法手册"，所以双方主手都得拿一本。手册的身份是堆上的 `mxt:technique` 组件，不需要专用物品——用包里已有的那门功法即可：

```mcfunction
give @p mxt:cultivation_jade_slip[mxt:technique="example:azure_breath"]
```

要精确到"必须是同一门功法的手册"，给这门功法一条[功法绑定](../datapack/json/technique_binding.md)，把专属载体写进它的 `items`（或 `carrier_item`），再把内层物品条件换成点名物品的写法：

```json
{ "type": "mxt:item_id", "item": "example:dual_manual" }
```

## 第 5 步 —— 提高双修收益

回报有两个现成的出口，都在同一条定义里：

- **速率**：把 `absorb_amount` 写高（上面就是 `3 + realm_rank * 0.15`，单人那条是 `1.5`）。
- **额外收获**：`tick_action` 里加熟练度或资源。它**只在真的结算的那一拍跑**——也就是 `cultivate_condition` 成立的那些拍——所以不必再套一层条件：

```json
"tick_action": { "type": "mxt:add_resource", "resource": "example:qi_mastery", "amount": "2" }
```

## 在游戏里验证

1. 两个玩家站在 5 格内，互为好友，主手各拿一本手册，各自按下修炼按键。两个人都进得去，`/mxt cultivate status` 显示跑的是这条法门。
2. 资源条与修为开始涨，速度比单人那条快。
3. 其中一个人走出 5 格，或者把手册换到副手、收起来：两边**都还在修炼**，但从下一拍起没有成果——资源条停住，`aura_costs` 也不再扣。
4. 如果写了第 2 步的 `tick_condition`：走开之后的下一个结算拍两边都停，动作栏提示「修炼无法继续：不满足修炼条件」。
5. 一个人单独按下修炼按键：动作栏提示「没有一门当下能修的法门」。`cultivate_condition` 不成立的法门根本不会被选中，所以人不会先坐下再被停。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 两个人都进不去，提示没有可用的法门 | 把"对方也在修炼"写进了 `start_condition` 或 `cultivate_condition`。它只可能写在 `tick_condition` 里。 |
| 手里有手册，判据还是不成立 | `mxt:main_hand_item` 只看主手；另外手册的身份是堆上的 `mxt:technique` 组件，不带组件的玉简只是一块玉简。 |
| 走远了照样有成果 | 判据只写在 `tick_condition` 里——那只管停不停，不管给不给；也可能是 `range` 开得太大。 |
| 对方明明没在修，两人挨着也算 | 判据问的是"手上拿着什么"而不是"在不在修"。要求双方都入定就把 `mxt:cultivating` 加进 `tick_condition`。 |
| 站在一起却挑不到这条法门 | `range` 是以自己为球心的球形半径，上限 `32`；`count` 的 `max` 写成 `1` 时，旁边多一个人就不成立。 |
| 人一多服务器就卡 | 这条判据每次结算、每次挑法门都要扫一遍附近实体。不要把它写进大多数法门。 |

## 接下来

- [cultivate_action（修炼行为）](../datapack/json/cultivate_action.md) —— 三个条件的分工与全部字段。
- [实体条件类型](../datapack/types/condition/entity_condition_types.md) —— `mxt:partner`、`mxt:main_hand_item`、`mxt:cultivating` 的字段表。
- [功法绑定](../datapack/json/technique_binding.md) —— 手册怎么被读、专属载体物品怎么给。
