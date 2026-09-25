---
title: secret_realm（秘境）
aside: false
---

# secret_realm（秘境） {#secret_realm}

文件位置：`data/<namespace>/mxt/secret_realm/<path>.json`

**用途**：秘境模板：实例维度生成、边界、结构、落点、认领与进出规则。

秘境定义是**一份模板**，不是某个固定维度：每次进入都会按它开出一份**实例维度**，实例的身份就是那个维度键。维度键固定为 `<定义命名空间>:secret_realm/<定义路径>/<序号>`，序号从 `0` 开始——**即使这份定义只能开出一份实例，序号也在**（`example:secret_realm/trial_realm/0`）。每份实例的地形因此天然隔离在 `dimensions/<命名空间>/secret_realm/<路径>/<序号>/` 下，灵气区域也能直接按这个 id 命中（见下面的「灵气整合」）。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `secret_realm.mxt.<命名空间>.<路径>` | 可选显示名。省略时用左列的默认键。 |
| `description` | Text Component | `secret_realm.mxt.<命名空间>.<路径>.description` | 可选描述。省略时用左列的默认键；目前只被存储与读取，还没有界面绘制它。 |
| `generation` | 生成参数 | **必填** | 实例维度怎么造出来，见下。 |
| `seed` | Long | `0` | `0` 表示每份实例随机一个种子；非 0 时所有实例共用。 |
| `border` | 对象 | 无 | 秘境边界：`center`（`[x, z]`，默认 `[0, 0]`）、`size`（直径，默认原版 `29999984`）、`warning_blocks`（默认 `5`）、`warning_time`（默认 `15`，秒）、`damage_per_block`（默认 `0.2`）、`safe_zone`（默认 `5`）。**不写边框不等于"随它去"**：新造的实例维度会被显式设成原版默认边界，不会继承主世界缩小过的边框；`mxt:existing` 例外，它只在写了 `border` 时才动那个真实维度的边框。 |
| `max_instances` | Integer `1..256` | `1` | 同一定义**所有实例合计**的上限，与 `owned` 无关；满了以后进入会失败（`NO_FREE_INSTANCE`）。 |
| `max_members` | Integer `1..100000` | 无（不限） | **每份实例**的同时在场人数上限。 |
| `owned` | Boolean | `false` | 实例是否可被认领，见下。 |
| `duration_ticks` | Long | `0` | 实例时限，`0` 表示不过期；到期把所有人送回并结束这一轮。 |
| `structures` | 数组 | `[]` | 实例建好后、有人进去之前放置的结构，见下。 |
| `entry` | 对象或数组 | 无（随机落点） | 进入后的落点。写单个对象就是唯一落点；写数组则按 `weight` 加权随机选一处，见下。 |
| `enter_condition` | `EntityCondition` | `mxt:always_true` | 对进入者求值，不成立则拒绝进入（`CONDITION_NOT_MET`）。 |
| `exit_condition` | `EntityCondition` | `mxt:always_true` | **只约束主动离开**（令牌右键、`/mxt secret_realm exit`）；过期与强制送回不看它，否则数据包能把玩家永久锁在秘境里。 |
| `enter_denied_message` | `Component` | 无 | 进入条件不成立时发给玩家的提示，缺省则显示失败码；裸字符串按翻译键处理。 |
| `exit_denied_message` | `Component` | 无 | 同上，作用于退出条件。 |
| `enter_action` | `EntityAction` | `mxt:no_op` | 进入行为，作用于进入者，时机在传送落位之后。 |
| `exit_action` | `EntityAction` | `mxt:no_op` | 离开行为，作用于离开者，时机在传送回原位置之前。 |

## `generation`（必填）

