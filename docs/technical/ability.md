---
title: 技能施放
description: 一次施放要过哪些闸门、按键型与直接施放的区别、技能状态（冷却、充能、开关、计时、锁目标）怎么存、怎么写、怎么读。
---

# 技能施放

数据包侧只写字段，这一页讲这些字段**什么时候被读**，以及技能运行期留下的状态存在哪里、内容能碰哪些。

## 一次施放的闸门顺序

不管从哪条路来，一次施放都按同一个顺序过闸门：

| 顺序 | 闸门 | 不通过时 |
| --- | --- | --- |
| 1 | 授予 | `NOT_GRANTED` |
| 2 | 冷却 | 冷却中，拒付 |
| 3 | `condition` | 条件不成立，拒付 |
| 4 | `element_affinity` | 没有匹配灵根，`ELEMENT_AFFINITY` |
| 5 | 充能 | 剩余不足 1，`NO_CHARGES` |
| 6 | `costs` | 付不出，整份拒付并还原已写入的部分 |
| 7 | 执行动作字段 | —— |
| 8 | 落账：写冷却、扣一次充能 | —— |

`cast_time > 0` 时，第 6 步之后不立刻执行，而是记下一个到点时刻，到那一 tick 才跑第 7 步。

条件、代价、冷却、充能这几道闸门只有**会付款的类型**有。`mxt:interval`、`mxt:modifier`、`mxt:mount`、`mxt:upkeep`、`mxt:empty` 不付款，也没有冷却与充能。

## 两条路

**按键**：轮盘上的一格，按一下发动。只有五个类型会被放进轮盘：`mxt:active`、`mxt:channelled`、`mxt:targeted`、`mxt:storage`、`mxt:flight_control`。其中 `mxt:storage` 与 `mxt:flight_control` 走的是**短路径**——只查冷却、条件与代价，不扣充能、不跑动作字段（它们本来也没有）。

**直接施放**：命令 `/mxt ability cast`、KubeJS、物品承载的技能，对**任何类型**都直接施放，不看它是不是按键型。这条路照常过完整套闸门。

轮盘上已保存的格子也算第二条路：布局是落盘的，里面可能点名一条不可按键的技能，服务端仍然受理。

## 状态存在哪里

技能的状态住在**技能自己的附件**里，一个技能一份。附件挂在实体上，跟着存档，也同步给客户端。

附件里每条记录按两个维度寻址：**技能自己的 id** 加 **状态种类**。不同技能 id 互不影响，同一个技能在两个人身上也互不影响。

数据包侧的地址写成两个字段：`family` 是宿主所在的注册表（今天只有 `mxt:ability`），`id` 是宿主自身。

一对地址只有一条记录，写入是替换。同一技能 id 加同一种类写两次，第二条换掉第一条。

## 六种内容可用的状态

| 种类 | 声明字段 | 状态字段 |
| --- | --- | --- |
| `mxt:toggle` | 无 | `default`（没写过时读作什么，缺省 `false`）、`state` |
| `mxt:timer` | `duration` | `ends_at` |
| `mxt:resource` | 无 | `resource`、`amount` |
| `mxt:target_lock` | `range` | `target`（UUID 字符串） |
| `mxt:charges` | `maximum`、`recharge_ticks` | `remaining`、`last_change` |
| `mxt:cooldown` | 无 | `duration`、`started_at` |

**声明字段**属于定义的一侧，内容写进去时按它自己的 `type` 一起给；**状态字段**是运行期填的。

这六种内容**能写，但只有宿主声明过才写得进**。宿主声明哪些种类由技能的 `type` 决定，见[技能类型](/datapack/types/other/ability)。

默认的 `mxt:active_state` 不在这六种里：它记的是 `condition` 上一次求值的结果，是运行期比对生效边沿用的，内容碰不到它。要读开关用 `mxt:toggle`。

`mxt:container` 也不在这六种里：它住在物品组件 `mxt:storage` 上，归 `mxt:storage` 技能类型一个人用，只有运行期维护它。

## 冷却

冷却长度只来自技能自己的 `cooldown` 字段，写进 `mxt:cooldown` 状态。`mxt:cooldown` 自己没有长度字段。

