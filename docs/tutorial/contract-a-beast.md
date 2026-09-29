---
title: 契约灵兽
description: "用一张契约类型定义去收服一只兽：谁有资格、什么代价、四条命令、以及召回与灵兽袋。"
---

# 契约灵兽

一份契约类型就是一只兽的契约规则：谁有资格签、签的时候付什么、一位主人最多同时带几只、多久才能召回一次，以及跟随、战斗、解除、死亡这四个行为字段各跑什么。

**先说清一件事：本体不提供任何可契约的生物。** 能不能被契约由兽自己的代码回答——它得被内容模组写成"可契约"，还要自己回答能接受哪些命令。数据包给不出这份资格，所以写一份 JSON 收服不了原版的猪。这一页讲的是**给别的模组（或你自己的内容模组）的兽配一套契约规则**，不是凭空造一只兽。

数据包能做的是三件事：写规则、收窄名单、收代价。

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `data/example/mxt/contract_type/spirit_familiar.json` | 一份契约类型：代价、上限、召回冷却，加一个跟随期间看得见的效果。 |
| `data/example/mxt/creature_profile/spirit_beast.json` | 这只兽的成长链：入口等级、衡量熟练度的数值，以及每一级给什么。 |

## 第 1 步 —— 写一份契约类型

契约只写注册表 `mxt:contract_type`，文件放在 `data/<命名空间>/mxt/contract_type/<路径>.json`，文件名就是 ID 的路径部分。

一个空对象已经是合法定义——**所有字段都是可选的**：

```json
// data/example/mxt/contract_type/spirit_familiar.json
{}
```

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | 文本 | `contract_type.mxt.<命名空间>.<路径>` | 显示名。省略时自动用左列这个键。 |
| `description` | 文本 | 左列键再加 `.description` | 描述。省略时自动用左列这个键。 |
| `owner_condition` | 实体条件 | `mxt:always` | 主人这一边够不够格。 |
| `creature_condition` | 实体条件 | `mxt:always` | 兽这一边够不够格。 |
| `follow_action` | 实体行为，或它们的数组 | `mxt:no_op` | 当前命令是「跟随」时，这只兽每 tick 额外执行。 |
| `combat_action` | 双实体行为 | `mxt:no_op` | 兽与目标两个实体的行为。 |
| `release_action` | 实体行为 | `mxt:no_op` | 解除契约时执行。 |
| `death_action` | 实体行为 | `mxt:no_op` | 兽死亡时执行。 |
| `costs` | 消耗数组 | `[]` | 签订代价，**由主人支付**；空数组就是免费。 |
| `max_owned` | 整数 ≥ 0 | `0` | 一位主人最多同时拥有几只；`0` 表示不限。 |
| `recall_cooldown` | 整数 ≥ 0 | `0` | 召回冷却，单位 tick；`0` 表示不限。 |

两个条件都是实体条件，一个问主人，一个问兽。名字与描述不用你手写翻译键：省略时显示名按 `contract_type.mxt.<命名空间>.<路径>` 生成，描述再往后接一段 `.description`。

## 第 2 步 —— 代价与两个上限

```json
// data/example/mxt/contract_type/spirit_familiar.json
{
  "costs": [{"id": "example:qi", "amount": 20}],
  "max_owned": 1,
  "recall_cooldown": 100
}
```

`costs` 是消耗数组，这里收 20 点 `example:qi`（示例包已有的数值）。**付款者是主人，不是兽**：兽什么都不付。付款排在全部条件与事件之后，所以付不出的结果就是"没签，也没扣"。

`max_owned` 是**一位主人**同时能持有的本类型契约数，`1` 表示带了一只就不能再签第二只；`0` 才是"不限"。`recall_cooldown` 的单位是 tick，`100` 就是两次召回之间至少隔 5 秒；`0` 表示不限。

## 第 3 步 —— 让「跟随」看得见

```json
{
  "follow_action": {
    "type": "mxt:apply_effect",
    "effect": "minecraft:speed",
    "duration_ticks": 40,
    "amplifier": 0
  }
}
```

`mxt:apply_effect` 给实体施加一个原版状态效果：`effect` 与 `duration_ticks` 必填，`amplifier` 默认 `0`。这条行为落在这只兽自己身上——它跟着你的时候每 tick 重刷一次 40 tick 的加速，一眼就能看出它正处在跟随状态；命令换成游荡或驻守，这条就不跑了。

