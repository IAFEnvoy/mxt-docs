---
title: cultivate_action（修炼行为）
description: 定义一次运功法门：法门间的先后、开始与维持条件、结算间隔、消耗与收获。
aside: false
---

# cultivate_action（修炼行为） {#cultivate_action}

文件位置：`data/<namespace>/mxt/cultivate_action/<path>.json`

一个 `cultivate_action` 是一次"运功"法门：它说吸收哪些环境灵气、每隔多久结算一次、每刻做什么、收什么费、给什么收获、停下来要冷却多久。玩家当前在用哪一套法门由这个注册表决定。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `cultivate_action.mxt.<命名空间>.<路径>` | 显示名。省略时用左列的默认键。 |
| `description` | Text Component | `cultivate_action.mxt.<命名空间>.<路径>.description` | 描述。省略时用左列的默认键；只有存储与读取，没有界面画它。 |
| `priority` | Int | `0` | 多条法门并存时的先后：数值大者先，相同则按注册表顺序。它只在**此刻适用的**法门里排序。 |
| `start_condition` | `EntityCondition` | `mxt:always` | 开始修炼条件：能不能坐下。 |
| `cultivate_condition` | `EntityCondition` | `mxt:always` | **这一拍能不能拿到成果**；不成立时照常修炼、**不中止**，只是这一拍空过（不扣钱、不给收获、不算结算），条件一恢复立刻出成果。**基本只用于双修判定**。 |
| `tick_condition` | `EntityCondition` | `mxt:always` | 还继续不继续修炼；不成立会**中止**本次运功。 |
| `tick_interval` | Integer | `20` | 吸收结算间隔。 |
| `costs` | `Cost` 数组 | `[]` | 每次修炼消耗，从修炼的实体自己账上扣。 |
| `absorb_amount` | `NumberProvider` | `1` | 修炼时当前境界资源自然回复的倍率。 |
| `aura_costs` | 只含 `mxt:aura` 条目的 `Cost` 数组 | `[]` | 每次修炼从修炼者所在位置的**共享灵气池**扣除的消耗。 |
| `aura_gains` | `{id, amount}` 数组 | `[]` | 额外增加的灵气。 |
| `cooldown` | Integer | `0` | 停止后冷却 tick。 |
| `tick_action` | EntityAction | `mxt:no_op` | 每次修炼 tick 行为。 |
| `abort_reason` | Text Component | 无 | 给"因为 `tick_condition` 不成立而中止"起的名字：写了就用它替代通用的「不满足修炼条件」，环境不允许、灵气不足、配置无效这些中止原因不受它影响。 |

**多条法门并存时怎么挑**：先在整张表里筛出**此刻适用的**法门——`start_condition` 与 `cultivate_condition` **都要成立**，再加上灵气侧那道门禁（每条有首境界的 `aura` 自己的 `start_cultivate_conditions`）——再在筛出来的里面取 `priority` 最大的一条，同分按注册表顺序。一条都不适用就报「没有一门当下能修的法门」。

所以**适用性是筛子、`priority` 才是排序**：`priority` 决定"两条都能用时用哪条"，"此刻能修哪条"由条件自己回答。`tick_condition` **不参与**这一步：它答的是"已经在修炼的身体还要不要继续"，坐下之前根本不成立。

**点名一条法门不走 `priority`**：`/mxt cultivate select <action>` 之类的手动点名把点的那条立刻开起来（正在修另一条就先停掉），但同样要过上面那把筛子，不适用就被拒绝、正在跑的那条不受影响；它只管这一次，不会改变下次按键时的挑选顺序。

`tick_interval` 的范围是 `1..72000`，`cooldown` 的范围是 `0..72000`。

`start_condition` 只决定能不能坐下；`cultivate_condition` 每次结算前问一次，不成立时这一拍**空过**（不扣钱、不给收获、不推进结算），**不中止**运功；`tick_condition` 每次结算前也要成立，不成立会**中止**本次运功（actionbar 报「修炼无法继续：不满足修炼条件」，写了 `abort_reason` 就报你自己的那句话）。

三者都能读环境与身边的人：`mxt:aura_range` 要求某门灵气的浓度区间、`mxt:dimension` 要求维度、方块 / 群系类条件要求脚下的地方、`mxt:partner` 要求附近有符合条件的同伴（要问"对方手上拿着什么"就套 `mxt:target_condition`）。"对方也在修炼"（`mxt:cultivating`）只能写在 `tick_condition` 里——开始之前它必然为假。

`cultivate_condition` 的用途很窄，**基本只用于双修判定**："身边得有人、而且他手上得拿着东西，我这一拍才拿得到成果"。单人的门槛用另外两个更直白——不满足就别修（灵气浓度、维度、功法、场地）写 `start_condition`，修到一半不该继续写 `tick_condition`；只有"人还能站在那儿修、但这一拍不该给东西"时才用它。

`costs` 整份数组**全有或全无**；写法见[共享数据类型 · `Cost`](../types/shared_data_types.md#cost)。

`absorb_amount` 先填满资源条，溢出量进入修为。

`aura_gains` 每项是 `{id, amount}`，`id` 是一门灵气。

`tick_action` 只在真正结算的那一拍跑，不是每刻都跑。

`aura_costs` 只接受 `mxt:aura` 条目，写其它类型是加载错误；`amount` 必须求值为有限正数，否则这一项付不出。写法见[共享数据类型 · `Cost`](../types/shared_data_types.md#cost)。

`aura_costs` 的付款方式是这套字段里最绕的一处。多人同区块修炼时，每一项先按池子能给它的份额独立缩放（这一项拿得到的量 ÷ 这一项要的量，夹在 `0..1`），本次结算的倍率取这些份额的平均；缩放后的金额才是真正提交给池子的数，提交时池子**全有或全无**地扣。所以一项不足只压低这一项自己的贡献与整体倍率，并不会直接拒付；真的付不出（或缩放后倍率为 `0`、而服务器配置要求必须有可用灵气）才以灵气不足中止。公式求值出非有限数会让这一次修炼以 `INVALID_FORMULA` 中止。

没有单独的"环境类型"字段：能在哪里修炼完全由三个条件表达，它们都能读环境——`mxt:aura_range` 要求某门灵气的浓度区间，`mxt:dimension` 要求维度，方块/群系类条件要求脚下的地方。注意这与 `aura_zone.cultivate_condition`、`realm_stage.cultivate_condition` 是几侧：那两个由环境 / 境界自己声明"这里能不能修炼、这条链的回复算不算数"，这三个由法门声明"我需要什么"。

```json
// data/example/mxt/cultivate_action/seated.json
{
  "priority": 1,
  "start_condition": { "type": "mxt:aura_range", "aura": { "example:qi": { "min": 10, "max": 200 } } },
  "tick_condition": { "type": "mxt:aura_range", "aura": { "example:qi": { "min": 5, "max": 200 } } },
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

`regen` 是还没被修炼行为接管时的每 tick 自然恢复；修炼吸收默认只回复**当前境界**对应的那个数值，本境界的 `cultivate_condition` 还能再限制一次"这里能不能修炼"，与法门自己的 `start_condition` / `tick_condition` 是两侧。

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
