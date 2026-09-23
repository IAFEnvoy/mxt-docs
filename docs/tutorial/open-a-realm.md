---
title: 开一个秘境
description: 写一份秘境模板：用什么维度生成、边界怎么划、落点在哪、谁能进、谁来认领、什么时候删，以及秘境里的灵气、阵法与裂隙。
---

# 开一个秘境

秘境是"一次性或可认领的小世界"：**定义只是一份模板**，每一份实例都是一个真正的、独立的运行时维度。玩家进去、出来、再进去看到的是同一份地形——只要它还被认领。

::: warning 先分清两个命令

`/mxt realm` 只管**线性境界链**（`/mxt realm set <境界>`）；秘境实例的运维全在 **`/mxt secret_realm …`**。本篇讲的是后者。

:::

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `data/example/mxt/secret_realm/trial_realm.json` | 一份秘境模板：生成方式、边界、落点、寿命。 |

## 第 1 步 —— 用什么造这个世界

```json
// data/example/mxt/secret_realm/trial_realm.json
{
  "generation": {
    "type": "mxt:flat",
    "preset": "1*minecraft:bedrock,2*minecraft:dirt,minecraft:grass_block;minecraft:plains"
  }
}
```

`generation` 是**唯一必填**的字段，`type` 决定其余参数：

| `type` | 参数 | 说明 |
| --- | --- | --- |
| `mxt:flat` | `preset`（必填）、`dimension_type`（默认 `minecraft:overworld`）、`structures`（默认 `true`） | 超平坦：预设串里 `;` 之后是群系。做教程与测试最省事。 |
| `mxt:void` | `biome`（默认 `minecraft:the_void`）、`dimension_type`、`structures`（默认 `false`） | 空世界：**没有地层**，所以落点会掉进虚空——要用就得自己放结构托住。 |
| `mxt:stem` | `stem`（`LevelStem` id） | 用现成的维度类型/群系/噪声设置造一个全新维度。 |
| `mxt:template` | `template`、`stem` | 从服务器目录里的模板复制现成地形。 |
| `mxt:existing` | `dimension` | 不建维度，直接用一个真实维度；这种实例永不被卸载或删除。 |

秘境的维度 id 由定义与序号生成：`<定义的命名空间>:secret_realm/<定义的路径>/<序号>`，序号从 0 开始——所以同一份模板可以开出很多份互不干扰的世界。

## 第 2 步 —— 划边界

```json
"border": {
  "center": [0, 0],
  "size": 256,
  "warning_blocks": 5,
  "warning_time": 15,
  "damage_per_block": 0.4,
  "safe_zone": 3.0
}
```

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `center` | `[0.0, 0.0]` | 边框中心，写法是 `[x, z]`（只有两个数）。 |
| `size` | `29999984.0` | **直径**，必须正有限。 |
| `warning_blocks` / `warning_time` | `5` / `15` | 距离边界多少格开始警告、警告持续多少秒。 |
| `damage_per_block` / `safe_zone` | `0.2` / `5.0` | 越过安全区后每格掉多少血。 |

写入的就是原版世界边界，所以越界的观感、提示与伤害都是原版那一套，模组不额外加逻辑。**没写 `border` 也会被显式设成原版默认值**——这是刻意的，免得新维度继承主世界被缩小过的边框。

## 第 3 步 —— 落在哪

不写 `entry` 时落点是随机的（半径默认取边框直径的 40%，圆心取边框中心，y 取地表）。想控制落点就写一个列表：

```json
"entry": [
  {
    "pos": [0, 80, 0],
    "yaw": 0, "pitch": 0,
    "enter_condition": {"type": "mxt:always_true"},
    "enter_denied_message": {"text": "你还没有资格踏入此地"}
  },
  {
    "random_center": [64, 64], "random_radius": 12, "spread": 4.0, "weight": 3,
    "enter_action": {"type": "mxt:play_sound", "sound": "minecraft:block.beacon.activate"}
  }
]
```

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `pos` | 无 | 精确落点；写了就用它，**y 不会被改写**。 |
| `yaw` / `pitch` | 进入者自身角度 | 进入时的朝向。 |
| `random_center` / `random_radius` | 边框中心 / 边框 `size × 0.4` | 没有 `pos` 时在这个圆里随机，y 在结构放完之后取地表。 |
| `spread` | `3.0` | 同批多人进入时的散开半径（取**所有**落点里最大的那个）。 |
| `weight` | `1` | 多个落点之间的相对权重。 |
| `enter_condition` / `exit_condition` | 恒真 | 进/出这一次的门槛；`exit_condition` 只约束**主动离开**。 |
| `enter_denied_message` / `exit_denied_message` | 无（显示失败码） | 被门槛拦下时给玩家看的话。 |
| `enter_action` / `exit_action` | `mxt:no_op` | 落位之后 / 传回之前执行。 |

第一个进去的人落在**锚点**上（被选中的那个落点会持久化）；之后的人按六边形散开，免得一队人叠在一起。

## 第 4 步 —— 谁能进、谁来认领、什么时候删

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `owned` | `false` | 为真时**第一个进入者成为主人**，实例从此保留地形、只卸载不删除；为假时最后一人离开就删掉整份实例与地形。 |
| `max_instances` | `1`（`1..256`） | 这份定义**所有实例合计**的上限（休眠的认领实例也算），满了报 `NO_FREE_INSTANCE`。 |
| `max_members` | 不限 | **每一份实例**能同时容纳多少人。 |
| `duration_ticks` | `0`（不过期） | 实例存活时长；到期把在线成员送出去并收尾。 |

认领式与一次性的区别值得写清楚：

