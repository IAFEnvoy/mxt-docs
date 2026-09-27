---
title: 阵法功能模块类型
description: 阵法功能模块 mxt:formation_action_type 的全部内置模块、字段、默认值与判定规则。
---

# 阵法功能模块类型

## `formation_action_type`

[阵法](../../json/formation.md) 的 `actions` 数组存放这些功能模块。每一项在 `type` 里写一个模块 ID 来选中它，并且只带自己需要的字段——结构、半径、成本、生命周期钩子留在阵法顶层。数据包只能选用已有模块，不能新增；写了未知的 `type` 会让定义加载失败，不会退化成什么都不做。

同一个模块可以出现多次，列表不会合并：两段参数不同的攻击模块就是两段攻击。

```json
{
  "actions": [
    {"type": "mxt:protection", "delegate_to_claims": true},
    {"type": "mxt:range_display", "particle": {"type": "minecraft:end_rod"}, "shape": "ring"}
  ]
}
```

### `mxt:none`

空模块，什么都不做。它同时是这张分派表的默认项。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:none"}
```

### `mxt:attack`

攻击半径内的实体。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `damage` | `NumberProvider` | `0` | 每次施加的伤害 |
| `damage_type` | 伤害类型 id | 无 | 命中使用的伤害类型 |
| `attribute_to_owner` | Boolean | `true` | 是否把阵法主人记为攻击者 |
| `effects` | 数组 | `[]` | 每次命中施加的状态效果，每项写 `effect` / `duration_ticks` / `amplifier` |
| `target_condition` | `EntityCondition` | 恒真 | 对目标实体的额外筛选，在敌我判断之后求值 |

```json
{"type": "mxt:attack", "damage": 8, "damage_type": "minecraft:lightning_bolt"}
```

这个模块只说明「打什么」，不说明「打谁」：它打的是阵法覆盖到的每一个实体，要不要放过阵主与好友由阵法顶层的 `spare_friends` 决定。不写 `damage_type` 时走原版「阵主打了他」的语义。

每次伤害都过统一伤害管线：阵主（`attribute_to_owner` 为真时）作为攻击者参与元素克制，受击者按自己的元素适应减免。伤害求值为非有限或 ≤ 0 时这一下不打，但 `effects` 照常施加——默认的 `damage: 0` 就是一座只上状态、不造成伤害的阵法。

### `mxt:buff`

授予半径内实体技能、覆写这一带的灵气区域并提升灵气容量。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `abilities` | 技能 id 列表 | `[]` | 授予匹配实体的技能 |
| `target` | Enum | `all` | 模块作用于哪些实体：`all`、`allies` 或 `owner` |
| `aura_zone` | 灵气区域 id | 无 | 在这片阵地上覆盖环境灵气的区域 |
| `max_bonus` | 灵气 id 到 `NumberProvider` 的映射 | `{}` | 每种灵气的额外灵气容量 |

```json
{"type": "mxt:buff", "abilities": ["example:blessing"], "target": "allies"}
```

三档 `target` 是同一条规则的不同宽度：`all` 不筛；`allies` 要好友判定给出 `true`，认不出就不给；`owner` 只认阵法的归属名单。授予的技能在实体离开半径、阵法拆除或不再被选中时自动撤销。

`max_bonus` 只随着 `aura_zone` 的覆盖一起应用：没有 `aura_zone` 就没有地方加，该灵气区域不提供的灵气也加不上（不会凭空创造灵气）。多条加成落在同一种灵气上时取最高。

属性加成不在这里找字段：授予一条 `mxt:modifier` 技能，就等于授予它的属性修饰符。

### `mxt:protection`

拒绝半径内列出的各类干扰。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `block_break` | Boolean | `true` | 禁止破坏方块 |
| `block_place` | Boolean | `true` | 禁止放置方块 |
| `block_interact` | Boolean | `true` | 禁止与方块交互 |
| `explosions` | Boolean | `true` | 禁止爆炸 |
| `mob_griefing` | Boolean | `true` | 禁止生物破坏 |
| `entity_interact` | Boolean | `true` | 禁止与实体交互 |
| `attack_entity` | Boolean | `true` | 禁止攻击实体 |
| `item_use` | Boolean | `true` | 禁止使用物品 |
| `spare_friends` | Boolean | `true` | 豁免主人的友方 |
| `delegate_to_claims` | Boolean | `false` | 把保护交给领地模组 |

```json
{"type": "mxt:protection", "spare_friends": true}
```

九个开关全部默认 `true`：声明这个模块本身就是那句完整的话，只想放开某一项就显式写 `false`。

判定看动作的两端：行为者、或者被作用的方块 / 实体，任意一个落在半径内，这条开关就生效。`item_use` 没有作用对象，只看行为者自己；爆炸与生物破坏没有行为者，只看位置，所以阵主自己的爆炸也会被拦。

阵主（归属名单上任何一位）永远豁免。好友豁免要求 `spare_friends` 为真、并且服务端配置「阵法 → 敌我识别」打开；认不出敌友时照常保护。

`delegate_to_claims` 置真、且当前确实有生效的领地保护时，上面九个开关一个都不执行，真正拦人的是领地插件的规则；代价是这时只有被认领的地方受保护，阵法自己的 `radius` 不再参与判定。没有生效的领地保护时怎么办由服务端配置「兼容 → 委派需领地保护」决定。`attack_entity` 拦的是近战挥击，从阵内射出的箭命中时不算攻击者在攻击，不会被拦。

### `mxt:range_display`

用粒子绘制半径轮廓。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `particle` | 粒子选项 | **必填** | 沿轮廓绘制的粒子 |
| `interval_periods` | Integer `1..1200` | `1` | 两次重绘之间相隔的维护周期数 |
| `points` | Integer `1..512` | `32` | 轮廓上的点数 |
| `shape` | Enum | `ring` | 轮廓形状：`ring` 或 `sphere` |

```json
{"type": "mxt:range_display", "particle": {"type": "minecraft:end_rod"}, "shape": "ring"}
```

这个模块只作用于阵法自身，不碰任何实体，跑在阵法的 `tick_action` 之前。`interval_periods` 以维护周期为单位而不是 tick，因为分派本来就只落在周期边界上；`ring` 是阵心自身高度上的一个圆，`sphere` 把同样多的点铺在整个球面上。
