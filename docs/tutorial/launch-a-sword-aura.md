---
title: 放出一道剑气
description: "用实体行为 mxt:spawn_sword_aura 做一条按键技能：发射位置与速度、两个 ARGB 颜色与五个尺寸字段加 scale、存活时间，以及撞到方块时执行什么。"
---

# 放出一道剑气

`mxt:spawn_sword_aura` 是一个实体行为：它在本**次行为的发动位置**生成一把会飞的剑气，剑尖沿行为实体的视线方向前进。它既是"一条投射物行为"，也是一个可以调外观的东西——剑身与火焰各有自己的颜色，剑的形状由五个尺寸字段与 `scale` 决定。

本篇只搭这一件事：一条按下去就放剑气的 `mxt:active` 技能，以及它在撞到方块时做什么。**火焰的观感设置与渲染细节不在本篇**：颜色字段只决定这把剑气自己长什么样，画成什么样由客户端那边管。

**前提：** [定义技能](./add-an-ability.md) 已完成。本篇复用那篇建立的 `mxt:active` 形状、示例包里已有的 `data/example/mxt/technique/azure_breath.json`，以及 `example:qi` 这个数值。

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `data/example/mxt/ability/sword_aura.json` | 一条 `mxt:active` 技能，`entity_action` 就是 `mxt:spawn_sword_aura`。 |
| `data/example/mxt/technique/azure_breath.json` | *（编辑）* 把这条技能加进 `granted_abilities`，学会功法即可按键放出。 |

## 第 1 步 —— 一条会放剑气的按键技能

```json
// data/example/mxt/ability/sword_aura.json
{
  "type": "mxt:active",
  "costs": [{"id": "example:qi", "amount": 8}],
  "cooldown": 30,
  "entity_action": {
    "type": "mxt:spawn_sword_aura",
    "speed": 1.5
  }
}
```

- `mxt:active` 读四个动作字段，**对施法者跑的是 `entity_action`**；剑气挂在施法者身上，所以写在这里。写在 `bi_entity_action` 上是另一回事——那是"对每个选中的目标跑一次"，不会凭空在前方生出一把剑。
- 出生点是**这次行为的发动位置**，方向取行为实体的**视线方向**。轮盘、命令与脚本发动没有独立地点，于是出生点就是施法者的眼睛高度；符箓与展示架发动有地点，剑气就从那里出去。
- `speed` 是沿视线方向的速度，默认 `1`，必须求值为**有限正数**；不是正数或算不出有限值时**什么都不生成**，也不报错。视线垂直向上或向下同样有速度，所以抬头放剑是允许的。
- 只有服务端生成剑气：客户端什么都不做，看到的实体是同步过来的。

沿用 [定义技能](./add-an-ability.md) 教过的形状：这条技能照样可以写 `icon`、`cast_time`、`condition`、`charges`。上面只写最小的几条。

## 第 2 步 —— 外观：颜色与五个尺寸

```json
// data/example/mxt/ability/sword_aura.json
{
  "type": "mxt:active",
  "costs": [{"id": "example:qi", "amount": 8}],
  "cooldown": 30,
  "entity_action": {
    "type": "mxt:spawn_sword_aura",
    "speed": 1.5,
    "blade_color": "#C778D9FF",
    "aura_color": "#CC78D9FF",
    "radial_flame": false,
    "length": 2.2,
    "blade_width": 0.3,
    "thickness": 0.08,
    "handle_length": 0.44,
    "guard_width": 0.52,
    "scale": 1.2
  }
}
```

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `blade_color` | `#C778D9FF` | **内部剑身**颜色。 |
| `aura_color` | `#CC78D9FF` | **外层剑气**颜色。 |
| `radial_flame` | `false` | `true` 时火焰从剑身向四周流动，否则向上流动。 |
| `length` | `1.65` | 剑刃长度。 |
| `blade_width` | `0.26` | 剑刃宽度。 |
| `thickness` | `0.08` | 剑身厚度。 |
| `handle_length` | `0.44` | 剑柄长度。 |
| `guard_width` | `0.52` | 护手宽度。 |
| `scale` | `1` | 整体缩放。 |

