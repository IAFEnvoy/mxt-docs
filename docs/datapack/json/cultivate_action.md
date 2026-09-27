---
title: cultivate_action（修炼行为）
description: 定义一次运功法门：开始与继续条件、结算间隔、消耗与收获。
aside: false
---

# cultivate_action（修炼行为） {#cultivate_action}

文件位置：`data/<namespace>/mxt/cultivate_action/<path>.json`

一个 `cultivate_action` 是一次"运功"法门：它说吸收哪些环境灵气、每隔多久结算一次、每刻做什么、收什么费、给什么收获、停下来要冷却多久。玩家当前在用哪一套法门由这个注册表决定。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `cultivate_action.mxt.<命名空间>.<路径>` | 显示名。省略时用左列的默认键。 |
| `description` | Text Component | `cultivate_action.mxt.<命名空间>.<路径>.description` | 描述。省略时用左列的默认键；只有存储与读取，没有界面画它。 |
| `default` | Boolean | `false` | 没有已选修炼行为时是否作为默认行为。 |
| `start_condition` | `EntityCondition` | `mxt:always` | 开始修炼条件。 |
| `condition` | `EntityCondition` | `mxt:always` | 继续修炼条件。 |
| `tick_interval` | Integer | `20` | 吸收结算间隔。 |
| `costs` | `Cost` 数组 | `[]` | 每次修炼消耗，从修炼的实体自己账上扣。 |
| `absorb_amount` | `NumberProvider` | `1` | 修炼时当前境界资源自然回复的倍率。 |
| `aura_costs` | 只含 `mxt:aura` 条目的 `Cost` 数组 | `[]` | 每次修炼从修炼者所在位置的**共享灵气池**扣除的消耗。 |
| `aura_gains` | `{id, amount}` 数组 | `[]` | 额外增加的灵气。 |
| `cooldown` | Integer | `0` | 停止后冷却 tick。 |
| `tick_action` | EntityAction | `mxt:no_op` | 每次修炼 tick 行为。 |

没有任何一条被标记 `default` 时，注册表里的第一个行为就是默认行为。

`tick_interval` 的范围是 `1..72000`，`cooldown` 的范围是 `0..72000`。

`start_condition` 只在开始时检查一次；`condition` 每次结算前都要成立，不成立会**中止**本次运功（actionbar 报「修炼无法继续：不满足修炼条件」）。

