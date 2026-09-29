---
title: 储物与灵器
description: "灵力容器那件东西的形状与边界；储物与飞行法器各有一篇子教程。"
---

# 储物与灵器

本模组里有三样东西都长得像「容器」、或者都挂在物品上，它们之间没有任何关系：

- **储物技能**（`mxt:storage`）挂在物品上，按一下打开一只箱子。箱子的内容存在物品堆的组件里，玩家在打开的窗口里点进点出。→ [子教程：储物](./storage.md)
- **灵力容器**是物品 `mxt:spirit_vessel`：它拿着某个数值的一份便携副本，右键把量搬进 / 搬出你身上的账户。没有窗口、没有菜单、没有技能。→ **本篇**
- **飞行法器**是同一件物品的另一种声明：法器声明"我能飞"，一条由功法这类常驻来源授予的术负责按一下。→ [子教程：飞行法器](./flying-mount.md)

这篇只讲**灵力容器**——它不需要任何数据包定义。

## 你要搭建什么

灵力容器是本体物品，没有定义文件：用命令发一个就够。另外两样各有自己的定义要写，去它们那两篇子教程。

## 第 1 步 —— 灵力容器

物品 `mxt:spirit_vessel` 拿着一份浮点数值的便携副本：

- 右键把里面的量搬进**你身上的数值账户**。
- 潜行右键从账户里搬回去。
- 没有窗口、没有菜单、没有技能。

它的组件是 `mxt:resource_container`，值是一张**裸映射**——没有 `values` 外层：

```json
{
  "example:qi": 25.0
}
```

- 键是 `resource` 定义的 id，值是数量。
- 写 `0` 会把那个键删掉。
- 坏条目只记一行日志然后被丢弃：拼错一个 id 不会报错，你拿到的是一个空容器。
- 每种数值的容量写死在代码里，是 **1000**，数据包改不了。

发一个带初始量的灵力容器：

```text
/give @s mxt:spirit_vessel[mxt:resource_container={"example:qi":25.0}]
```

`resource` 定义本身见 [resource（资源）](../datapack/json/resource.md)，`mxt:spirit_vessel` 与其它统一功能载体见[通用物品](../player-guide/items.md)。

## 在游戏里验证

发一个带 `mxt:resource_container` 的 `mxt:spirit_vessel`：右键把量搬进身上的账户，潜行右键搬回来。整个过程没有窗口，也不消耗任何技能。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| `mxt:resource_container` 按 `{ "values": { … } }` 写，容器是空的 | 外壳不对。解不出条目、只记一行日志，得到空容器。**不报错**。 |
| 容器里写了一个拼错的 `resource` id | 坏条目被丢弃并记一行日志，其余键照常。**不报错**。 |

## 接下来

- [储物](./storage.md) —— 子教程：一条挂在物品上的储物技能，格数怎么算、箱子存在哪、怎么预填。
- [飞行法器](./flying-mount.md) —— 子教程：一件会飞的物品，载具、术与两笔燃料账。
- [通用物品](../player-guide/items.md) —— `mxt:spirit_vessel` 与 `mxt:resource_container` 的组件写法。
- [resource（资源）](../datapack/json/resource.md) —— 灵力容器里那些键引用的是哪张注册表。
- [artifact（法器）](../datapack/json/artifact.md) —— 两篇子教程都要用到的那份定义。
- [轮盘、资源条与灵气 HUD](../player-guide/keys-and-hud.md) —— 按一下会发生什么，以及轮盘上的格子。