`follow_action` 也可以写成数组，一次挂好几条。`release_action` 与 `death_action` 同样是实体行为，各自只在自己那一刻跑一次：一个是解除契约，一个是兽死亡。`combat_action` 是双实体行为，写法一样。

加起来就是完整的一份：

```json
// data/example/mxt/contract_type/spirit_familiar.json
{
  "costs": [{"id": "example:qi", "amount": 20}],
  "max_owned": 1,
  "recall_cooldown": 100,
  "follow_action": {
    "type": "mxt:apply_effect",
    "effect": "minecraft:speed",
    "duration_ticks": 40,
    "amplifier": 0
  }
}
```

## 第 4 步 —— 收窄名单

想让这份契约只签某几类生物，用**原版实体类型标签**。标签的 ID 就取自这份契约类型自己的 ID：

`#<契约类型命名空间>:contract/<契约类型路径>`

文件放 `data/<命名空间>/tags/entity_type/contract/<路径>.json`。这份 `example:spirit_familiar` 对应的标签是 `#example:contract/spirit_familiar`，文件是 `data/example/tags/entity_type/contract/spirit_familiar.json`。

**标签不存在，或者标签是空的，都等于不限制。** 名单也只是名单：把一只兽写进标签不会给它契约资格，资格仍然由它自己的代码回答——原版的猪写进标签也还是签不了。

## 第 5 步 —— 签下它，再给它下命令

签契约有三个入口：拿着 `mxt:contract_scroll` 右键兽；用 `/contract bind <玩家> <目标> <契约类型> [force]`；内容模组自己调。

判定顺序是固定的，**付钱排在最后**：

1. 它还没被绑过；
2. 这只兽可契约；
3. 名单标签；
4. 主人的 `owner_condition`；
5. 兽的 `creature_condition`；
6. `max_owned` 上限；
7. 事件；
8. 付 `costs`。

任何一步不过就停在那里，提示会告诉你卡的是哪一条：已经被绑过、这只兽不接受契约、主人条件不满足、兽的条件不满足、超出上限、代价付不出、还没绑定、不是你的兽、召回冷却中、被取消、这只兽不接受该命令、兽拒绝了该命令。

签成之后：写契约、让兽自己记主人、禁止自然消失、登记主人索引。

命令一共四条内置的，写死在代码里，**数据包与脚本都不能新增**：跟随、游荡、驻守、召回。命令表由兽自己回答——它认哪几条，你才能下哪几条。召回是一次性的命令，点完就过去；跟随、游荡、驻守是常驻的，**换一条才改**。

玩家的入口是御兽铃（`mxt:beast_taming_bell`）：主手或副手拿着它，右键一只"已绑定且主人是自己"的兽，铃里就记下这只兽、它的显示名、以及它能接受的命令表；再右键**空气**打开轮盘（停在 `mxt:contract` 这一页），点一格把命令下给它。管理员的等价入口是 `/contract behavior <目标> <命令>`。

## 第 6 步 —— 召回与灵兽袋

召回不会当场把兽挪走：它只置一个闩，兽**下一个 tick** 把它消费掉，默认实现就是直接传送。

每次驱动都要求：已经绑定、兽实现了这条命令、主人**在线且同维度**。主人不在同一维度时它静默不动。召回有冷却（`recall_cooldown`），冷却没过时会被明确拒绝。

灵兽袋（`mxt:spirit_beast_bag`）一次只收一只，条件是三条：**是你自己的、已经契约的、袋子本来是空的**。它存的是整只兽的存档，**契约跟着兽走**，放出来契约还在。袋子上的名字、契约类型、主人只是提示框用的快照，不是真值。

把袋子直接丢掉**不触发死亡**：`death_action` 不跑，契约也不会被清掉。

## 第 7 步 —— 灵宠成长

**契约给的是规则，成长挂在档案上。** 一份[生物档案](../datapack/json/creature_profile.md)写了 `default_level`，这只生物就有了自己的等级链——链上每一级写在 [progression](../datapack/json/progression.md) 里，`mastery_resource` 点一个数值当熟练度，`configuration` 说每一级给什么能力、要到什么条件。

入口等级那一级的 `configuration` 就是「与生俱来」：等级授予是**累计**的，站着的等级及其以下每一级都算，所以生来就会什么写进入口等级、晋升才学会什么写在下一级。档案没有 `granted_abilities` 这类字段，也没有 `passive_modifiers`——要属性就用入口等级的 `mxt:modifier` 能力。

