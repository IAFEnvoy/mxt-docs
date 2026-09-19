---
title: 技能、状态与诅咒类型
---

# 技能、状态与诅咒类型

## `ability_type`

技能定义中嵌套的 `ability` 对象使用这个注册表。ID 写在 `ability.type` 里。

| `type` | 字段 | 说明 |
| --- | --- | --- |
| `mxt:empty` | 无 | 自身没有生命周期 |
| `mxt:active` | `slot` | 从快捷栏槽位显式触发 |
| `mxt:triggered` | `triggers`、`chance` | 当它的某个事件规则匹配时触发 |
| `mxt:modifier` | 无 | 被动修正技能，在授予期间生效，并每 tick 依据 `condition` 重新检查 |
| `mxt:aura` | `interval`、`radius` | 按间隔在施法者周围重复 |
| `mxt:channelled` | `tick_interval`、`upkeep_costs` | 激活时运行一次，之后只要支付维持消耗就每个间隔运行一次 |
| `mxt:composite` | `abilities`、`all_required` | 委托给子技能，而不是自己行动 |
| `mxt:word` | `effect`、`requires_operator`、`amount` | 终端的、经代码白名单限制的词语效果 |

| `type` | 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `mxt:active` | `slot` | String | `primary` | 快捷栏槽位名；不能为空 |
| `mxt:triggered` | `triggers` | `Trigger` 列表 | `[]` | 触发该技能的触发器匹配器 |
| `mxt:triggered` | `chance` | `NumberProvider` | `1` | 匹配的触发器实际触发该技能的概率 |
| `mxt:aura` | `interval` | `NumberProvider` | `20` | 两次灵气施加之间的 tick 数 |
| `mxt:aura` | `radius` | `NumberProvider` | `4` | 灵气半径 |
| `mxt:channelled` | `tick_interval` | `NumberProvider` | `1` | 两次维持支付之间的 tick 数 |
| `mxt:channelled` | `upkeep_costs` | `ResourceCost` 列表 | `[]` | 每个维持 tick 支付的数值 |
| `mxt:composite` | `abilities` | `Holder<ability>` 列表 | **必填** | 子技能；无效的可选条目会被忽略 |
| `mxt:composite` | `all_required` | Boolean | `true` | 为 `false` 时只运行第一个子技能 |
| `mxt:word` | `effect` | Enum | **必填** | `self_heal` 或 `purge_self_curses` |
| `mxt:word` | `requires_operator` | Boolean | `true` | 施法者是否必须是管理员 |
| `mxt:word` | `amount` | `NumberProvider` | `0` | 传给词语效果的量值 |

`mxt:empty` 没有字段。`mxt:word` 是终端载荷，永远不会执行目标行为，数据包也无法为它提供任意命令字符串。

```json
{
  "ability": {
    "type": "mxt:channelled",
    "tick_interval": 20,
    "upkeep_costs": [{"id": "example:qi", "amount": 1}]
  }
}
```

---

## `data_storage_type`

[技能](../../json/ability.md) 的 `components` 数组声明该技能保存的状态，而由这个注册表决定每条声明存储什么。一种类型本身就是可存储对象：它把声明的参数和它保存的状态放在同一条记录里，并且**它自己的类就是槽位**，因此一个宿主每种类型最多保存一个值，其他任何东西都不必给槽位命名。

| `type` | 声明字段 | 状态字段 |
| --- | --- | --- |
| `mxt:empty` | 无 | 无——它不声明自己的状态 |
| `mxt:cooldown` | `ticks`（**必填**） | `duration`：上一次使用得到的时长；写入它的那个 tick 就是该冷却开始的时间 |
| `mxt:charges` | `maximum`、`recharge_ticks`（**必填**） | `remaining`：剩余充能；没有它时读作满值 |
| `mxt:toggle` | `default`（默认 `false`） | `state`：当前开关 |
| `mxt:timer` | `duration`（**必填**） | `ends_at`：计时结束的 tick |
| `mxt:resource` | `resource`（**必填**） | `amount`：为该数值保存的数量 |
| `mxt:target_lock` | `range`（**必填**） | `target`：被锁定实体的 UUID，以字符串表示 |

