---
title: 定义一个阵法
description: 从结构、半径与费用写起，加一个增益模块和一条灵气域，再学会用阵盘激活、看维持费从哪来，以及结构被破坏时会发生什么。
---

# 定义一个阵法

阵法是"搭出来的东西"：玩家按你写的结构摆好方块，用阵盘一点，它就开始每 20 tick 收一次维持费、在半径内做事。**结构由方块定义，行为由模块定义，寿命由费用定义**——这三件事都在一个 JSON 里。

本篇给示例包加两座阵法：一座聚灵阵（给阵内的人加灵气域与增益），一座禁地阵（守御，把外人的破坏挡在半径之外）。

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `data/example/mxt/formation/spirit_gathering_array.json` | 聚灵阵：结构、半径、维持费、增益模块。 |
| `data/example/mxt/formation/ward_array.json` | 禁地阵：守御模块，按方块事件拦人。 |

## 第 1 步 —— 结构与半径

```json
// data/example/mxt/formation/spirit_gathering_array.json
{
  "structure": [
    {"offset": [0, 0, 0], "state": "minecraft:gold_block"},
    {"offset": [1, 0, 0], "state": "minecraft:iron_block"},
    {"offset": [-1, 0, 0], "state": "minecraft:iron_block"},
    {"offset": [0, 0, 1], "state": "minecraft:iron_block"},
    {"offset": [0, 0, -1], "state": "minecraft:iron_block"}
  ],
  "radius": 12
}
```

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `structure` | `List<RequiredBlock>` | `[]` | 内联结构：每项 `offset`（相对阵心的整数三元组）+ `state`。 |
| `structure_template` | `Identifier` | 无 | 用结构模板代替内联结构。**与 `structure` 二选一**：两个都给、或都不给，整份定义加载失败。 |
| `radius` | `NumberProvider` | **必填** | 阵法的作用半径，单位格。半径是**球**，不是方块。 |

结构就是**逐格全等**：`state` 可以直接写方块 id，需要方块状态时写原版那种 `{"Name": "…", "Properties": {…}}`。`offset [0,0,0]` 是阵心——**它不要求那里有方块**，所以留空也是一种写法（很多阵法就是"围着空气搭一圈"）。

阵心的容错是 3×3×3：用阵盘点歪一格不会失败，系统在点击位置周围找最近一个满足结构的阵心，点击位置本身有效时永远优先。

## 第 2 步 —— 加一个增益模块

```json
"actions": [
  {
    "type": "mxt:buff",
    "abilities": ["example:body_tempering"],
    "target": "allies",
    "aura_zone": "example:misty_valley",
    "max_bonus": {"example:qi": 40}
  },
  {
    "type": "mxt:range_display",
    "particle": {"type": "minecraft:end_rod"},
    "shape": "ring",
    "points": 32
  }
]
```

`mxt:buff` 是阵法最常用的模块：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `abilities` | `HolderOrTag<ability>[]` | `[]` | 授予阵内目标的技能，写法与别处一致。 |
| `target` | `all\|allies\|owner` | `all` | 谁受益。`allies` 会问敌我识别系统（见下）。 |
| `aura_zone` | `Holder<aura_zone>` | 无 | 把这座阵法当作一个灵气域：范围内的灵气改成这个域。 |
| `max_bonus` | `Map<Holder<aura>, NumberProvider>` | `{}` | 该域灵气**上限**的加成，只对域里已有的灵气生效。 |

`mxt:range_display` 只负责让人**看得见**这座阵法：`particle` 必填，`shape` 默认 `"ring"`，`points`（`1..512`）默认 `32`，`interval_periods`（`1..1200`）默认 `1`。

模块的可选类型一共五个：`mxt:none`（占位）、`mxt:attack`（攻击）、`mxt:buff`（增益）、`mxt:protection`（守御）、`mxt:range_display`（范围显示）。**没有单独的"灵气域模块"**——灵气域是 `mxt:buff` 的一个字段。

::: tip `target: allies` 与敌我识别

`allies` 走的是 `FriendService`：阵主认作自己人的实体才吃这份增益，**认不出的实体（`DEFAULT`）不给**——把陌生人也算成友军是这里要避免的失败。配置侧还有一层开关：`spare_friends` 与「阵法 → 敌我识别」。细节见[敌我识别系统](../technical/identification.md)。

