---
title: 光束粒子
description: 使用 mxt:light_beam 生成一根可调颜色、方向和流速的竖直发光粒子柱。
---

# 光束粒子

`mxt:light_beam` 是一根沿世界 Y 轴延伸、横截面为圆盘的发光气流柱。立体短线默认分布在整个圆盘内，`filled:false` 时只分布在柱体表面；默认每段是闭合、等半径的圆柱，`spread:true` 时才会变成中部宽、两端收尖的形状。绕行或沿轴观察时仍有体积。每段在生成时随机选择横向位置，在竖直段流动期间保持该位置，后续新段会换一个落点。有些线细而清晰，有些较粗、带柔和的淡光晕。短线之间留有间隙，沿指定方向流动。它由粒子系统绘制，因此可以直接用于 `/particle`、数据包粒子效果或其他粒子发射入口。

## 最简单的测试

下面的命令在当前位置生成一根默认淡黄色、向上流动的 8 格光束，持续 40 tick：

```mcfunction
/particle mxt:light_beam{y_max:8.0f} ~ ~ ~ 0 0 0 0 1 force
```

向下流动的蓝色光束：

```mcfunction
/particle mxt:light_beam{color:"#FF79BFFF",y_min:-2.0f,y_max:6.0f,width:0.24f,flow_direction:"down",flow_speed:1.8f,lifetime:200} ~ ~ ~ 0 0 0 0 1 force
```

## 彩色气流柱

每根光柱使用一个颜色。分别执行下面三条命令，可以在附近放置青色、金黄色与紫色气流柱，持续 60 秒：

```mcfunction
/particle mxt:light_beam{color:"#FF22FFFF",y_max:24.0f,width:0.5f,lifetime:1200} ~-3 ~ ~5 0 0 0 0 1 force
/particle mxt:light_beam{color:"#FFFFE91C",y_max:24.0f,width:0.5f,lifetime:1200} ~ ~ ~5 0 0 0 0 1 force
/particle mxt:light_beam{color:"#FF9A21FF",y_max:24.0f,width:0.5f,lifetime:1200} ~3 ~ ~5 0 0 0 0 1 force
```

命令中的 `count` 使用 `1`，三个散布值和速度均为 `0`。一份粒子就是一整根柱体；需要多根时在不同位置各发一份。

## 扩散半径与密度

`radius` 控制短线在水平圆盘内的分布半径，默认 `0.5` 格，可设为 `0.001` 至 `64`。`width` 控制单段短线的粗细和长度尺度。`density` 控制每平方格截面的流道数量，默认 `16`，范围为 `0.001` 至 `1024`。流道数量按 `ceil(π × radius² × density)` 计算；未触及数量上限时，半径翻倍会带来约四倍的流道，因此扩大圆盘仍能保持疏密程度：

```mcfunction
/particle mxt:light_beam{color:"#FF22FFFF",radius:1.5f,density:16.0f,width:0.18f,y_max:12.0f,spread:true,lifetime:1200} ~ ~ ~6 0 0 0 0 1 force
```

每根光柱最多使用 1024 条流道，绘制预算为 2048 份；每段短线占一份，开启 `glow` 时整根柔光也占一份。极大的半径、密度或高度触及上限时，实际分布会变稀。流道表示沿高度持续生成短线的数量基准，每段的横向位置各自随机，不会排成固定的长线轨迹。

客户端每帧总绘制预算为 8192 份，多根光柱的短线与整根柔光共享这个上限。预算不足时优先保留较近光柱的密度；同时出现超过 8192 根光柱时，更远的光柱可能不显示。远处会降低截面与转弯的细分，32 格和 96 格为两个距离分界，短线仍保留立体形状。

短线的光晕会略微伸出分布圆盘；客户端剔除范围包含这部分光晕。

## 表面分布与静止柔光

`filled` 默认为 `true`，短线填充分布在整个圆盘内。设为 `false` 时，短线中心只分布在整根光束的圆柱表面，内部留空；单段短线仍是立体形状。两种分布共用相同的 `density` 数量公式。

`glow` 默认为 `false`。开启后，柱体内部会出现一层同色、无流动动画的柔光，其范围跟随 `radius`、`y_min` 和 `y_max`，透明度跟随 `color` 及整根光柱的寿命渐隐。它不受 `flow_direction`、`flow_speed` 或 `spread` 影响，也不向终端水平面延伸。短线自身的局部光晕不受此开关影响。

下面生成一根仅表面有短线、内部带静止柔光的光束：

```mcfunction
/particle mxt:light_beam{filled:false,glow:true,radius:1.0f,y_max:8.0f,spread:true,lifetime:1200} ~ ~ ~6 0 0 0 0 1 force
```

## 展宽短线

`spread` 默认为 `false`，此时短线是闭合的等半径圆柱。设为 `true` 时，每段短线会同时展宽、拉长，较宽的短线也会更长；轮廓从中部平滑收向上下尖端，保留各自的明暗、透明度和柔光差异：

```mcfunction
/particle mxt:light_beam{color:"#FF22FFFF",y_max:24.0f,width:0.5f,spread:true,lifetime:1200} ~ ~ ~6 0 0 0 0 1 force
```

JSON 中将它写在粒子对象内。这个布尔参数控制短线形状；外层粒子效果的 `spread` 数组控制发射位置散布，两者可以同时使用：