- **两个颜色是 ARGB**，最高字节是透明度，所以 8 位十六进制的写法是 `#AARRGGBB`：`#C778D9FF` 是"透明度 `C7`"加"剑身的 `78D9FF`"。这里**没有**单独的透明度字段，要半透明就把最高字节写小。
- 五个尺寸字段与 `scale` 的范围都是 `0.01`–`32`，**超出范围在加载期直接拒收**——不是夹住，而是这一条定义解不开。
- `scale` 缩放整把剑，五个尺寸字段缩放各自的部件，两者相乘。想让剑气看起来长一点，先动 `length`（只拉长剑刃）还是先动 `scale`（连剑柄、护手一起放大），由你要的效果决定。

## 第 3 步 —— 存活时间

```json
// data/example/mxt/ability/sword_aura.json
{
  "type": "mxt:active",
  "costs": [{"id": "example:qi", "amount": 8}],
  "cooldown": 30,
  "entity_action": {
    "type": "mxt:spawn_sword_aura",
    "speed": 1.5,
    "lifetime": 40
  }
}
```

- `lifetime` 单位是 tick，默认 `80`（4 秒），范围 `1`–`72000`。
- 到点那一刻剑气**直接消失**：不爆炸、不留痕、不执行任何行为。它只是没了。
- 剑气**不含重力**，被生成时的速度就是它这一路的全部速度：除非你在别处给它加速度，否则它沿直线一直飞。
- 没写 `collide_action` 时，`lifetime` 就是剑气唯一的终点——它会一路穿过方块，直到时间用完。

## 第 4 步 —— 撞到方块时做什么

```json
// data/example/mxt/ability/sword_aura.json
{
  "type": "mxt:active",
  "costs": [{"id": "example:qi", "amount": 8}],
  "cooldown": 30,
  "entity_action": {
    "type": "mxt:spawn_sword_aura",
    "speed": 1.5,
    "lifetime": 40,
    "collide_action": {
      "type": "mxt:explode",
      "power": 3.0,
      "create_fire": false
    }
  }
}
```

- **写了 `collide_action`，剑气撞到实心方块才会消失**；不写就直接穿过去。碰撞在每一步都查，命中的是剑气**即将进入**的实心方块。
- 行为在**撞击点执行**，执行时的行为实体是**发动剑气的那一方**——所以公式里的 `caster_*` 读的是他，`mxt:damage` 这类落在行为实体上的动作也作用在他身上；位置是撞击点，因此声音、粒子、爆炸与方块行为都发生在撞到的地方，而不是施法者脚下。
- **发动者已经不在**（掉线、所在区块未加载）时这条行为不执行，剑气仍然消失。
- 碰撞只看**实心方块**：它不探测实体，也不探测流体。所以剑气会**直接穿过生物**。要让它打到人，就得靠这条撞击行为自己覆盖一块范围——`mxt:explode` 的爆炸会把附近实体一起算进去。
- `mxt:explode` 自己的字段：`power` **必填**（不是有限数或者是负数时什么都不发生）、`interaction` 默认 `mob`（`none` 表示一次不动方块也不伤实体的纯观感爆炸）、`indestructible` 保护匹配上的方块、`create_fire` 默认 `false`。施法者被记为这场爆炸的起因。
- `collide_action` 是**单个**实体行为；要连做几件事，就在它外面套一个包装行为，或者写成行为数组。

## 第 5 步 —— 授予它，让它能按下去

定义一条技能本身不起作用：得有实体持有它。这一篇走功法那条路——把这条技能加进示例包已有的功法：

```json
// data/example/mxt/technique/azure_breath.json
{
  "granted_abilities": ["example:qi_bolt", "example:qi_recovery", "example:sword_aura"]
}
```

改这里而不是新开一条授予路径，是因为 `azure_breath` 在 [定义技能](./add-an-ability.md) 里已经是这套示例的"按键技能来源"，它的 `granted_abilities` 从那一篇起就是"学会就立刻生效"的清单。**注意它是常驻的**：学会这门功法的人会一直持有这条技能，不需要修炼到某一级；想让剑气只在某个等级之后出现，应该把它写进 `configuration` 里那一级的 `ability`，而不是这里。