:::

## 第 3 步 —— 攻击模块与守御模块

```json
// data/example/mxt/formation/ward_array.json
{
  "structure_template": "example:ward",
  "radius": 16,
  "spare_friends": true,
  "actions": [
    {
      "type": "mxt:protection",
      "block_break": true,
      "block_place": true,
      "explosions": true,
      "attack_entity": false,
      "spare_friends": true
    },
    {
      "type": "mxt:attack",
      "damage": 4,
      "damage_type": "minecraft:magic",
      "attribute_to_owner": true,
      "target_condition": {"type": "mxt:not", "condition": {"type": "mxt:formation_ally"}}
    }
  ]
}
```

**`mxt:attack`** 只说明"打多重"，不说明"打谁"——打谁由逐实体的条件决定：

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `damage` | `0` | 每次结算的伤害量。 |
| `damage_type` | 无 | 这一击的伤害类型；不写就退回原版的玩家/生物攻击来源。 |
| `attribute_to_owner` | `true` | 是否把阵主记为加害者（击杀与仇恨归他）。 |
| `target_condition` | 恒真 | 逐实体条件；**先过条件，再过伤害**。 |
| `effects` | `[]` | 顺带施加的效果；`damage` 为 0 时效果照样发。 |

**`mxt:protection`** 是按方块/实体事件拦人的守御模块：`block_break`、`block_place`、`block_interact`、`explosions`、`mob_griefing`、`entity_interact`、`attack_entity`、`item_use` 全部默认 `true`（想让它只管破坏就把其余的关掉），`delegate_to_claims` 默认 `false`（交给领地插件判）。

顶层还有一个 **`spare_friends`**（默认 `false`）：它为真时，运行时把阵主的好友与阵主本人一起放过。注意它和模块里同名的 `spare_friends` 是两个字段——顶层那个决定"整座阵法要不要跳过好友"，模块里那个决定"守御拦不拦好友"。而敌我识别本身还受服务端配置「阵法 → 敌我识别」控制：关掉它，顶层开关就失效（`DEFAULT` 仍然停火）。

## 第 4 步 —— 费用、存量与激活

