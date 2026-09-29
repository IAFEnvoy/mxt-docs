---
title: 储物
description: "给一件物品挂一条储物技能：格数怎么算、箱子存在哪、组件怎么预填，以及怎么在游戏里验证。"
---

# 储物

这一篇接在[储物与灵器](./storage-and-spirit-vessels.md)后面，是它的两篇子教程之一（另一篇是[飞行法器](./flying-mount.md)）。这里讲**储物技能**：挂在物品上、按一下打开一只箱子的那条路。

灵力容器与飞行都不在这一篇里：前者见父页，后者见那篇子教程。

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `data/example/mxt/ability/blade_storage.json` | 储物技能：声明格数与冷却。 |
| `data/example/mxt/artifact/blade_sheath.json` | 法器定义：认领物品、挂上这条技能、允许它进 Curios 槽。 |

两份都是普通的数据包定义，物品本身不用改。

## 第 1 步 —— 一条储物技能

储物技能就是一条普通技能，`type` 写 `mxt:storage`：

```json
// data/example/mxt/ability/blade_storage.json
{
  "type": "mxt:storage",
  "name": "剑鞘储物",
  "slots": 27,
  "cooldown": 20
}
```

它多读两个字段：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `slots` | 数字或公式串 | **必填** | 声明格数。 |
| `cooldown` | 数字或公式串 | `0` | 按下之后的冷却，单位 tick。 |

通用字段（`name`、`condition`、`icon` 这些）照旧可用，见 [ability（技能）](../datapack/json/ability.md)。

`slots` 的求值顺序是固定的：

1. 先把求值结果向下取整。
2. 负数按 `0` 算。
3. 按 9 格一行向上取整，得到行数。
4. 行数最多 6 行。

所以容量永远是 9 的倍数，而且最多 54 格：写 `27` 得到 27 格，写 `60` 得到 **54** 格，写 `0` 或负数的结果是按下去被拒绝。

## 第 2 步 —— 把技能挂到物品上

技能定义自己什么都不做。要让它落到玩家身上，得由一份法器定义认领物品并引用它：

```json
// data/example/mxt/artifact/blade_sheath.json
{
  "items": "minecraft:diamond_sword",
  "abilities": ["example:blade_storage"],
  "require_owner": false,
  "curios_equipable": true
}
```

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | 物品 id、`#标签` 或数组 | **必填** | 这份定义认领哪些物品。 |
| `abilities` | 技能 id 或 `#技能标签` 的数组 | `[]` | 给持有者哪些技能。 |
| `require_owner` | bool | `false` | 为真时只有主人能开。 |
| `curios_equipable` | bool | `false` | 允许这类法器放进 Curios 槽位。 |

技能被授予的时机只有两个：物品**拿在主手或副手**，或者**放进 Curios 槽**。没被授予就按不动。

`curios_equipable` 决定的也不只是「能不能放进槽位」，它同时决定**玩家能不能在轮盘里按到它**：

- 轮盘主盘的编辑器收两样东西：身体学会的技能，以及 Curios 槽里的法器声明的技能。
- 只由主手 / 副手物品声明出来的技能**不进主盘池**，它只出现在从盘的「主手物品」/「副手物品」那一页——手是随时会换的。

想让玩家稳稳按到储物，就把 `curios_equipable` 写成 `true`，并让物品待在 Curios 槽里。`charm` 的四个格收 `curios:charm` 标签里的物品，加上声明了 `curios_equipable: true` 的法器，这是最省事的位置。

轮盘怎么选、怎么用，见[轮盘、资源条与灵气 HUD](../player-guide/keys-and-hud.md)。

## 第 3 步 —— 按下之后

按一下那条储物技能，服务端开一个**原版箱子界面**。没有自定义界面，就是普通箱子那一套。

开箱之前先过三件事：

- 你是主人；或者 `require_owner` 为 `false` 且这件法器无主。
- 手上（或 Curios 槽里）有承载它的物品。
- 格数大于 0。

任何一条不成立，这次按下被拒绝。

箱子的内容存在物品的组件 `mxt:storage` 上。物品提示框会报一行「已用 / 总格数」，跟着箱子里的东西变。

## 第 4 步 —— 预填箱子内容

组件 `mxt:storage` 的值是一个**数组**，每条记录是一只箱子：