`mxt:active` 是五个**按键型**之一，所以它**自动进轮盘池**，授予之后按住「轮盘选择」（默认 `R`）就能在池子里找到它；放进主盘哪一格由玩家自己摆的 12 格布局决定，技能定义里没有 `slot` 字段。

## 在游戏里验证

```text
（重新打开世界）
/mxt registries validate                    → 没有 Codec 错误
/mxt ability list                           → 本条技能已持有，来源是那门功法
/mxt ability cast example:sword_aura        → 强制放一次（需要 gamemaster）
```

1. 先学会功法：`/give @s kubejs:azure_manual[mxt:technique="example:azure_breath"]` 再右键它，然后 `/mxt ability list` 里应该能看到 `example:sword_aura`。
2. 把这条技能放进轮盘主盘的一格，按住 `R` 选中它、按 `V`（默认「轮盘使用」）施放：扣 `8` 点 `example:qi`，剑气沿你的视线飞出去。对着空地打，它应该在 40 tick 后自己消失，什么也不留下。
3. 对着墙打：剑气在撞上那一格就执行 `mxt:explode`，那里出现一次爆炸，剑气同时消失。加上 `"interaction": "none"` 再试一次，爆炸就只剩观感，不走方块也不伤实体。
4. 把 `collide_action` 整段删掉、重开世界再对着墙打：剑气直接穿过去，一路飞到 `lifetime` 用尽。这就是"没有 `collide_action` 就不碰撞"。
5. 把 `blade_color` 改成 `#40C778D9`、重开世界再看：剑身变得半透明。`blade_color` 与 `aura_color` 分别改内外两层，`radial_flame` 改成 `true` 时火焰改成向四周流动。
6. 把 `speed` 写成 `0`、重开世界：`speed` 不是有限正数，这一次施放什么都不生成（命令会照常报施放成功，别把它当成"剑气生成了"）。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 按下去什么都没有 | `speed` 不是有限正数；或者这条技能写在了一个不跑动作的类型上（`mxt:modifier` / `mxt:mount` / `mxt:storage` 这些类型不读 `entity_action`）。 |
| 剑气穿过了该撞上的方块 | 没写 `collide_action`。不写它就是一路穿过去，直到 `lifetime` 用完。 |
| 剑气从生物身上穿过去 | 碰撞只查实心方块，不查实体也不查流体。要打到人就让撞击行为自己覆盖一块范围。 |
| 剑气撞到石头就没了，什么都没发生 | 写了 `collide_action` 但那条行为什么都没做（例如 `mxt:no_op`），或者发动者已经不在（掉线、区块未加载）——后者行为不执行，剑气照旧消失。 |
| 爆炸伤到自己 | 撞击行为的执行者是发动剑气的人，位置是撞击点，所以贴脸打墙时他就在爆炸范围里。想避免就把撞击行为换成不会回头伤到施法者的做法。 |
| 尺寸字段改了没反应，或被世界拒绝加载 | 五个尺寸字段与 `scale` 的合法范围都是 `0.01`–`32`，超出范围在**加载期**就拒收整条定义，而不是夹到边界。 |
| 颜色不生效 | 两个颜色是 **ARGB**，写成 8 位十六进制；6 位不是这里接受的写法。 |
| 剑气还没飞到就消失了 | `lifetime` 太短（默认 `80` tick，也就是 4 秒）；把它调大，上限 `72000`。 |
| 学会功法后轮盘里找不到它 | 这条技能没被授予（`granted_abilities` 里没加），或者它不是按键型——轮盘池只收 `mxt:active` / `mxt:channelled` / `mxt:targeted` / `mxt:storage` / `mxt:flight_control` 五个类型。 |
| 改了 JSON 却没生效 | 技能是数据包注册表，世界加载时读一次，`/reload` 不重读。 |

## 接下来

- [行为类型](../datapack/types/action/entity_action_types.md) —— `mxt:spawn_sword_aura` 与 `mxt:explode` 的完整字段表，以及其它可以放进 `collide_action` 的行为。
- [定义技能](./add-an-ability.md) —— 技能类型、通用字段、消耗与授予路径的总入口。
- [内置物品与组件](../player-guide/items.md) —— 法器、载体与组件怎么给玩家一条能按的技能。
- [数值提供器](../datapack/types/number_provider_types.md) —— `speed` 这类字段除了写数字，还能写公式。
