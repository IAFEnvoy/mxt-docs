---
title: /lightning
---

# `/lightning`

| 命令 | 作用 |
| --- | --- |
| `/mxt lightning [pos] [color … \| palette …]`（= `/lightning`） | 直接打下一道雷，需要 gamemaster 权限。单色或渐变、亮度、粗细、伤害按固定顺序可选，见下。 |

## `/mxt lightning`

在指定位置打下一道雷，不写 `pos` 时落在命令执行者脚下。除了颜色，它就是原版闪电：伤害、引燃、避雷针充能、铜氧化、雷声、天空闪光，以及村民→女巫、猪→僵尸猪灵、苦力怕充能这些雷击转化全部照旧。

```
/mxt lightning
/mxt lightning ~ ~ ~
/mxt lightning ~ ~ ~ color 66CCFF
/mxt lightning ~ ~ ~ color 66CCFF alpha 0.5 thickness 2 damage 10 visual_only
/mxt lightning ~ ~ ~ palette 7A5CFF,66CCFF
/mxt lightning ~ ~ ~ palette 7A5CFF,66CCFF,FF4444 alpha 0.5 visual_only
```

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `pos` | 执行者位置 | 落点，支持 `~` 相对坐标。 |
| `color <六位十六进制>` | `737380`（原版那身冷白） | 不带 `#`，例如 `66CCFF`；Tab 补全会给几个常用色。 |
| `palette <颜色,颜色,…>` | 无 | **渐变**：逗号分隔的六位十六进制颜色，**第一项在顶端**（雷的起点）、最后一项在落地点，最多 16 项；Tab 补全给几个预设渐变。写出 `palette` 后 `color` 不参与着色。 |
| `alpha <0..1>` | `0.3` | 雷的**亮度**。原版闪电是加法混合，顶点色的 `RGB × alpha` 就是发光强度，所以它不是透明度。 |
| `thickness <0.1..4>` | `1` | 雷柱粗细倍率。 |
| `damage <≥0>` | `5` | 雷击伤害。 |
| `visual_only` | 关 | 只打雷，不结算伤害、不引燃，适合做纯装饰。 |

`color <色>` 与 `palette <渐变>` 是**二选一**的两支，各自后面接着同一条固定顺序的尾巴 `[alpha [thickness [damage [visual_only]]]]`：想写后面的就必须把前面的也写出来（Tab 补全会一路提示），例如要 `thickness` 就得先写颜色或渐变、再写 `alpha`。数据包侧的同一个行为 `mxt:spawn_lightning` 支持任意组合的字段（渐变写在 `palette`），见[数据包 JSON 格式](/datapack/json/index)。

命令中的注册表 ID 使用原版 `ResourceArgument`，解析、Tab 补全与"没有这个条目"的报错一起由它给出，补全来自服务端当前注册表；被停用的定义会出现在补全里，执行时才被拒绝。哪些参数不走这条路，见[命令总页](/player-guide/commands)的「补全」。
