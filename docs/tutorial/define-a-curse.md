---
title: 定义诅咒
description: 写一条会叠层、会周期发作的诅咒定义，挂到实体身上，再用命令、标签与解毒动作把它取下来。
---

# 定义诅咒

诅咒是挂在实体身上的持续状态。定义自己决定它持续多久、多久发作一次、怎么叠层、每个阶段跑什么行为；**谁能解它不由它决定**，那句话写在解毒剂一侧的标签上。

这篇给示例包加一条诅咒：`example:qi_backlash`，灵气反噬。它按时到期，每 100 tick 发作一次，最多叠三层，叠层时刷新剩余时长。

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `data/example/mxt/curse/qi_backlash.json` | 一条按时间到期的诅咒：层数、周期发作、施加与到期的行为。 |

## 第 1 步 —— 四种类型

诅咒定义放在 `data/<命名空间>/mxt/curse/<路径>.json`。`type` 是唯一必填的字段，它只决定这份定义怎么走完一生；这四种类型由模组注册，数据包只能选用。

| `type` | 生命周期 |
| --- | --- |
| `mxt:timed` | 按 `duration_ticks` 到期；常量时长必须大于 `0`，加载期就校验。 |
| `mxt:permanent` | 永不到期。 |
| `mxt:triggered` | 由 `triggers` 里的信号驱动：每来一个匹配的信号，对持有者跑一次 `on_tick`。`triggers` 不能为空，空列表在加载期就被拒。 |
| `mxt:empty` | 什么都不做：四个行为一个都不跑，四个字段照旧可选。 |

`mxt:triggered` 不看 `tick_interval`，它的节拍来自信号；`mxt:timed` 与 `mxt:permanent` 按 `tick_interval` 周期驱动 `on_tick`；`mxt:empty` 什么都不跑。

## 第 2 步 —— 完整定义与字段

```json
{
  "type": "mxt:timed",
  "duration_ticks": 600,
  "tick_interval": 100,
  "max_stacks": 3,
  "stacking_mode": "add_stacks_refresh_duration",
  "on_apply": {"type": "mxt:apply_effect", "effect": "minecraft:weakness", "duration_ticks": 200},
  "on_tick": {"type": "mxt:apply_effect", "effect": "minecraft:hunger", "duration_ticks": 100}
}
```

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | 文本组件 | `curse.mxt.<命名空间>.<路径>` | 显示名。省略时用左列的生成键。 |
| `description` | 文本组件 | 生成键再接 `.description` | 描述。省略时同上。 |
| `type` | 诅咒类型 | **必填** | 四选一，见上一步。 |
| `duration_ticks` | 数字或公式串 | `0` | 持续多久，单位 tick。 |
| `tick_interval` | 数字或公式串 | `20` | 周期行为的间隔；求值有限且大于 `0` 才会周期驱动 `on_tick`。 |
| `max_stacks` | 整数 | `1` | 层数上限，范围 `1..256`。 |
| `stacking_mode` | 枚举 | `ignore` | 已经持有时怎么办，见下一步。 |
| `application_condition` | 实体条件 | `mxt:always` | 能不能施加；不满足时施加失败。 |
| `display_condition` | 实体条件 | `mxt:always` | 人物信息面板里列不列这一行。 |
| `on_apply` | 实体行为 | `mxt:no_op` | 新建实例时跑一次。 |
| `on_tick` | 实体行为 | `mxt:no_op` | 周期行为。 |
| `on_expire` | 实体行为 | `mxt:no_op` | 自然到期时跑。 |
| `on_cleanse` | 实体行为 | `mxt:no_op` | 被解毒时跑。 |

四个行为字段单个行为或行为数组都收。`on_apply` **只在新建实例时跑**：往已经持有的那条叠层或刷新，不会重跑它。

定义上只有两个时刻会跑行为——自然到期跑 `on_expire`，被解毒跑 `on_cleanse`。显式移除、`replace` 顶掉旧实例这类外部决定不跑它们。

## 第 3 步 —— 叠层

`stacking_mode` 决定已经持有同一条诅咒时再施加一次会发生什么：