值**存放在拥有它们的附件里**：技能的状态与授予一起位于 `mxt:ability_holder` 中，通过**技能的 id 加上该类型的类**寻址。附件就是宿主，因此不必记录任何宿主类，而同一个技能用在两个实体上、或两个技能用在同一个实体上，都永远不会共享同一个值。存档数据只记录 ID：值由它自己的 `type` 分派解码，因此类也随之恢复。持有者会记录每次写入的 tick，读取方正是从这里得到“该状态从何时开始”，而写入会把它的宿主附件标记为脏，因此值会随拥有它的内容一起保存和同步。写入存储的就是类型实例本身——声明字段与状态放在一起——因此读取方拿到的正是它要的实现，持有者完全不必了解任何结构。

撤销技能最后一个授予来源会清除它拥有的一切，因此被重新授予的技能不会带着此前的充能回来。内容通过 `mxt:modify_storage` [实体行为](../action/entity_action_types.md) 写入一种类型，它的 `value` 是一个完整的存储对象，并且只接受声明过的类型；运行时自己保留的游标同样会被拒绝——技能有 `mxt:cast_deadline`、`mxt:channel_pulse` 和 `mxt:aura_pulse`，而[天劫](../../json/tribulation.md) 一次运行所保留的单一状态槽有 `mxt:entry_began` 和 `mxt:idle_countdown`，后者根本不用 id 寻址。

```json
{"type": "mxt:charges", "maximum": 3, "recharge_ticks": "100 - level * 5"}
```

声明会省略状态字段；写入会填入它，而两种形式都由同一个 `type` 分派读回：

```json
{"type": "mxt:charges", "maximum": 3, "recharge_ticks": 100, "remaining": 1}
```

::: info 每种类型既可写也可读

`mxt:cooldown` 和 `mxt:charges` 由技能运行时读取，而 `recharge_ticks` 驱动一次自动补充：一个持有中的技能，如果它的声明会补充充能，那么在计数最后一次写入之后经过 `recharge_ticks` 就回复一点充能，每个间隔最多一步且不付出任何代价，池满时不写入任何东西。全部六种类型都可以由内容通过对应的[实体条件](../condition/entity_condition_types.md)查询——`mxt:storage_toggle`、`mxt:storage_timer`、`mxt:storage_resource`、`mxt:storage_target`、`mxt:storage_charges` 和 `mxt:storage_cooldown`——它们使用同样的 `family` + `id` 寻址和同样的“宿主必须声明该类型”规则，因此任何已声明的状态都可以从任意条件槽位里测试。

:::

---

## `ability_target_selector_type`

选择技能的双实体行为作用于哪些实体。

| `type` | 字段 | 说明 |
| --- | --- | --- |
| `mxt:self` | 无 | 只选择技能施法者 |
| `mxt:area` | `radius`、`include_actor` | 选择以施法者为中心的区域内的实体 |
| `mxt:js` | `id`、`params?` | 选择服务端脚本返回的实体 |

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `radius` | `NumberProvider` | **必填** | 区域半径，上限为 `128`；负数或非有限值选不出任何实体 |
| `include_actor` | Boolean | `false` | 是否把施法者包含在选择结果中 |

```json
{"type": "mxt:area", "radius": 6, "include_actor": true}
```

`mxt:js` 接受一个用 `MxtAbilities.selector(...)` 注册的 `id` 和一个可选的 `params` 对象：

```json
{"type": "mxt:js", "id": "example:nearest_three", "params": {"range": 12}}
```

回调在技能执行期间于服务端运行，并返回一个实体数组。技能的每一次执行都会进行一次选择，因此回调缺失时选不出任何实体，并记录一条警告。

---

## `curse_type`

诅咒定义的 `type` 选择它的生命周期策略。四种类型都没有字段；时长本身来自诅咒定义的 `duration_ticks` 字段。

| `type` | 说明 |
| --- | --- |
| `mxt:timed` | 在配置的时长之后过期；时长必须为正 |
| `mxt:permanent` | 永不过期 |
| `mxt:triggered` | 施加与移除由所属的事件桥驱动；时长非正表示不过期 |
| `mxt:empty` | 完全没有生命周期 |

```json
{"type": "mxt:timed", "duration_ticks": 600}
```

---