```json
"activation_costs": [{"id": "example:qi", "amount": 200}],
"maintenance_costs": [{"id": "example:qi", "amount": 2}],
"storage": {"capacity": {"example:qi": 600}}
```

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `activation_costs` | `List<Cost>` | `[]` | 激活时一次性扣除，从**激活者**自己的账户扣；整份数组全有或全无，任何一项付不出就什么都不扣。写法见[共享数据类型 · `Cost`](../datapack/types/shared_data_types.md#cost)。 |
| `maintenance_costs` | `List<Cost>` | `[]` | 每个周期扣一次，决定阵法能撑多久；**阵法内方块供的灵气先抵扣**，缺口再由阵主支付。`mxt:item` 与 `mxt:js` 在这里永远付不出。 |
| `storage` | 对象 | 无（不启用） | 写了就必须有 `capacity`：`Map<aura, NumberProvider>`。 |

::: warning 费用条目写错会让定义加载失败

这两个列表的条目必须能解码：拼错字段名（`{"id": "example:qi", "amont": 200}`）不再是「打一条日志然后丢掉、阵法免费」，而是让整份定义**加载失败**。写错的消耗条目**不会**被静默丢弃。

`structure` 与 `actions` 同样是严格列表。**改完阵法先看日志**，别只看"能不能激活"。

:::

激活顺序是：占用检查 → 结构校验 → 领地检查 → 半径 → 事件 → 扣激活费 → 写索引 → 区块灵气标脏 → `activate_action`。之后每个周期（20 tick）按这个顺序找钱：**地脉吸收 → 存量 → 阵主**。所以一座阵法可以靠脚下的灵脉自己养活；不够时先吃存量，再向阵主收；全都拿不出来就发一个可取消的"维持失败"事件，没人拦着就拆除。

`storage` 是给"阵主不在也要运转"准备的：容量按灵气分别记，拆除时里面剩下的灵气**直接散逸**。

激活与拆除都不用命令：

1. 拿一块阵盘（`mxt:formation_plate`）。
2. `/mxt formation bind example:spirit_gathering_array` 把阵法写进主手那块阵盘（需要 gamemaster）。
3. 手持已绑定的阵盘右键阵心 → 激活。**没绑定的阵盘会自己认出脚下的阵法**（按白名单逐座比对结构，离点击位置最近的一座胜出；默认开启，可用服务端配置「阵法 → 阵盘自动识别」关掉）。
4. 对已激活的阵心再用一次阵盘 → 拆除。需要是阵主或管理员；服务端配置「阵法 → 队友可拆除」打开后，阵主的好友也可以。

## 第 5 步 —— 让阵主也吃自己的一套

想让阵法"自己人也打"，靠顶层 `entity_enter_action`、`entity_tick_action`、`entity_exit_action`（逐实体）与 `activate_action`、`tick_action`、`deactivate_action`（整座阵法）。它们都是普通的实体行为/方块行为，所以阵法的表现力等于行为类型的表现力。

一个实用的开局：进阵提示一声，出阵提示一声。

```json
"entity_enter_action": {
  "type": "mxt:play_sound",
  "sound": "minecraft:block.beacon.activate",
  "volume": 0.6,
  "pitch": 1.4
},
"entity_exit_action": {
  "type": "mxt:play_sound",
  "sound": "minecraft:block.beacon.deactivate",
  "volume": 0.4,
  "pitch": 0.8
}
```

逐实体行为只在实体**真的在半径内**时触发（球半径判定），而且只针对已加载的实体；区块卸载/重载会造成一次"离开再进入"，所以进入行为要写得**幂等**——重复播放一次提示音没关系，重复发奖励就不行。

## 在游戏里验证

```text
/mxt registries validate
/mxt formation bind example:spirit_gathering_array
/mxt formation list
/mxt formation info
```

1. 摆好结构，`/mxt formation bind …` 把阵法写进阵盘（提示"已将 %s 绑定到手持阵盘"）。
2. 右键阵心激活。`/mxt formation list` 会列出 ID、阵心坐标、半径、阵主与**已付费的维持次数**。
3. 站进半径里：`/mxt formation info` 报告覆盖你的阵法（重叠时全部列出）。
4. 观察灵气：如果 `aura_zone` 指向了某个域，站进阵内再查一次灵气，应该看到域切换带来的变化。
5. 挖掉结构里的一块方块：不会立刻有提示，但下一个周期校验失败后阵法**静默拆除**——`list` 里消失，`info` 也不再报告它。
6. 想手动收尾：对已激活的阵心再用一次阵盘。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 定义加载失败，报 `structure_template`/`structure` 相关错误 | 两个都写了或都没写；必须**恰好一个**。 |
| 右键阵心报"结构不符" | 方块逐格全等比较，差一个方块状态（楼梯朝向、活板门开关）都不算匹配。 |
| 激活报"半径无效" | `radius` 非有限或 ≤ 0。 |
| 费用看起来"从来没扣过" | 维持费只从地脉、存量与阵主账户出；写 `mxt:item` 或 `mxt:js` 的条目在这里永远付不出。字段名写错则直接**加载失败**，不再表现为静默免费。 |
| 激活后立刻消失 | 结构在激活后被破坏：每 20 tick 校验一次，失败即静默拆除。 |
| 守御不拦某一个外来实体 | 该实体被敌我识别判成 `TRUE`（好友）；顶层 `spare_friends` + 「阵法 → 敌我识别」一起决定这件事。 |
| 阵内所有人都不受增益 | `target` 写了 `allies`，但没人能被判定为友军（`DEFAULT` 一律不给）。 |
| 灵气域没生效 | `aura_zone` 写的是域 id，不是"灵气 id"；域不存在时该字段解析失败。 |
| `bind` 报"这块阵盘不能激活 %s" | 阵盘的允许列表里没有这座阵法（`empty_plate_allows_all` 为假时空白名单也不放行）。 |

## 接下来

- [formation（阵法）](../datapack/json/formation.md) —— 完整字段表、结构模板、灵气覆写与诊断。
- [敌我识别系统](../technical/identification.md) —— `spare_friends` 与 `target: allies` 背后的判断。
- [灵气计算](../technical/aura.md) —— 灵气域与阵法抽取环境灵气的实现。
- [命令](../player-guide/commands/formation.md) —— `/formation` 的全部子命令与阵盘行为。