| 取值 | 已持有时 |
| --- | --- |
| `ignore` | 什么都不做：层数不变、剩余时长不动、不重跑 `on_apply`，**也不报错**。 |
| `refresh_duration` | 层数不变，剩余时长按这一次的请求刷新。 |
| `add_stacks_refresh_duration` | 层数取 `min(max_stacks, 当前层数 + 请求层数)`，并刷新剩余时长。 |
| `add_stacks_keep_duration` | 层数取同一个 `min`，但原来的剩余时长不动。 |
| `replace` | 旧实例按「被替换」移除，不跑它的行为；再按新实例走一遍，`on_apply` 照常。 |

默认是 `ignore`：不改 `stacking_mode` 的话，第二次施加什么都不做，层数永远停在第一次的值。示例里写了 `add_stacks_refresh_duration`，所以连施加三次会爬到三层。

两条不同的诅咒**可以共存**：框架没有互斥判定。要互斥就自己写进 `application_condition`——一个「身上没有另一条诅咒」的条件（`mxt:not` 套 `mxt:has_curse`）。

## 第 4 步 —— 施加与条件

| 入口 | 说明 |
| --- | --- |
| 实体行为 `mxt:apply_curse` | 施加一条，可写 `stacks` 与 `duration_ticks`。 |
| 实体行为 `mxt:apply_curses` | 一串条目，逐条独立施加。 |
| 原版战利品函数 `mxt:apply_curse` | 施加一条诅咒，来源记为战利品。 |
| 物品的 `mxt:curse_container` | 装备上就施加，六个装备槽与 Curios 槽都算。已经持有同一条时只登记这件装备的来源，**不重复施加**，层数与剩余时长都不动。 |
| 命令 `/curse apply` | 见下一步的命令表。 |

点名一条定义的地方（`mxt:apply_curse`、`mxt:remove_curse`、物品的 `mxt:curse_container`）只收具体 id；`mxt:remove_curses_by_tag` 与原版标签过滤收 `#标签`，标签文件放在 `data/<命名空间>/tags/mxt/curse/<路径>.json`。定义里没有「谁能解我」这种字段：把这条诅咒列进某个 `mxt:curse` 标签，解毒那一侧才认得它。

`application_condition` 决定这一次施加允不允许，`display_condition` 决定人物信息面板列不列这一行，两者都默认 `mxt:always`。条件与行为里能读写诅咒的东西还有：实体条件 `mxt:has_curse`（四个筛选字段全可选）、物品条件 `mxt:curse_container`、战利品条件 `mxt:has_curse`（比实体条件多一个 `entity`，用来选战利品上下文里的哪个实体）。

## 第 5 步 —— 解除与命令

| 入口 | 结果 |
| --- | --- |
| 自然到期 | `mxt:timed` 的时长走完，跑 `on_expire`。 |
| 实体行为 `mxt:remove_curse` | 按解毒的原因移掉一条具名诅咒，跑 `on_cleanse`。 |
| 实体行为 `mxt:remove_curses_by_tag` | 按解毒的原因移掉命中任意一个标签的全部诅咒，各自跑 `on_cleanse`。 |
| `/curse cleanse <目标> <标签>` | 命令侧的解毒；标签写裸 id（`example:cleanse/poison`），不带 `#`。 |
| `/curse remove <目标> <诅咒>` | 整条移除，把全部来源一并抹掉，原因是显式移除，不跑定义上的行为。 |
| 物品的 `mxt:curse_container` 被清洗 | 组件里没有这条诅咒时，释放这件装备那一份来源；最后一份走了实例才离开。 |
| 技能类型 `mxt:word` 的 `purge_self_curses` | 清除施放者自己的诅咒，原因同样是显式移除，所以不跑 `on_cleanse`。 |

每一次移除都会发一个事件，默认在 `Pre` 阶段可以取消；`replace` 顶掉旧实例的那一次只补一个事后通知。

**没有「不可移除」开关。** 最接近的两件事：`mxt:empty` 什么都不做；定义不在当前数据包里（文件不在了，或被 `neoforge:conditions` 挡掉）时，已持有的实例被冻结——不跑周期行为、不会自然到期、解毒被拒，只有显式移除有效。