```json
[
  {
    "id": "example:blade_storage",
    "value": {
      "type": "mxt:container",
      "contents": [
        {"id": "minecraft:stone", "count": 3}
      ]
    }
  }
]
```

- `id` **必须就是那条储物技能自己的注册表 id**。同一件物品上挂两条储物技能，就是两条记录、两只互不相干的箱子；换一个 `id` 就是换一只箱子。
- `contents` 是物品堆列表，默认空数组。列表里允许出现空堆，那表示这一格是空的——这是唯一正确的「空格」写法。写 `minecraft:air` 不是，它会让整包编码失败。
- 列表长度不必等于容量：读越界的位置返回空，关窗时再按容量补齐或截断。

数据包侧唯一能「预填」的办法就是原版组件语法：

```text
/give @s minecraft:diamond_sword[mxt:storage=[{"id":"example:blade_storage","value":{"type":"mxt:container","contents":[{"id":"minecraft:stone","count":3}]}}]]
```

配方产物、战利品函数也能这么写。**没有任何数据包行为或条件能把这只箱子读回来**：放进取出只能在打开的窗口里点。这套系统就是这样分工的——数据包负责预填，玩家在窗口里收发。

## 在游戏里验证

技能与法器都是数据包注册表里的定义，重新加载世界后才生效。

1. 发一件被这份定义认领的物品（`minecraft:diamond_sword`），放进 `charm` 槽位。
2. 打开轮盘配置界面，看右边池子里有没有这条储物技能——它应该和「学到的技能」排在一起。
3. 把它放进轮盘的一格，按「轮盘使用」：箱子的界面打开了。放几件东西进去，关掉，再按一次，东西还在。
4. 把物品从 Curios 槽里拿出来，再按一次：技能已经不在名册上，这一次被拒绝。
5. 只把物品拿在主手，再看轮盘配置界面：池子里没有它，它只在从盘的「主手物品」那一页。这是 `curios_equipable` 与放置位置一起决定的。
6. 看物品提示框：「已用 / 总格数」那一行跟着箱子里的东西变。
7. 把 `slots` 改成 `60` 再发一件、放进 Curios 槽：打开的是 6 行，一共 54 格。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 技能不在名册上，按下去被拒绝，提示是 `NOT_GRANTED` 一类 | 物品没有可用的用途，也没有任何来源授予这条技能。承载物拿在手上或放进 Curios 槽时才会被授予。 |
| 按下去被拒绝，提示框里连「已用 / 总格数」那一行都没有 | `slots` 求值 `≤ 0`。求值先向下取整，负数按 `0` 算。 |
| 写 `"slots": 60`，装出来只有 54 格 | 正常。行数最多 6，容量也就最多 54 格。**不报错**。 |
| 物品上的 `mxt:storage` 解码被直接拒绝 | 组件里两条记录的 `id` 与类型都相同。一个 `id` 就是一只箱子，写两遍不是「后者覆盖前者」。 |
| 一放东西就报整包编码失败 | `contents` 里写了 `minecraft:air`。空的那一格只能写空堆。 |
| 用 `mxt:modify_storage` 写 `{"type":"mxt:container"}`，箱子里什么也没多 | 那个行为写的是实体身上的状态，窗口读的是物品堆上的组件，两者之间没有桥。**不报错，也没有效果**。 |
| 储物技能里写 `storage_slots`、`components` 这类键毫无作用 | 没有这些键，未知键被静默忽略。**不报错**。 |

## 接下来

- [储物与灵器](./storage-and-spirit-vessels.md) —— 回到父页：灵力容器那件东西。
- [飞行法器](./flying-mount.md) —— 另一篇子教程：同一件物品的另一种声明。
- [技能类型](../datapack/types/other/ability.md) —— `mxt:storage` 自己的字段与按下时的失败原因。
- [artifact（法器）](../datapack/json/artifact.md) —— `items` / `abilities` / `require_owner` / `curios_equipable` 的完整字段表与提示框口径。
- [Curios 槽位](../player-guide/curios-slots.md) —— 哪几个槽位收 `curios_equipable` 的法器。
- [轮盘、资源条与灵气 HUD](../player-guide/keys-and-hud.md) —— 主盘与从盘怎么读装备给的技能。
- [实体行为类型](../datapack/types/action/entity_action_types.md) —— `mxt:modify_storage` 写的是哪一份存储。
