---
title: curse（诅咒）
aside: false
---

# curse（诅咒） {#curse}

文件位置：`data/<namespace>/mxt/curse/<path>.json`

`curse` 描述一条能被施加到实体身上的持续状态：它持续多久、多久发作一次、怎么叠层、每个阶段跑什么行为。诅咒本身不决定谁能解它，解毒的事由解毒剂那一侧声明，见[解毒](#解毒-标签在解毒剂一侧)。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `curse.mxt.<命名空间>.<路径>` | 可选显示名。省略时用左列的默认键。 |
| `description` | Text Component | `curse.mxt.<命名空间>.<路径>.description` | 可选描述。省略时用左列的默认键；目前只被存储与读取，还没有界面绘制它。 |
| `type` | `CurseType` | **必填** | `mxt:timed`、`mxt:permanent`、`mxt:triggered` 或 `mxt:empty`。 |
| `duration_ticks` | `NumberProvider` | `0` | 定时诅咒持续时间；单位 tick。 |
| `tick_interval` | `NumberProvider` | `20` | 周期行为间隔。 |
| `max_stacks` | Integer | `1` | 最大层数，范围 `1..256`。 |
| `stacking_mode` | Enum | `ignore` | `ignore`、`refresh_duration`、`add_stacks_refresh_duration`、`add_stacks_keep_duration` 或 `replace`。 |
| `application_condition` | `EntityCondition` | `mxt:always` | 是否允许施加。 |
| `display_condition` | `EntityCondition` | `mxt:always` | 是否在人物信息面板里列出这条诅咒。 |
| `on_apply` | `EntityAction` | `mxt:no_op` | 施加行为。 |
| `on_tick` | `EntityAction` | `mxt:no_op` | 周期行为。 |
| `on_expire` | `EntityAction` | `mxt:no_op` | **自然到期**行为。 |
| `on_cleanse` | `EntityAction` | `mxt:no_op` | **被解毒**行为。 |

`on_apply` **只在新建实例时执行**：往已有的那条叠层或刷新不会重复触发。

`display_condition` 不满足时整行都不出现。要藏就用 `mxt:never`，要"两层以上才显形"就用 `mxt:has_curse` 查自己。

### `mxt:timed`：定时

`duration_ticks` 之后到期。**时长必须为正**：常量在加载期就校验，公式在求值那一刻判定，判定不了就拒绝这次施加而不是抛异常。周期行为按 `tick_interval` 驱动。

### `mxt:permanent`：永久

永不到期，`duration_ticks` 不参与。周期行为按 `tick_interval` 驱动。

### `mxt:triggered`：触发

写了 `duration_ticks` 就按时到期，不写就永不到期。周期行为不由 `tick_interval` 驱动，而由**信号**驱动：`triggers` 里任一 `Trigger` 匹配到的信号到达时，对持有者执行一次 `on_tick`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `triggers` | 数组 | `[]` | 让这条诅咒发作的信号；写法与技能触发器一致。 |

```json
{
  "type": "mxt:triggered",
  "triggers": [{"type": "mxt:hurt"}],
  "on_tick": {"type": "mxt:damage", "amount": 1}
}
```

这就是"每次受击发作一次"。加载期会拒绝 `triggers` 为空的 `mxt:triggered`。

### `mxt:empty`：占位

永不到期，也**不产生任何行为**：`on_apply` / `on_tick` / `on_expire` / `on_cleanse` 一律不执行。它只作为占位或标记存在。

加载期还会拒绝 `mxt:timed` 写了非正数常量时长。

## 时长覆盖只能收紧

引用方给的时长可以缩短一条诅咒，但不会超过定义自己声明的时长。给时长的三处是 `mxt:apply_curse` 的 `duration_ticks`、`/mxt curse apply <目标> <诅咒> <层数> <时长>` 与 KubeJS 的 `MxtCurses.applyFor`。定义本身不到期的（`mxt:permanent` / `mxt:empty` / 不带时长的 `mxt:triggered`）可以被覆盖成限时的，反之不行：限时的诅咒不会被覆盖成永久。要更长的诅咒就在定义里写更长的 `duration_ticks`。

## 执行顺序

同一 tick 内多条诅咒按**附件里的顺序**处理，也就是施加的先后。这个顺序随附件一起存档，因此跨重登稳定。它不按定义 ID 重排。

## 来源是一组，不是一条

每条诅咒由**来源账本**记录"谁让它存在"，和技能授予用的是同一个账本，规则也同一条：**只要还有一份来源持有，这条诅咒就存在**。某一份来源松手只撤销它自己那一份，最后一份走了实例才真的离开，此时才发移除事件。

内置来源都是标识符：

| 来源 | 出现场合 |
| --- | --- |
| `mxt:ability` | `mxt:apply_curse` |
| `mxt:loot` | 战利品函数 |
| `mxt:command` | `/mxt curse apply` |
| `mxt:equipment/<槽位>/<物品 ID>` | 装备槽 |
| `mxt:curios_equipment` | Curios 槽 |

KubeJS 调用方自己给来源，必须写成 `命名空间:路径`。`/mxt curse remove`、`mxt:remove_curse` 与解毒剂走的是**整条移除**，会把所有来源一并抹掉。

## 查看与操作

- `/mxt curse list [目标]` 列出持有者身上的诅咒：名字、层数、剩余时间或"永不到期"，以及全部来源。
- `/mxt curse apply <目标> <诅咒> [层数] [时长]`、`/mxt curse remove <目标> <诅咒>`（原因 `explicit`，整条）、`/mxt curse cleanse <目标> <标签>`（原因 `cleansed`，与解毒剂同一条路）需要管理员权限。
- KubeJS 一侧 `MxtCurses` 有 `apply`、`applyFor`、`remove`、`release`（只撤一份来源）、`has`、`stacks`、`remainingTicks`、`sources`。

带 `mxt:curse_container` 的物品还会在 tooltip 里列出它携带的诅咒。

## 定义消失 = 冻结

整个定义从数据包里消失（文件被删，或被 `neoforge:conditions` 挡掉）时，已持有的实例**保留在原地**：不再走周期、触发与到期，也不会被解毒，免得被"净化"成默认效果；人物信息面板照旧列出，除非 `display_condition` 说不。

唯一能把它取下来的路是**显式移除**：`/mxt curse remove`、KubeJS `remove`，或者脱下携带它的装备（原因 `explicit`）。**`mxt:remove_curse` 与解毒剂取不下来它**——它们走的是 `cleansed`，对冻结的实例直接不作答。定义回来之后实例会自动恢复，对账在 `/reload` 时重新调度一次。

## 只有两个时刻会执行行为

诅咒自己的生命周期只有**自然到期**与**被解毒**两个时刻会执行行为，各占一个字段。其余移除原因（显式移除、管理员动手、被 `replace` 覆盖）都是外部决定，定义上不给行为，由调用方自己决定跑什么。

这两个时刻拿到的公式上下文，就是发起那次事务的调用者的上下文。

## 解毒：标签在解毒剂一侧

定义里没有净化标签之类的字段，**"谁能解我"不由诅咒决定**。反过来，**解毒剂**声明它能解的 `mxt:curse` 标签，标签文件列出该标签下的诅咒。动作是 `mxt:remove_curses_by_tag`：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tags` | `#标签[]` | **必填** | 这条动作能解的诅咒标签，写 `"#命名空间:标签"`（与 `mxt:entity_tag` 同一套写法）。 |

列出的标签**命中任意一个**即被解掉。

```json
{ "type": "mxt:remove_curses_by_tag", "tags": ["#example:cleanse/poison"] }
```

```json
// data/example/tags/mxt/curse/cleanse/poison.json
{ "values": ["example:dan_toxicity", "example:soul_scorch"] }
```

它按 `cleansed`（解毒）这一原因走同一套移除事务，所以每个被解掉的诅咒都会执行自己的 `on_cleanse`。按同一原因移除**单个具名诅咒**的是 `mxt:remove_curse`。

把这个动作放进丹药的 `on_consume`、术法的 `entity_action` 或物品的 `use_action`，就是一颗解毒丹。诅咒侧不需要任何配合，新写的诅咒只要被列进那个标签就能被它解掉。

## 查询：`mxt:has_curse`

实体条件与战利品条件同名同形（战利品那份多一个 `entity` 目标字段），字段全部可选，且必须**由同一条实例**满足全部条件才算成立：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `curse` | 诅咒 ID | 无 | 必须是这一条定义。 |
| `tags` | `#标签[]` | `[]` | 这一条实例必须同时带有列出的**全部**标签。 |
| `stacks` | `{min?, max?}` | 无 | 层数区间，闭区间。 |
| `remaining_ticks` | `{min?, max?}` | 无 | 剩余时间区间，单位 tick。 |

`tags` 要的是「全部」，想要「任意一个」就用 `mxt:or` 组合多个 `mxt:has_curse`。

什么都不写就是「身上有任意一条诅咒」，配 `mxt:not` 即「身无诅咒」。区间两端都可省略，所以一个字段同时表达「至少」「至多」和「精确区间」；区间里的公式用调用者自己的上下文求值。

永不到期的实例在 `remaining_ticks` 里视作**无穷**，因此能满足 `min`、永远不满足 `max`。

```json
{"type": "mxt:has_curse", "tags": ["#example:cleanse/poison"], "stacks": {"min": 2}, "remaining_ticks": {"min": 1}}
```

## 携带诅咒的物品：`mxt:curse_container`

任意物品都能带 `mxt:curse_container` 组件，声明它**携带着哪些诅咒**。条目与 `mxt:apply_curse` 同形（`curse`、`stacks`、`duration_ticks`），只是源是这件装备本身：

```json
give @s minecraft:diamond_chestplate[mxt:curse_container={curses:[{"curse":"example:soul_scorch","stacks":2}]}]
```

三个时刻都由同一套对账负责，全部走普通诅咒事务，因此施加条件、叠层、时长照常判定：

- **装上即施加 / 加入**：六个装备槽（主手、副手、头、胸、腿、脚）与 Curios 槽都算，源分别是 `mxt:equipment/<槽位>/<物品 ID>` 与 `mxt:curios_equipment`。若这条诅咒**已经**被别的来源持有，装备不重新施加、只把自己的来源加进账本，所以层数与剩余时间不会被它刷新。
- **脱下只撤自己那一份**：脱下一件装备只是释放它自己的来源，别的来源还在就仍存在；确实是最后一份时才移除实例，原因是 `explicit`，因此不执行定义上的行为。
- **携带期间自愈**：诅咒到期、被解毒、或被整条移除之后，只要装备还在身上，携带者会在**最多 20 tick** 内被重新施加。装备槽的变化会立刻触发一次对账，Curios 与自愈走 20 tick 的慢对账。所以"戴上就一直中咒"用 `mxt:timed` 就够，不必写 `mxt:permanent`。

读这份组件用物品条件 `mxt:curse_container`：`curse` 接受条目、`#标签` 或数组，不写就是"任意诅咒"；可选的 `stacks` 是 `{min?, max?}` 窗口，比较的是该条目**将会施加**的层数（它的公式用当前上下文求值）。它问的是**物品封着什么**，与实体条件 `mxt:has_curse`（问持有者**身上已有**什么）是两件事，所以未装备的护甲照样答得出。

## 显示

人物信息面板的「诅咒」一行只列通过 `display_condition` 的实例，隐藏的连一行都不留。同一行会显示层数（`×N`），tooltip 给出**全部来源**与剩余时间。