| 命令 | 说明 |
| --- | --- |
| `/curse list [目标]` | 列名字、层数、剩余 tick 或「永不到期」，以及全部来源。不填目标看自己，**不需要权限**。 |
| `/curse apply <目标> <诅咒> [层数] [时长]` | 需要管理员权限；层数取 `1..256`，时长只能收紧定义自己声明的时长。 |
| `/curse remove <目标> <诅咒>` | 需要管理员权限。 |
| `/curse cleanse <目标> <标签>` | 需要管理员权限，参数是裸 id，不带 `#`。 |

顶层别名 `/curse` 可以用服务端配置「命令别名 → /curse」关掉，关掉之后 `/mxt curse` 照旧完整。

## 在游戏里验证

```text
/mxt registries validate
/curse list
/curse apply @s example:qi_backlash 2
/curse list
```

1. 数据包在**世界加载时**读取，`/reload` 不会重读；改完文件退回标题界面重进世界（或重启服务器）。
2. `/mxt registries validate` 通过，说明定义进了表。
3. `/curse apply @s example:qi_backlash 2` 给自己上两层，`/curse list` 会列出名字、层数、剩余 tick 与全部来源。
4. 再施加一层：按 `add_stacks_refresh_duration` 爬到三层，剩余时长同时被刷新。继续施加还是三层——`max_stacks` 封顶了。
5. 等 600 tick 会自然到期；想立刻结束就用 `/curse remove @s example:qi_backlash`。
6. `display_condition` 决定人物信息面板里列不列这一行。
7. 测试包里备了诅咒探针技能（`/mxt_test kit` 授予后手动发动），可以拿它对着自己看施加、叠层与解毒。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 世界加载不了，指向 `mxt:timed` 的时长 | 常量 `duration_ticks` 不大于 `0`。加载期就挡住。 |
| 世界加载不了，指向空的 `triggers` | `mxt:triggered` 至少要有一个触发器。加载期就挡住。 |
| 定义进不了表 | `max_stacks` 不在 `1..256`，解码失败。 |
| 施加没发生，日志里也查不到 | `duration_ticks` 求值出来不是有限数或为负，这一次施加作废；`mxt:timed` 的公式求值不大于 `0` 也一样，因为加载期只挡得住常量。 |
| 行为侧静默，命令侧说「施加失败」 | `application_condition` 不满足：行为不读返回值，所以什么都不说；命令会把失败报出来。 |
| `mxt:apply_curse` 什么都不做 | 层数求值不在 `1..256`，静默跳过，日志里也不留。 |
| 叠了一次没反应 | `stacking_mode` 默认 `ignore`：已持有就什么都不做，不报错。 |
| `/curse cleanse` 说解不了 | 定义不在当前包里，实例被冻结，只剩显式移除。 |
| 两条本该互斥的诅咒同时挂上了 | 框架没有互斥判定，得自己写 `application_condition`。 |
| 又装备一件带同一条诅咒的装备，层数没涨 | 已经持有时只登记这件装备的来源，不重复施加。 |

## 接下来

- [curse（诅咒）](../datapack/json/curse.md) —— 完整字段表、来源账本、`mxt:curse_container` 的三个时刻与显示规则。
- [诅咒类型](../datapack/types/other/curse.md) —— 四种生命周期各自的字段与时长规则。
- [`/curse`](../player-guide/commands/curse.md) —— 四个子命令的逐条说明。
- [实体行为类型](../datapack/types/action/entity_action_types.md) —— `mxt:apply_curse`、`mxt:apply_curses`、`mxt:remove_curse`、`mxt:remove_curses_by_tag` 与 `mxt:apply_effect` 的字段。
- [实体条件类型](../datapack/types/condition/entity_condition_types.md) —— `mxt:has_curse` 的筛选字段。
- [战利品与进度条件](../datapack/loot-and-criteria.md) —— 战利品条件与战利品函数里的诅咒。
- [技能类型](../datapack/types/other/ability.md) —— `mxt:word` 的 `purge_self_curses`。