```json
// data/example/mxt/creature_profile/spirit_beast.json
{
  "entities": ["example:spirit_beast"],
  "default_level": "example:beast_growth_1",
  "mastery_resource": "example:beast_mastery",
  "configuration": {
    "example:beast_growth_1": { "condition": { "type": "mxt:always" }, "ability": "example:beast_bite" },
    "example:beast_growth_2": { "condition": { "type": "mxt:always" }, "ability": "example:beast_howl" }
  }
}
```

熟练度**由数据包或脚本自己涨**：本体只提供 `mastery_resource` 这个比较口径，涨它的办法都是现成的——`mxt:add_resource` 动作、灵气的 `regen`、KubeJS。服务器每 20 tick 问一次这条链：熟练度够、该级 `condition` 也成立就晋升，晋升后重算它授予的能力。

契约结束会清掉这条链的记录（主动解除与死亡两条路都算）：它退回入口等级，由等级授予的能力同时被撤销。契约还在时等级跟着生物走，收进灵兽袋再放出来还在。

`/contract info <目标>` 会多报两行——它现在在哪一级、下一级是什么，以及熟练度还差多少。`/contract level <目标> <等级>` 是管理员的写入入口，它不看该级自己的 `mastery` 与 `condition`。

## 在游戏里验证

```text
/contract info <目标>
/contract list
/contract bind <玩家> <目标> example:spirit_familiar
/contract behavior <目标> mxt:stay
```

1. 把文件放进数据包，然后**重进世界**：契约定义在世界加载时读，`/reload` 不会重读。
2. 找一只由内容模组提供、可契约的兽，用 `/contract info <目标>` 读它：契约类型、主人、绑定时间、召回状态、当前命令、冷却剩余。
3. 拿契约卷轴右键它，或者用 `/contract bind <玩家> <目标> example:spirit_familiar`（管理员权限）。它按上面那个顺序挨条判，失败就给出对应的那一条提示；`force` 跳过代价与上限。代价付不出就一分不扣。
4. 用 `/contract list` 看主人索引里有没有它，这一条不需要权限。
5. 拿御兽铃右键它，再右键空气。依次点跟随、游荡、驻守，`/contract info <目标>` 里的"当前命令"会跟着变；点召回，它会回到你身边（同维度），召回状态与冷却剩余随之前进。
6. 用灵兽袋收一次再放出来：契约还在，命令也还是那一条。

`bind`、`break`、`recall`、`behavior` 需要管理员权限，`list` 与 `info` 不需要。顶层别名 `/contract` 可以被服务端配置「命令别名 → /contract」关掉，关掉之后改用 `/mxt contract`。

## 常见错误

有一类问题没有任何反馈——没提示，也没日志：

- 还没绑定、契约类型读不出来、兽不接受这条命令，或者主人离线 / 与兽不在同一维度：兽就是不动。
- 用铃右键空气是**客户端**开的界面，服务端那一侧不会因此做任何事。
- 铃里没对准任何兽时点轮盘：只弹一句"没选中目标"，界面不开。
- 空袋子右键方块或空气：不消耗，也没反应。

| 现象 | 原因 |
| --- | --- |
| 写好的 JSON 收服不了原版的猪 | 资格由兽自己的代码回答，本体不提供任何可契约生物；数据包只能写规则、收窄名单、收代价。 |
| 定义改完没生效 | 定义在世界加载时读，`/reload` 不重读；重进世界。 |
| 名单标签没起作用 | 标签不存在、或者写成空的，都等于不限制。 |
| 提示"代价付不出" | `costs` 由主人支付，从主人的账上出；兽的库存不会被拿来抵。 |
| 提示"超出上限" | `max_owned` 用满了；解除契约或兽死亡才腾出名额。 |
| 召回连点会报错 | 兽已经在召回途中，这时再召回会抛出异常而不是给出提示；召回还没落地时不要连点。 |
| `/contract` 不存在了 | 服务端配置「命令别名 → /contract」把顶层别名关掉了；`/mxt contract` 照旧可用。 |

## 接下来

- [contract_type（契约类型）](../datapack/json/contract_type.md) —— 完整字段表与标签规则。
- [命令](../player-guide/commands/contract.md) —— `/contract` 的每条子命令与御兽铃的行为。
- [实体行为类型](../datapack/types/action/entity_action_types.md) —— 灵宠侧与主人侧的动作字段各能挂什么行为。
- [实体条件类型](../datapack/types/condition/entity_condition_types.md) —— `owner_condition` 与 `creature_condition` 能写什么。
- [定义技能](./add-an-ability.md) —— 技能里也用同一套动作字段。
