---
title: 激光粒子
description: 使用 mxt:laser 生成一根可调颜色、方向和流速的竖直发光粒子柱。
---

# 激光粒子

`mxt:laser` 是一根只沿世界 Y 轴延伸的发光粒子柱。它由粒子系统绘制，不是实体，因此可以直接用于 `/particle`、`ParticleEffect` 或其他会发送 `ParticleOptions` 的地方。

## 最简单的测试

下面的命令在当前位置生成一根默认淡黄色、向上流动的 8 格激光，持续 40 tick：

```mcfunction
/particle mxt:laser{y_max:8.0f} ~ ~ ~ 0 0 0 0 1 force
```

向下流动的蓝色激光：

```mcfunction
/particle mxt:laser{color:"#FF79BFFF",y_min:-2.0f,y_max:6.0f,width:0.24f,flow_direction:"down",flow_speed:1.8f,lifetime:200} ~ ~ ~ 0 0 0 0 1 force
```

## 参数

| 字段 | 默认值 | 含义 |
| --- | --- | --- |
| `color` | `#FFFFE8A8` | ARGB 颜色。最高字节是整体透明度。 |
| `x` / `z` | `0` / `0` | 相对粒子生成点的横向偏移。 |
| `y_min` / `y_max` | `0` / `8` | 相对粒子生成点的竖直范围；`y_max` 必须大于 `y_min`。 |
| `width` | `0.18` | 中心亮芯直径，外层光晕会按比例扩大。 |
| `flow_direction` | `"up"` | 表面流动方向，只能是 `"up"` 或 `"down"`。 |
| `flow_speed` | `1` | 表面流纹速度，不能为负数。 |
| `lifetime` | `40` | 粒子存在的 tick 数。 |

`color` 使用 ARGB 字符串，例如 `#CCFFF0A0` 表示约 80% 透明度。激光使用满亮光照，颜色和光晕在阴影里仍然可见。