| `type` | 参数 | 含义 |
| --- | --- | --- |
| `mxt:stem` | `stem`（`LevelStem` id） | 拿一个已注册的维度生成器当模板，开一份新维度键的实例。 |
| `mxt:flat` | `preset`（原版超平坦层串）、`dimension_type`（默认 `minecraft:overworld`）、`structures`（默认 `true`） | 超平坦世界，例如 `"1*minecraft:bedrock,2*minecraft:dirt,minecraft:grass_block;minecraft:plains"`。 |
| `mxt:void` | `biome`（默认 `minecraft:the_void`）、`dimension_type`、`structures`（默认 `false`） | 空世界：没有地层、一个生物群系、默认不生成结构，适合全靠 `structures` 造景的秘境。 |
| `mxt:template` | `template`（`[A-Za-z0-9_-]+`）、`stem` | 从存档目录 `<服务器目录>/mxt_secret_realm/<template>/` 复制 `region`、`entities`、`poi` 后再加载；手工搭好的地图走这条。 |
| `mxt:existing` | `dimension`（维度 id） | 不创建任何维度，直接用一个已存在的维度（含数据包 `dimension/` 条目）。`max_instances` 对它没有意义，实例结束时也不会卸载或删除那个维度。 |

`generation` 里引用的注册表项（`stem`、`dimension_type`、`biome`）都在**实例创建时**解析：数据包注册表是并行加载的，解码期读 holder 未必已经绑定。解析失败即创建失败（`GENERATION_FAILED`）并记一条日志，不会留下半个实例。

## `structures`（可选）

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `nbt` | Identifier | **必填** | 结构模板 id，取 `data/<命名空间>/structure/<路径>.nbt`，即原版结构方块那套文件，资源包与数据包都能覆盖。 |
| `pos` | `[x, y, z]` | **必填** | 实例维度内的坐标（`relative_to_entry` 为真时相对入口落点）。写了 `border` 时，绝对坐标必须落在边框内，否则加载期就报错。 |
| `rotation` | 枚举 | `none` | `none`、`clockwise_90`、`clockwise_180`、`counterclockwise_90`，绕结构原点旋转。 |
| `mirror` | 枚举 | `none` | `none`、`left_right`、`front_back`。 |
| `integrity` | Double `0..1` | `1.0` | 完整度，缺块越多越像废墟。 |
| `chance` | Double `0..1` | `1.0` | **每份实例**独立掷一次，决定这个结构这次放不放。 |
| `relative_to_entry` | Boolean | `false` | 坐标以入口落点为基准，用于"入口就在建筑里"的布局。 |
| `ignore_entities` | Boolean | `false` | 跳过结构自带的实体。 |
| `keep_liquids` | Boolean | `true` | 保留结构自带的流体设置。 |

## `entry`（可选）

单个对象或对象数组；数组按 `weight`（默认 `1`）加权随机选一处，权重为 `0` 的条目永远不会被选中。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `pos` | `[x, y, z]` | 无 | 固定落点，写全三个数就精确使用这个坐标。缺省 `pos` 的条目改走随机落点，高度取该列地表。 |
| `yaw` / `pitch` | Float | 进入者自身角度 | 固定朝向。 |
| `random_center` | `[x, z]` | 边框中心 | `pos` 缺省时随机落点的圆心。 |
| `random_radius` | Double | 边框直径的 80%（无边框时 `64`） | 随机落点半径。 |
| `spread` | Double | `3.0` | 同一批进入者的散开距离（格）；`0` 表示全落同一点。第一个进入者始终落在锚点上。 |

被选中的落点会成为这份实例的**锚点**并存进实例记录：后来的旅客（玩家或生物）落到同一处附近，而不是各自随机到秘境另一头。

## `owned`（可选，默认 `false`）

`owned: true` 表示这份实例**可以被认领**。第一个进去的人成为主人，主人身份记录在实例上并向数据包暴露：