内容写它要当心：`mxt:modify_storage` 写进去的 `duration` **真的会拦住施放**，开始时刻按写入那一刻算。没带 `duration` 的存值读作零长度冷却，也就是没在冷却。

`mxt:interval`、`mxt:modifier`、`mxt:mount`、`mxt:upkeep`、`mxt:empty` 被强制施放时才会写一次。

## 充能

`charges` 是技能定义上唯一的状态参数：`{"maximum": ..., "recharge_ticks": ...}`，两个都必填。

**只有走完整闸门的付款扣它**：剩余不足 1 就 `NO_CHARGES` 拒付，落账后扣 1。走短路径的两个按键（`mxt:storage` / `mxt:flight_control`）不扣充能。

充能自己会回复：有 `remaining`、还没到 `maximum`、而 `recharge_ticks` 求值有限且大于 `0` 时，距 `last_change` 超过 `recharge_ticks`（至少 1 刻）就 `+1`。每次最多补一点，加到 `maximum` 就停。`recharge_ticks` 求值不可用时不回复，不会退化成每 tick 补满。

## 撤销与重授

撤销技能最后一个授予来源会清除它名下的状态，**冷却除外**：冷却写在那儿就继续走完，这样把授予它的物品换下去再换回来也不能提前再放一次。其余种类照旧随来源一起清掉，所以重新授予回来的技能不会带着上一次的充能。

## 写状态

用实体行为 `mxt:modify_storage`：

```json
{
  "type": "mxt:modify_storage",
  "family": "mxt:ability",
  "id": "example:iron_palm",
  "value": {"type": "mxt:charges", "maximum": 3, "recharge_ticks": 100, "remaining": 2}
}
```

`value` 是一整份写入，按它自己的 `type` 分派解析。`family` 点了没接存储的注册表、或者宿主没声明过这个种类，写入都被拒绝并各记一条警告。

`mxt:cast_deadline`、`mxt:channel_pulse`、`mxt:aura_pulse` 这三个游标与技能状态共用同一套寻址，但没有任何类型声明它们，所以写不进去。天劫的 `mxt:entry_began`、`mxt:idle_countdown`、`mxt:wait_countdown` 住在天劫自己的单槽里，也不走这套按 id 寻址的存储。

## 读状态

用六个实体条件，地址与写入完全一致：

| 条件 | 字段 | 说明 |
| --- | --- | --- |
| `mxt:storage_toggle` | `expected`（默认 `true`） | 读 `state`，没写过时读作 `default` |
| `mxt:storage_timer` | `remaining`（`{min?, max?}` 窗口）、`ended` | 没有 `ends_at` 的计时没在跑，剩余按 `0`、`ended` 为真 |
| `mxt:storage_resource` | `amount`（窗口） | 不给窗口就只问存没存过 |
| `mxt:storage_target` | `locked`（默认 `true`）、`max_distance` | `max_distance` 额外要求那个 UUID 还能在施动者所在维度里找到、且在距离内 |
| `mxt:storage_charges` | `remaining`（窗口） | 从没花过就读作满，也就是声明的 `maximum` |
| `mxt:storage_cooldown` | `remaining`（窗口）、`ready` | 长度读 `duration`、起点读 `started_at`；从没写过就是没在冷却，剩余 `0`、`ready` 为真 |

除 `mxt:storage_cooldown` 之外，其余五个只认宿主**声明过**的种类，写入也照这条规则。`mxt:storage_cooldown` 不要求宿主声明 `mxt:cooldown`：每次付款都会写这个值，所以凡是走付款闸门的技能都能被它读出来。

物品宿主上的 `mxt:container` 不在这六个条件的寻址范围里。

## 代价与限制

- **附件是同步的**，所以技能状态会跟着实体同步给客户端。条件在客户端也会被求值（例如物品提示框），那时没有服务端注册表，一律读作不成立。
- **清状态时 `mxt:cooldown` 单独留下**：撤销最后一个授予来源会清掉它名下的状态，只有冷却不跟着走——它继续按时走完，否则"把物品换下去再换回来"就等于免冷却再放一次。其余种类（充能、引导游标、开关…）仍然一起清掉。
- **`mxt:cooldown` 是唯一能被内容直接写成拦截的闸门**：写一个 `duration` 就等于给那条技能上锁，长度由写入方说了算。