`costs` 整份数组**全有或全无**；写法见[共享数据类型 · `Cost`](../types/shared_data_types.md#cost)。

`absorb_amount` 先填满资源条，溢出量进入修为。

`aura_gains` 每项是 `{id, amount}`，`id` 是一门灵气。

`tick_action` 只在真正结算的那一拍跑，不是每刻都跑。

`aura_costs` 只接受 `mxt:aura` 条目，写其它类型是加载错误；`amount` 必须求值为有限正数，否则这一项付不出。写法见[共享数据类型 · `Cost`](../types/shared_data_types.md#cost)。

`aura_costs` 的付款方式是这套字段里最绕的一处。多人同区块修炼时，每一项先按池子能给它的份额独立缩放（这一项拿得到的量 ÷ 这一项要的量，夹在 `0..1`），本次结算的倍率取这些份额的平均；缩放后的金额才是真正提交给池子的数，提交时池子**全有或全无**地扣。所以一项不足只压低这一项自己的贡献与整体倍率，并不会直接拒付；真的付不出（或缩放后倍率为 `0`、而服务器配置要求必须有可用灵气）才以灵气不足中止。公式求值出非有限数会让这一次修炼以 `INVALID_FORMULA` 中止。

没有单独的"环境类型"字段：能在哪里修炼完全由 `start_condition` 与 `condition` 表达，两者都能读环境——`mxt:aura_range` 要求某门灵气的浓度区间，`mxt:dimension` 要求维度，方块/群系类条件要求脚下的地方。注意这与 `aura_zone.cultivate_condition` 是两侧：那个由环境自己声明"我这里允不允许修炼"，这两个由法门声明"我需要什么"。

```json
// data/example/mxt/cultivate_action/seated.json
{
  "default": true,
  "start_condition": { "type": "mxt:aura_range", "aura": { "example:qi": { "min": 10, "max": 200 } } },
  "condition": { "type": "mxt:aura_range", "aura": { "example:qi": { "min": 5, "max": 200 } } },
  "tick_interval": 20,
  "absorb_amount": 1.5,
  "aura_costs": [{ "type": "mxt:aura", "aura": "example:qi", "amount": 0.5 }],
  "aura_gains": [{ "id": "example:qi", "amount": 1 }],
  "cooldown": 100,
  "tick_action": { "type": "mxt:no_op" }
}
```

## 灵气定义与修炼行为的分工

灵气身份与修炼行为都不在这个文件里：它们在 [aura](./aura.md) 定义上，一个数值最多一条（一对一，只引用一个 `resource`）。境界入口 `first_realm`、凡人门槛 `start_exp`、开始修炼的条件 `start_cultivate_conditions`、自然恢复 `regen`、灵气标记 `aura_type`、灵力爆发的每发数值 `burst_amount`、修为与数值之间的两个换算方向、`use_condition` 与 `show_cultivation_info` 全都写在 `aura` 上；`resource` 只负责存储数值与资源条。逐字段见 [aura](./aura.md)。

境界链也属于 `aura` 定义：每条 `realm_stage` 用 `aura` 指回定义，定义再用 `first_realm` 指链上的第一个境界，阶段之间由 `next_realm` 串成一条只能向前的线性链；一个定义一条链，玩家可以同时持有多条链。一个阶段的 `breakthrough_exp`、`max_experience` 与 `breakthrough` 描述从这一阶段走到下一阶段的界限，可选的 `auto_breakthrough` 决定修炼时是否自动尝试突破（默认关）。凡人拿定义里的 `start_exp` 同时当首次突破阈值与上限，`first_realm` 只决定首次突破的目标境界；`start_cultivate_conditions` 在开始修炼与首次突破前各检查一次。`use_condition` 只决定资源条显不显示、能不能主动消耗，**不挡修炼、环境吸收、自然恢复与突破**。功法没有启用开关，学过的就全部生效。

`regen` 是还没被修炼行为接管时的每 tick 自然恢复；修炼吸收默认只回复**当前境界**对应的那个数值，本境界的 `cultivate_condition` 还能再限制一次"这里能不能修炼"，与法门自己的 `start_condition` / `condition` 是两侧。

```json
// data/example/mxt/aura/qi.json
{
  "resource": "example:qi",
  "first_realm": "example:foundation",
  "start_exp": 100,
  "start_cultivate_conditions": { "conditions": [] },
  "use_condition": {
    "type": "mxt:has_realm",
    "aura": "example:qi"
  }
}
```

```json
// data/example/mxt/realm_stage/foundation.json
{
  "aura": "example:qi",
  "cultivate_condition": {"type": "mxt:always"},
  "aura_share_weight": 1.0,
  "breakthrough_exp": 100,
  "max_experience": 250,
  "auto_breakthrough": false,
  "breakthrough": { "conditions": [] }
}
```

灵根与体质是可以叠加的持有来源，授予方式由行为决定，本框架不规定具体灵根名称和数值：条件侧有 `mxt:has_spirit_root`、`mxt:has_physique`，行为侧有 `mxt:grant_spirit_root`、`mxt:remove_spirit_root`、`mxt:grant_physique`、`mxt:remove_physique`。体质可以用 `holder_condition` 要求某个灵根或另一份体质：

```json
{
  "attribute_modifiers": [{"attribute": "minecraft:max_health", "id": "example:physique/blazing_body", "amount": 2, "operation": "add_value"}],
  "granted_abilities": [],
  "holder_condition": {"type": "mxt:has_spirit_root", "spirit_root": "example:fire_root"}
}
```

见 [spirit_root](./spirit_root.md) 与 [physique](./physique.md)。