```json
{
  "particle": {
    "type": "mxt:light_beam",
    "y_max": 24.0,
    "radius": 1.5,
    "density": 16.0,
    "width": 0.5,
    "spread": true,
    "filled": false,
    "glow": true,
    "lifetime": 1200
  },
  "count": 1,
  "speed": 0,
  "spread": [0, 0, 0]
}
```

## 终端平面流动

`bottom_effect` 与 `top_effect` 分别控制下端、上端效果，默认都为 `false`。开启后，短线会沿圆弧在竖直柱体与水平面之间转向，保持立体截面；`spread` 仍控制等半径或两端收尖的形状。两个水平面分别位于 `y_min` 与 `y_max`，不检测方块，也不随地形倾斜。

| `flow_direction` | 下端效果 | 上端效果 |
| --- | --- | --- |
| `"up"` | 沿平面向内收拢，再向上流动 | 转向平面并向外发散 |
| `"down"` | 转向平面并向外发散 | 沿平面向内收拢，再向下流动 |

下面两根光束分别向上、向下流动，均开启两个终端：

```mcfunction
/particle mxt:light_beam{color:"#FF22FFFF",y_max:8.0f,radius:0.8f,width:0.18f,spread:true,bottom_effect:true,top_effect:true,lifetime:1200} ~-3 ~ ~6 0 0 0 0 1 force
/particle mxt:light_beam{color:"#FFFF79BF",y_max:8.0f,radius:0.8f,width:0.18f,spread:true,flow_direction:"down",bottom_effect:true,top_effect:true,lifetime:1200} ~3 ~ ~6 0 0 0 0 1 force
```

只要下端发散时，使用向下流动并仅开启 `bottom_effect`：

```mcfunction
/particle mxt:light_beam{y_max:8.0f,flow_direction:"down",bottom_effect:true,lifetime:1200} ~ ~ ~6 0 0 0 0 1 force
```

水平外扩距离自动取 `max(0.75, radius × 1.5, width × 4)` 格，并在最外侧渐隐。流线中心落在终端平面上，截面与光晕会略微跨到平面的两侧；客户端剔除范围包含完整外扩与光晕。终端与柱体共用每根 2048 份的绘制预算，开启终端会增加网格开销。

## 参数

| 字段 | 默认值 | 含义 |
| --- | --- | --- |
| `color` | `#FFFFE8A8` | ARGB 颜色。最高字节是整体透明度。 |
| `x` / `z` | `0` / `0` | 相对粒子生成点的横向偏移。 |
| `y_min` / `y_max` | `0` / `8` | 相对粒子生成点的竖直范围；`y_max` 必须大于 `y_min`。 |
| `radius` | `0.5` | 水平圆盘的分布半径，范围为 `0.001` 至 `64` 格。 |
| `density` | `16` | 每平方格截面的流道数量，范围为 `0.001` 至 `1024`。 |
| `width` | `0.18` | 单段短线的尺寸；光晕总宽度不超过此值的 1.4 倍。 |
| `spread` | `false` | `false` 为闭合等半径圆柱；`true` 时短线展宽、拉长，中部宽、上下两端平滑收尖。 |
| `filled` | `true` | 短线填充分布在圆盘内；`false` 时仅分布在整根柱体表面。 |
| `glow` | `false` | 在柱体内部绘制同色、静止的柔光。 |
| `bottom_effect` | `false` | 在 `y_min` 开启下端平面收拢或发散。 |
| `top_effect` | `false` | 在 `y_max` 开启上端平面收拢或发散。 |
| `flow_direction` | `"up"` | 短线移动方向，只能是 `"up"` 或 `"down"`。 |
| `flow_speed` | `1` | 短线移动速度，不能为负数。 |
| `lifetime` | `40` | 粒子存在的 tick 数。 |

`color` 使用 ARGB 字符串，例如 `#CCFFF0A0` 表示约 80% 不透明度。光束使用满亮光照，颜色和光晕在阴影里仍然可见。

`flow_speed:0.0f` 可暂停短线移动。光柱会在生命周期开始和结束时渐隐；不同光柱的流纹起点会略有区别。

## 场景深度增强

客户端配置「世界特效 → 场景深度增强」默认关闭。开启后，短线接触不透明地形时会柔和淡出，柱内柔光也会按地形截短可见范围。它只读取不透明场景，不提供玻璃、水面或其他透明效果之间的精确遮挡，也不会产生屏幕泛光。

增强不可用时使用基础效果。使用光影包时请检查墙前、墙后、柱体内部和移动视角下的遮挡；若出现错位或透出，关闭此项。开启 `glow` 仍由粒子参数决定。

## 长光柱的可见范围

服务端使用原版粒子发送规则，以玩家所在方块的中心到粒子生成点的距离判断是否发送，普通模式为 32 格，`force` 为 512 格。`radius`、`x` / `z`、竖直范围和终端外扩不扩大这个发送范围。即使光柱的一段就在玩家旁边，生成点过远也收不到粒子。

收到粒子后，客户端按完整柱体判断是否进入视野。只看见中段或顶部时仍会绘制，不要求生成点出现在屏幕内。光柱保留地形遮挡和距离雾效，自发光外观不会照亮周围方块。

