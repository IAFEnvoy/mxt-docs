---
title: 流星
description: "召唤 mxt:meteor，调整燃烧颜色、大小、尾焰与飞行速度。"
---

# 流星

`mxt:meteor` 显示一团连续燃烧的火焰，火核前进、尾焰沿运动反方向延伸。火焰随时间变化，相对风会影响尾焰长度和弯曲。实体无重力、沿当前速度直线飞行；默认不造成伤害，也不产生爆炸。

## 召唤

先在身旁生成一个静止流星，观察火焰：

```mcfunction
/summon mxt:meteor ~ ~2 ~3 {lifetime:1200}
```

静止时尾焰朝上。下面从高处生成一个沿世界 X 正方向飞行、同时下降的流星；`Motion` 的单位是格/tick：

```mcfunction
/summon mxt:meteor ~ ~12 ~ {Motion:[0.3d,-0.15d,0.0d],lifetime:200}
```

清除当前维度的所有流星：

```mcfunction
/kill @e[type=mxt:meteor]
```

## 外观与寿命

| NBT 字段 | 默认值 | 含义 |
| --- | --- | --- |
| `color` | `-419460558`（`#E6FF8A32`） | 整团火焰的 ARGB 颜色。 |
| `radius` | `0.55` | 火核半径，单位为格。 |
| `tail_length` | `3` | 尾焰基础长度，单位为格。 |
| `scale` | `1` | 火焰整体缩放。 |
| `lifetime` | `80` | 存活 tick 数。 |

`color` 使用有符号 32 位整数，最高字节决定透明度；火核会向白色过渡，尾部逐渐变暗。三个尺寸字段必须为有限正数，实际限制在 `0.01`–`32`。寿命必须为正整数，最高 `72000` tick。外观尺寸不改变 `0.2 × 0.2` 格的碰撞箱。

下面是一团较大的蓝色火焰，透明度为 `CC`（约 80%）：

```mcfunction
/summon mxt:meteor ~ ~2 ~4 {color:-864495105,radius:0.8f,tail_length:4.0f,scale:1.5f,lifetime:1200}
```

没有 `collide_action` 时，流星会穿过方块，直到寿命耗尽。`collide_action` 和 `caster` 的含义与[剑气撞击行为](/tutorial/launch-a-sword-aura)相同：有撞击行为才检查实心方块，撞击后消失；行为归属于 `caster`，无法解析发动者时只消失。它不检测实体碰撞或流体。
