---
title: ability_type（技能类型）
description: mxt:ability_type 里的十四个技能类型，各自读哪些字段、什么时候跑。
---

# ability_type（技能类型）

技能定义**顶层**的 `type` 取自这张表：

```json
{"type": "mxt:active", "costs": [{"id": "example:qi", "amount": 10}], "cooldown": 40}
```

通用字段（所有类型都会读的那几个）写在[技能定义](../../json/ability)那一页，这里只记每个类型**自己**读的键。没被列出的键写了也不会被读。

## 一览

| `type` | 一句话 | 按键 |
| --- | --- | --- |
| [`mxt:empty`](#mxt-empty) | 什么都不做 | 否 |
| [`mxt:active`](#mxt-active) | 按一下，跑一次 | **是** |
| [`mxt:triggered`](#mxt-triggered) | 信号到了跑一次 | 否 |
| [`mxt:channelled`](#mxt-channelled) | 按住维持，每拍跑一次 | **是** |
| [`mxt:targeted`](#mxt-targeted) | 按一下，对一片目标各跑一次载荷技能 | **是** |
| [`mxt:aura`](#mxt-aura) | 每隔一段时间对半径内每个实体跑一次 | 否 |
| [`mxt:interval`](#mxt-interval) | 自己按节拍反复跑 | 否 |
| [`mxt:modifier`](#mxt-modifier) | 被动属性加成 | 否 |
| [`mxt:mount`](#mxt-mount) | 声明这件法器是飞行法器 | 否 |
| [`mxt:flight_control`](#mxt-flight-control) | 按一下起飞 / 落地 | **是** |
| [`mxt:storage`](#mxt-storage) | 按一下打开自带储物 | **是** |
| [`mxt:upkeep`](#mxt-upkeep) | 周期性扣费 | 否 |
| [`mxt:composite`](#mxt-composite) | 委托给子技能 | 否 |
| [`mxt:word`](#mxt-word) | 白名单里的两种效果 | 否 |

**按键**这一列只影响轮盘：只有按键型会进轮盘池，其余类型不会。命令、脚本与物品承载的技能对任何类型都直接施放。

## 四个动作字段 {#action-fields-by-type}

`entity_action`、`target_selector`、`target_condition`、`bi_entity_action` 写在技能顶层（与 `type` 平级），默认分别是 `mxt:no_op` / `mxt:self` / `mxt:always` / `mxt:no_op`。只有会跑动作的五个类型读它们：`mxt:active`、`mxt:triggered`、`mxt:channelled`、`mxt:aura`、`mxt:interval`。

一次执行的顺序固定：先跑 `entity_action`，再用 `target_selector` 取目标，每个目标过 `target_condition`，通过的才跑 `bi_entity_action`。某个目标失败不影响其他目标，动作抛异常也只记一条日志、不打断其余目标。

会跑这套字段的五个类型各自按**自己的时机**跑：

| 类型 | 什么时候跑这四键 |
| --- | --- |
| `mxt:active` | 按下的那一次（有 `cast_time` 时是走完的那一 tick）。 |
| `mxt:triggered` | 触发器命中、概率通过、费用付掉之后。 |
| `mxt:channelled` | 激活时一次，随后每个 `tick_interval` 在维持资源扣成功后各一次。 |
| `mxt:aura` | `interval` 到点的脉冲**按半径逐个找实体**，对每个实体只跑 `target_condition` + `bi_entity_action`（脉冲不读 `target_selector` 与 `entity_action`）；被一次性发动（命令 / 脚本 / 符箓）时按普通路径跑一次整套。 |
| `mxt:interval` | 自己按 `interval` 跑整套；被命令或脚本一次性发动时按普通路径跑一次。 |

其余类型**一个都不读**：`mxt:word` 自带终端载荷（它自己的 `effect` 字段）、`mxt:composite` 委托给子技能、`mxt:targeted` 只挑目标（跑的是载荷的单目标那一半），`mxt:modifier` / `mxt:mount` / `mxt:flight_control` / `mxt:storage` / `mxt:upkeep` / `mxt:empty` 也没有这一层。

`mxt:targeted` 也写一个叫 `target_selector` 的键，但那是它自己"这次够得着谁"，不是上面这套的一半。

## 每个类型读哪些字段

| `type` | 自己读的字段 |
| --- | --- |
| `mxt:empty` | 无 |
| `mxt:active` | `cooldown`、四个动作字段 |
| `mxt:triggered` | `triggers`、`chance`、`damage_condition`、`cooldown`、四个动作字段 |
| `mxt:channelled` | `cooldown`、`tick_interval`、`upkeep_costs`、四个动作字段 |
| `mxt:targeted` | `target_selector`、`ability`、`cooldown` |
| `mxt:aura` | `cooldown`、`interval`、`radius`、四个动作字段 |
| `mxt:interval` | `interval`、四个动作字段 |
| `mxt:modifier` | `modifiers` |
| `mxt:mount` | `speed`、`seats`、`sit`、`render`、`entity_type`、`display`、`width`、`height`、`step_height`、`seat_offsets`、`mount_action`、`trail` |
| `mxt:flight_control` | `hand`、`speed_multiplier`、`cooldown` |
| `mxt:storage` | `slots`、`cooldown` |
| `mxt:upkeep` | `interval`、`on_fail`、`owner_only` |
| `mxt:composite` | `abilities`、`all_required` |
| `mxt:word` | `effect`、`requires_operator`、`amount`、`cooldown` |

`cooldown` 与 `damage_condition` 只有一部分类型读，所以它们不在通用字段表里，但 JSON 里照样写在 `type` 同级。

- **`cooldown`**（`NumberProvider`，默认 `0`）：冷却长度，写进 `mxt:cooldown` 状态。会付款的路径读它——`mxt:active` / `mxt:triggered` / `mxt:channelled` / `mxt:aura` / `mxt:word` / `mxt:targeted` / `mxt:flight_control` / `mxt:storage`。不付款的类型写了也没人读。
- **`damage_condition`**（`DamageCondition`，默认 `mxt:always`）：**只有 `mxt:triggered` 读**。它订阅 `mxt:hurt` 信号时先过这个条件，不成立就跳过这次信号。别的类型写了等于没写，要挑场景用 `condition`。

## 状态种类

技能能存哪些状态由它的 `type` 决定，数据包不声明。这张表决定 `mxt:modify_storage` 与六个 `mxt:storage_*` 条件认不认某个值：

| `type` | 声明的状态种类 |
| --- | --- |
| `mxt:empty` / `mxt:modifier` / `mxt:mount` / `mxt:upkeep` / `mxt:composite` | 只有默认的 `mxt:active_state` |
| `mxt:active` / `mxt:triggered` / `mxt:channelled` / `mxt:aura` | `mxt:active_state`、`mxt:cooldown`、写了 `charges` 时的 `mxt:charges`，以及 `mxt:toggle` / `mxt:timer` / `mxt:resource` / `mxt:target_lock` |
| `mxt:interval` | `mxt:active_state` 与那四种内容自用种类；没有 `mxt:cooldown`、没有 `mxt:charges` |
| `mxt:targeted` | `mxt:active_state`、`mxt:cooldown`、写了 `charges` 时的 `mxt:charges`；没有那四种 |
| `mxt:flight_control` | `mxt:active_state`、`mxt:cooldown` |
| `mxt:storage` | `mxt:active_state`、`mxt:cooldown`、`mxt:container` |
| `mxt:word` | `mxt:active_state`、`mxt:cooldown`、写了 `charges` 时的 `mxt:charges` |

这六种的字段、写法与读取方式见[技能施放](/technical/ability)。

## `mxt:empty`

没有字段，也没有生命周期。`{"type": "mxt:empty"}` 就是整条技能。常用来占位，或者给"只想授予一个 id"的场合用。

## `mxt:active`

按一下跑一次四个动作字段；有 `cast_time` 时是走完的那一 tick。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `cooldown` | `NumberProvider` | `0` | 冷却长度，tick |
| `entity_action` | `EntityAction` | `mxt:no_op` | 先对施法者跑 |
| `target_selector` | `TargetSelector` | `mxt:self` | 怎么取目标 |
| `target_condition` | `BiEntityCondition` | `mxt:always` | 每个目标都要过 |
| `bi_entity_action` | `BiEntityAction` | `mxt:no_op` | 通过条件的目标才跑 |

**它没有 `slot` 字段。** 技能落在轮盘哪一格由玩家自己的 12 格布局决定，与技能定义无关。

```json
{
  "type": "mxt:active",
  "costs": [{"id": "example:qi", "amount": 10}],
  "cooldown": 40,
  "entity_action": {"type": "mxt:spawn_particles", "particle": {"type": "minecraft:flame"}},
  "target_selector": {"type": "mxt:ray", "length": 16},
  "target_condition": {"type": "mxt:not_owner"},
  "bi_entity_action": {"type": "mxt:set_on_fire", "ticks": 60}
}
```

## `mxt:triggered`

`triggers` 里的某个信号到达、`chance` 通过、费用付掉之后，跑一次四个动作字段。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `triggers` | `Trigger` 列表 | `[]` | 空列表＝永不触发 |
| `chance` | `NumberProvider` | `1` | 这次算不算数 |
| `damage_condition` | `DamageCondition` | `mxt:always` | 只在 `mxt:hurt` 信号上用 |
| `cooldown` | `NumberProvider` | `0` | 冷却长度 |
| `entity_action` | `EntityAction` | `mxt:no_op` | 先对施法者跑 |
| `target_selector` | `TargetSelector` | `mxt:self` | 怎么取目标 |
| `target_condition` | `BiEntityCondition` | `mxt:always` | 每个目标都要过 |
| `bi_entity_action` | `BiEntityAction` | `mxt:no_op` | 通过条件的目标才跑 |

`chance` 的口径：求值抛异常或不是有限数＝不放行，`≤ 0` 不放行，`≥ 1` 必放行，中间值按实体随机数掷一次。注意这与 [trigger 规则](/datapack/json/trigger)里同名的 `chance` 不一样，那边算不出数时按 `1` 处理。

```json
{
  "type": "mxt:triggered",
  "triggers": [{"type": "mxt:item_use"}],
  "costs": [{"id": "example:qi", "amount": "10 + level"}],
  "cooldown": 100,
  "condition": {"type": "mxt:sneaking"},
  "entity_action": {"type": "mxt:spawn_particles", "particle": {"type": "minecraft:crit"}},
  "target_selector": {"type": "mxt:ray", "length": 6, "limit": 1},
  "target_condition": {"type": "mxt:not_owner"},
  "bi_entity_action": {"type": "mxt:damage", "amount": "6 + level"}
}
```

## `mxt:channelled`

激活的那一次走完整施放，之后每 `tick_interval` 维持一次：先查 `condition`，再按 `upkeep_costs` 全有或全无扣费，成功了才跑四个动作字段。任一步失败就停止引导。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `cooldown` | `NumberProvider` | `0` | 冷却长度 |
| `tick_interval` | `NumberProvider` | `1` | 两次维持之间的 tick 数 |
| `upkeep_costs` | `Cost` 列表 | `[]` | 每次维持的代价 |
| `entity_action` | `EntityAction` | `mxt:no_op` | 激活时与每次维持都先跑 |
| `target_selector` | `TargetSelector` | `mxt:self` | 怎么取目标 |
| `target_condition` | `BiEntityCondition` | `mxt:always` | 每个目标都要过 |
| `bi_entity_action` | `BiEntityAction` | `mxt:no_op` | 通过条件的目标才跑 |

```json
{
  "type": "mxt:channelled",
  "tick_interval": 20,
  "upkeep_costs": [{"id": "example:qi", "amount": 1}],
  "entity_action": {"type": "mxt:add_resource", "resource": "example:qi", "amount": 2}
}
```

## `mxt:targeted`

按一下走一次完整施放，用 `target_selector` 挑出目标，然后对**每个目标**跑载荷技能 `ability` 的单目标那一半：载荷的 `target_condition` 过滤、载荷的 `bi_entity_action` 生效，行为者仍是按下的人。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `target_selector` | `TargetSelector` | **必填** | 这次够得着谁，距离与形状写在这里 |
| `ability` | 技能 id | **必填** | 每个目标身上跑的载荷技能 |
| `cooldown` | `NumberProvider` | `0` | 冷却长度 |

载荷**只收具体 id，不收 `#标签`**，而且必须是会跑四个动作字段的五个类型之一；写了 `mxt:modifier` / `mxt:composite` / `mxt:word` / 另一条 `mxt:targeted` 会在付款之前就被拒掉。

载荷自己的 `costs` / `cast_time` / `cooldown` / `charges` / `condition` / 元素亲和，以及它的 `entity_action` 与 `target_selector`，一个都不读。

一个目标都没选中（或全被载荷的 `target_condition` 挡掉）＝ `NO_TARGET`；载荷类型没有单目标那一半＝ `NOT_APPLICABLE`。两个都在付款之前判掉。

## `mxt:aura`

每隔 `interval` 刻对自己周围跑一次脉冲。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `cooldown` | `NumberProvider` | `0` | 冷却长度 |
| `interval` | `NumberProvider` | `20` | 两次脉冲之间的 tick 数 |
| `radius` | `NumberProvider` | `4` | 脉冲范围 |
| `entity_action` | `EntityAction` | `mxt:no_op` | 一次性发动时先对施法者跑；脉冲不读 |
| `target_selector` | `TargetSelector` | `mxt:self` | 一次性发动时怎么取目标；脉冲不读 |
| `target_condition` | `BiEntityCondition` | `mxt:always` | 范围内每个实体都要过 |
| `bi_entity_action` | `BiEntityAction` | `mxt:no_op` | 通过条件的目标才跑 |

脉冲选人**只用 `radius`**：以施法者为中心的球，逐个目标比直线距离，不读 `target_selector` 与 `entity_action`。`radius` 求值不是有限数或为负时这一拍跳过。脉冲会给双实体上下文多放两个公式变量：`aura_radius` 与 `distance`。

被命令、脚本或符箓一次性发动时，它按普通路径跑一次整套。

注意 `mxt:aura` 的 `radius` 是**球**，`mxt:area` 选择器的 `radius` 是**方盒**。两者名字一样，覆盖的实体不是一批。

## `mxt:interval`

自己按节拍反复跑。每 `interval` 刻（世界时间能整除它的刻）且它算作生效时跑一次四个动作字段。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `interval` | `NumberProvider` | `20` | 两次动作之间的 tick 数 |
| `entity_action` | `EntityAction` | `mxt:no_op` | 先对施法者跑 |
| `target_selector` | `TargetSelector` | `mxt:self` | 怎么取目标 |
| `target_condition` | `BiEntityCondition` | `mxt:always` | 每个目标都要过 |
| `bi_entity_action` | `BiEntityAction` | `mxt:no_op` | 通过条件的目标才跑 |

`interval` 求不出可用的刻数（不是有限数、或小于 `1`）时这一拍跳过。被命令或脚本一次性发动时不看节拍，直接跑一次。

它不付款，所以没有 `cooldown` 也没有充能。

## `mxt:modifier`

被授予期间把 `modifiers` 贡献给持有者的原版属性，并且每 tick 重新过一遍 `condition`；不满足时贡献撤下。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `modifiers` | `AttributeEntry` 列表 | `[]` | 属性修正 |

每条 `AttributeEntry` 是 `attribute` + `id` / `amount` / `operation`，另有可选的 `value`：写了 `value` 就用它求值，不写用 `amount`（每 tick 重算）。字段细节见[共享数据类型](../shared_data_types)。

`amount` 不是有限数不会在加载期报错，运行期跳过那一条。

它不是按键型，不执行 `entity_action`，也不进轮盘池。

```json
{
  "type": "mxt:modifier",
  "modifiers": [
    {"attribute": "minecraft:attack_damage", "id": "example:blade", "amount": 2, "operation": "add_value"}
  ]
}
```

## `mxt:mount`

**一条 `mxt:mount` 就是声明"这件法器是飞行法器"**：写进法器的 `abilities` 之后，御器之术才能从主手、其次副手把它取出来当载具——飞多快、坐几个人、烧什么燃料、长什么样，全由这一条回答。它**从不被发动**，只读自己的字段、顶层的 `costs`（每 tick 的燃料）与 `condition`（每 tick 复查，不满足就落地）。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `speed` | `NumberProvider` | **必填** | 载具速度 |
| `seats` | int | `1` | 总座位数，含驾驶者，取值 `1`–`4` |
| `sit` | bool | `false` | 乘坐姿势，全车共用 |
| `render` | 渲染器 | `mxt:item` | 用哪套渲染器画载具 |
| `entity_type` | 实体类型 id | `mxt:flying_sword` | 用哪个实体类型当载具，必须实现[载具契约](../../../java/interfaces/mount/vehicle.md)，写错 id 在加载期报错 |
| `display` | `{translation, rotation, scale}` | 不写＝该渲染器自己的默认姿势 | 载具相对载具原点怎么摆 |
| `width` | double | `0.35` | 碰撞箱宽 |
| `height` | double | `0.12` | 碰撞箱高 |
| `step_height` | double | `0` | 跨台阶高度 |
| `seat_offsets` | `Vec3` 列表 | 按座位序号沿后方每 `0.8` 摊开，第 0 个在 `0.65` 高 | 每个座位的落点（格） |
| `mount_action` | `{on_mount, on_dismount, tick}` | 三个都是 `mxt:no_op` | 载具自己的三个行为 |
| `trail` | 对象 | 不写＝没有尾迹 | 尾迹粒子 |

**`entity_type` 换的是"用哪个实体飞"**：不写就是框架自带的 `mxt:flying_sword`；写了按 id 从原版实体类型注册表取，id 写错在**加载期**报错。能不能当载具要问那个实体自己——类型必须实现[载具契约](../../../java/interfaces/mount/vehicle.md)，否则起剑被拒（动作栏照旧报"骑不上去"，日志点名类型、每个类型只记一次）。**换个实体类型＝换一套行为**：移动、落剑、座位、上座、尺寸、存档与渲染都在那个实体身上，定义里的 `width` / `height` / `seat_offsets` / `sit` / `step_height` / `render` / `display` 也要那个实体自己去读，所以"船 / 轿 / 飞舟"是附属注册一个实体类型 + 一个渲染器、数据包点名它。

`costs` 是每 tick 的燃料：先扣载具里那件法器存的同门灵气，余额才由驾驶者付，可以写小数。

`render` 选**用哪套渲染器**：默认 `mxt:item`（画承载物品的物品模型）、`mxt:geckolib`（GeckoLib 的模型与动画，要求客户端装了它），以及内容模组注册的类型。`display` 可选，不写就用该渲染器自己的默认姿势（`mxt:item` 是 `[0,0,0]` / `[90,0,-45]` / `[2,2,2]`，`mxt:geckolib` 是不转、`1` 倍）；它的字段与原版物品模型的 `display` 同名同义，`translation` 以 1/16 格书写、读进来按格存，`rotation` 是角度、按 `rotationXYZ` 组合，`scale` 是倍率（负值是镜像，合法）。三个 `render.type`、GeckoLib 的资源路径与七个姿态见[载具渲染器](./mount-render.md)。改完碰撞箱会立刻生效。

`seat_offsets` 写出来的最后一个给余下的座位复用。`seats` 是总人数含驾驶者，驾驶者必须是玩家，其余座位对载具按右键就能上。驾驶者用移动键操作：跳跃上升、下降键下沉、疾跑给 1.5 倍水平速度，前后左右默认沿视线方向（服务端配置「飞行 → 朝视线方向飞行」），潜行仍是原版的下坐骑。位移只在服务端算。

`mount_action` 的三个行为都跑在**驾驶者**身上：起剑那一刻、落剑那一刻（在下座之前）、每 tick（燃料已付）。

`trail` 的字段是 `particle`（必填）与 `interval`（默认 `1`，`1`–`200`）、`count`（默认 `1`，`0`–`256`）、`speed`（默认 `0`）、`spread`（默认 `[0.2, 0.1, 0.2]`）、`offset_x` / `offset_y` / `offset_z`（默认 `0` / `0.1` / `0`）、`moving_only`（默认 `false`）。`particle` 必须写成对象，例如 `{"type": "minecraft:end_rod"}`，裸 id 字符串会在加载期报错。`spread` 与 `offset_*` 的单位是**格**（不像 `mxt:spawn_particles` 会乘实体尺寸）；`moving_only` 开了就只在真的移动的那一 tick 发。

加载期会拒：`seats` 不在 `1`–`4`、`seat_offsets` 超过 4 项或含非有限向量、`width` / `height` 非正或非有限、`step_height` 为负或非有限、`trail` 的 `speed` / `spread` / `offset_*` 非有限、`trail.interval` / `trail.count` 越界。

撞到方块或地面就落剑。

## `mxt:flight_control`

按一下从主手、其次副手取那件飞行法器起飞，再按一下落地。通常由功法授予。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `hand` | `main` / `off` / `either` | `either` | 从哪只手找载具 |
| `speed_multiplier` | `NumberProvider` | `1` | 乘在载具的 `speed` 上 |
| `cooldown` | `NumberProvider` | `0` | 冷却长度 |

它读 `costs`、`condition`、`cooldown` 与显示字段。`cast_time` / `charges` / 四个动作字段 / `damage_condition` / 元素亲和它都不读。

它与 `mxt:storage` 都不扣充能。

## `mxt:storage`

按一下打开承载物自带的储物。需要一件承载它的物品。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `slots` | `NumberProvider` | **必填** | 储物格数 |
| `cooldown` | `NumberProvider` | `0` | 冷却长度 |

格数求值顺序：`floor(求值)` → 夹在 `0` 到 32 位整数上限之间 → `≤ 0` 直接当 0（按下时报 `INVALID_FORMULA`）→ 行数 `clamp((格数 + 8) / 9, 0, 6)` → 容量＝行数 × 9，**最多 54 格**。

按下的失败原因：不是服务端玩家＝ `UNAVAILABLE`，手上没有承载物＝ `NO_CARRIER`，不是主人＝ `NOT_OWNED`。

内容住在物品组件 `mxt:storage` 上，按这条技能自己的 id 记一条记录。同一个载体上的两条储物技能各有各的箱子。

它同样不扣充能。

## `mxt:upkeep`

周期性代价：服务器每 tick 看在线玩家手里（主手、副手、全部 Curios 槽）的承载物，每 `interval` 刻把技能自己的 `costs` 全有或全无地扣一次。需要一件承载它的物品。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `interval` | `NumberProvider` | `20` | 两次结算之间的 tick 数 |
| `on_fail` | `ItemAction` | `mxt:no_op` | 付不出时对持有者与该物品堆跑 |
| `owner_only` | Boolean | `true` | 只有主人承担；为 `false` 时谁带着谁付 |

`interval` 走世界时间，只在能被它整除的刻结算；求值不可用（不是有限数、小于 `1`、超出 64 位整数上限）时回退到默认 `20`，不会变成每 tick。

跳过结算的情况：这件物品上没有 `mxt:upkeep`、`costs` 为空、`owner_only` 为真而持有者不是主人、当前刻不能被 `interval` 整除。

它不是按键型。

## `mxt:composite`

自己不做事，委托给子技能。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `abilities` | 技能 id 列表 | **必填** | 子技能 |
| `all_required` | Boolean | `true` | 要不要全部通过才执行 |

子技能**只收具体 id，不收 `#标签`**，写标签会被当成坏条目录一条日志后丢弃。法器 `abilities`、功法 `granted_abilities`、符箓 `abilities` 那几个字段相反，id 与 `#标签` 都收。

它自己的 `costs` / `cast_time` / `cooldown` / `charges` 都不生效——钱与冷却记在**子技能自己的 id** 下。`condition` 与元素亲和仍先按它自己查一遍。

`all_required: false` 时只把**列表第一个**子技能交给施放，其余完全不看；列表为空时报 `NOT_GRANTED`。`all_required: true` 时先对每个子技能做一次预演（条件、元素亲和、代价、充能、冷却逐项算进草稿），任一项失败则整条不落地、一个子技能都不会跑；全部通过后才按列表顺序提交并依次执行。`cast_time > 0` 的子技能在预演阶段就以 `INVALID_FORMULA` 拒掉。

## `mxt:word`

终端载荷，自己不执行目标行为。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `effect` | `self_heal` / `purge_self_curses` | **必填** | 效果，未知取值加载期报错 |
| `requires_operator` | Boolean | `true` | 施放者必须是权限等级达到 gamemaster 的玩家 |
| `amount` | `NumberProvider` | `0` | 传给效果的量，只对 `self_heal` 有意义 |
| `cooldown` | `NumberProvider` | `0` | 冷却长度 |

`effect` 是一份代码白名单，数据包加不了第三种。它不是任意命令字符串，也和技能上那套动作字段无关；要别的效果就写一条技能加 `entity_action`（例如 `mxt:heal`）。

`amount` 要求求值有限、非负、不超过单精度浮点上限，否则这次施放以 `PERMISSION_DENIED` 拒掉。`requires_operator` 不满足同样拒。

它不是按键型，通常作为 `mxt:composite` 的子技能，或由命令、脚本施放。