- `owned: true`：主人离线、所有人都离开，世界也只是**休眠**——地形、方块、里面的建筑与库存都在，下次有人进来用同一个种子重新打开。它跨服务器重启保留，但重启后成员表会清空（`/mxt secret_realm list` 里那条 `loaded=false` 就是它）。
- `owned: false`：最后一人离开即**删除整份实例目录**（含该维度的灵气区域与阵法数据）。适合"打一趟就散"的试炼场。

时限只在主世界时钟上扫描（每 20 tick 一次），到期对所有在线成员执行离开——**不看 `exit_condition`**；离线成员直接从成员表剔除。认领实例到期只是暂停计时并卸载，下次有人进来重新开始算。

## 第 5 步 —— 往里面放结构（可选）

```json
"structures": [
  {
    "nbt": "example:trial_platform",
    "pos": [0, 64, 0],
    "rotation": "clockwise_90",
    "integrity": 1.0,
    "chance": 1.0,
    "relative_to_entry": false,
    "ignore_entities": false,
    "keep_liquids": true
  }
]
```

结构文件是原版结构：`data/<命名空间>/structure/<路径>.nbt`。`pos` 是结构原点；`rotation` / `mirror` 决定朝向；`integrity` 是完整度（`0..1`）；`chance` 每份实例掷一次；`relative_to_entry` 让坐标以落点为基准。**写了 `border` 时，绝对坐标的结构必须落在框内**（只检查 x/z），否则整份定义加载失败。

结构缺失不会在加载期报错，而是在**进入时**返回 `MISSING_STRUCTURE`——所以改完结构记得真的进去一次。

## 第 6 步 —— 秘境里的灵气、阵法与裂隙

- **灵气**：实例维度是运行时维度，没有自己的 `LevelStem` 条目，所以 `aura_zone.dimensions` 除了直接写实例维度 id，还可以写**定义 id** 或所用的 **stem id**，一次命中这份模板开出的所有实例。
- **群系绑定的灵气区域不会自动命中**：`mxt:void` 的群系是 `minecraft:the_void`，所以按 `#minecraft:is_overworld` 绑定的区域进不来。任何区域都没命中时落到空域——秘境默认是**没有灵气**的，想要灵气就得显式绑一份。
- **阵法与灵气库存**存在该维度自己的 `data/` 里，所以 `owned: false` 的实例被删时它们一起消失。
- **裂隙**（`mxt:rift`）可以指向秘境维度：目标维度**没加载**（休眠的认领实例、已删除的实例）时裂隙不传送——这是设计上的安全阀，不会为了传送去把世界打开。

## 在游戏里验证

```text
/mxt registries validate
/mxt secret_realm enter example:trial_realm
/mxt secret_realm list
/mxt secret_realm info example:secret_realm/trial_realm/0
/mxt secret_realm exit
/mxt secret_realm destroy example:secret_realm/trial_realm/0
```

1. 重新打开世界（注册表只在**世界加载时**读取，`/reload` 不会重读），`/mxt registries validate` 应无 Codec 错误。
2. `enter` 成功时提示"已进入秘境"，失败时是"无法进入秘境："后面跟着失败码。
3. `list` 每行包含维度键、序号、定义、成员数、上限、主人、是否备好、是否加载——`loaded=false` 就是休眠的认领实例。
4. 走一圈再 `exit`，然后用 `/mxt secret_realm info <维度>` 看它的状态；对 `owned: true` 的实例再进一次，应该回到同一份地形。
5. `destroy` 会**真的删掉地形**（认领过的也删），所以删定义之前先 `destroy`，否则实例记录读不出来、地形会被当作遗留数据清掉。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 进不去，报 `NO_FREE_INSTANCE` | `max_instances` 满了（含休眠的认领实例）；先 `destroy` 掉不用的，或把它调大。 |
| 进不去，报 `MISSING_STRUCTURE` | `structures[].nbt` 指向的结构文件不存在或路径不对。 |
| 进不去，报 `CONDITION_NOT_MET` | 选中的落点 `enter_condition` 不成立；写了 `enter_denied_message` 就会显示那句话。 |
| 进不去，报 `DISABLED` | 定义被 `#mxt:disabled` 停用，或者 id 根本不在注册表里。 |
| 进不去，报 `ALREADY_TRAVELLING` | 这个玩家已经处在一次进出流程里。 |
| 一进去就往下掉 | 用了 `mxt:void` 又没放结构：空列的地表高度就是世界底部。 |
| 地形没了 | 实例是 `owned: false`，最后一人离开即删除；要保留就写 `true`。 |
| 重启后认领的秘境 `loaded=false`，人也回不去了 | 这是休眠，不是丢失：下一个人进入会按同一个种子重新打开；重启后成员表会清空，被"遗留"的玩家会在登录时送回进入前的位置。 |
| 离线的人还占着名额 | 成员表是权威的，离线成员仍算在场（也让实例不进入休眠）。 |
| 改完定义进不去 / 世界加载不了 | 秘境定义是注册表条目，解码失败会**让世界加载不了**；读日志最后一条 Codec 错误。 |
| 结构没放出来 | `chance` 小于 1 时每份实例掷一次骰子；`integrity` 小于 1 会随机缺块。 |

## 接下来

- [secret_realm（秘境实例）](../datapack/json/secret_realm.md) —— 完整字段表与生成方式。
- [aura_zone（灵气区域）](../datapack/json/aura_zone.md) —— 把灵气绑到秘境维度上。
- [formation（阵法）](../datapack/json/formation.md) —— 在秘境里立一座阵法。
- [裂隙](../player-guide/rift.md) —— 用裂隙把秘境和主世界连起来。