- 实体条件 [mxt:in_secret_realm](/datapack/types/condition/entity_condition_types) 判定"我是否在某份实例里"，`role` 取 `any`（在里面）、`owner`（我是主人）、`guest`（在里面但不是主人）；可选 `definition` 字段把判定限定到某个定义或标签。
- 公式变量 `secret_realm_is_owner`（`1` 或 `0`）、`secret_realm_members`、`secret_realm_limit`、`secret_realm_elapsed`、`secret_realm_duration`、`secret_realm_index`，可在进出条件与进出行为里读。不在任何实例里时这些名字按"无法提供"处理（开发环境会报日志）。名字带 `secret_realm_` 前缀是因为 `realm` 已经被境界占用了，见[公式变量](/datapack/types/formula_variables)。

认领最实际的区别在**没人之后**：

| 情况 | 最后一个成员离开后 |
| --- | --- |
| `owned: true` | 维度**卸载但不删除**：地形、方块改动与已放置的结构都留着，主人下次进来接着用（时限重新开始算），记录跨重启保留。 |
| `owned: false` | 实例随最后一个人离开而**销毁**：卸载维度并**删除整个实例目录**（区块数据连同 `data/` 里的关卡与附件数据），下次进入是全新一份。 |
| `mxt:existing` | 无论 `owned` 如何都不卸载、不删除那个维度，只清空成员。 |

`max_instances` 是所有实例合计（不看主人）：`max_instances: 2` 的秘境最多同时存在两份，第三个人会进入已有且没满的那一份，否则失败。

## 灵气整合

实例维度是运行时维度，没有自己的 `LevelStem` 注册项，所以 [aura_zone](/datapack/json/aura_zone) 的 `dimensions` 除了直接写实例维度 id（`<命名空间>:secret_realm/<路径>/<序号>`），还可以写该实例所用的 `stem`（如 `minecraft:the_end`）或定义 id——两者都会命中它的**所有份**。"末地型秘境统统是死灵气"这类规则因此只需要一条区域。

## 示例

```json
// data/example/mxt/secret_realm/trial_realm.json
{
  "generation": { "type": "mxt:void", "biome": "minecraft:the_void", "dimension_type": "minecraft:the_end" },
  "seed": 0,
  "border": { "center": [0.0, 0.0], "size": 256.0, "warning_blocks": 5, "damage_per_block": 0.2 },
  "max_instances": 2,
  "max_members": 4,
  "owned": true,
  "duration_ticks": 12000,
  "structures": [
    { "nbt": "example:trial/arena", "pos": [0, 64, 0] },
    { "nbt": "example:trial/pillar", "pos": [32, 64, 0], "rotation": "clockwise_90", "chance": 0.5 }
  ],
  "entry": [
    { "pos": [0.5, 65.0, 0.5], "yaw": 90.0, "weight": 3 },
    { "random_center": [64.0, 64.0], "random_radius": 24.0, "weight": 1 }
  ],
  "enter_condition": { "type": "mxt:has_realm", "aura": "example:qi" },
  "enter_denied_message": "secret_realm.mxt.example.too_weak",
  "enter_action": { "type": "mxt:apply_effect", "effect": "minecraft:night_vision", "duration_ticks": 12000 },
  "exit_action": { "type": "mxt:heal", "amount": 4 }
}
```

**删除定义前先清理实例。** 实例记录用注册表 holder 持久化定义引用，所以如果删掉一个**还有实例存在**的秘境定义，下次启动时那份记录会读不出来，它的地形会被当成遗留数据清掉。先 `/mxt secret_realm destroy <维度>`，再删定义。

失败码会出现在 `item.mxt.secret_realm_token.enter_failed` 的提示里（除非定义自带 `*_denied_message`）：`DISABLED`（定义被 `mxt:disabled` 停用）、`ALREADY_TRAVELLING`、`CONDITION_NOT_MET`、`NO_FREE_INSTANCE`、`MISSING_STRUCTURE`、`GENERATION_FAILED`、`MISSING_DIMENSION`（只有 `mxt:existing` 会缺维度）、`FULL`、`CANCELLED`（`EnterPre` 事件被取消）、`EXIT_DENIED`、`NOT_TRAVELLING`、`MISSING_ORIGIN`。
