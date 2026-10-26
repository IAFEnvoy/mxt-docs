---
title: rift（裂隙预设）
description: 裂隙的共享轮廓、外观和秘境门布局格式。
aside: false
---

# rift（裂隙预设） {#rift}

文件位置：`data/<namespace>/mxt/rift/<path>.json`

预设只提供形状和外观，供命令与秘境令牌引用。世界位置和目的地由创建入口决定。内置预设为 `mxt:default`、`mxt:rectangle`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `shape` | 对象 | 必填 | `vertices` 为局部 `[u, v]` 数组。 |
| `appearance` | 对象 | 默认外观 | 见下。 |

## 形状

`vertices` 按轮廓顺序闭合，末尾不要重复首点。3–128 点，局部两轴跨度各不超过 32 格，每个坐标绝对值不超过 1024。不能自交、重边、重复点、零长边或面积退化。同一直线上的中间点可以保留用于编辑，不能沿原边折返造成重叠。允许凹轮廓和反向绕序，不支持孔洞。服务端可收紧点数上限。

```json
{
  "shape": {"vertices": [[-1, 0], [1, 0], [1, 2.5], [-1, 2.5]]},
  "appearance": {"style": "portal", "color": -1, "edge_width": 0.06}
}
```

## 外观

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `style` | String | `rift` | `rift` 或 `portal`。 |
| `color` | Integer | `-1` | 主色，`-1` 按目的地身份取色。 |
| `edge_color` | Integer | `-1` | 边色，`-1` 从主色提亮。 |
| `speed` | Double `0..10` | `1` | 门面纹理速度。 |
| `edge_width` | Double `0..0.5` | `0.06` | 局部坐标中的边宽。 |
| `glow` | Double `0..1` | `0.2` | 门面内部沿边柔光强度。 |
| `particles` | Double `0..1` | `0.1` | 客户端边缘粒子密度，受每 tick 预算限制。 |
| `texture_scale` | Double `0.01..100` | `1` | 纹理缩放。 |
| `texture_rotation` | Double `-360..360` | `0` | 纹理旋转角度。 |
| `texture_u` | Double `-1024..1024` | `0` | 纹理水平偏移。 |
| `texture_v` | Double `-1024..1024` | `0` | 纹理垂直偏移。 |

门面始终不透明。柔光不是场景 Bloom，粒子不参与传送判断。关闭自定义着色器后使用纯色门面。

## 门模板与秘境布局

[secret_realm](./secret_realm.md) 的 `portals` 数组直接放门模板，不引用预设 id；编辑器可把已设计的门导出为此格式。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `key` | String `1..64` | 必填 | 同一布局内唯一。 |
| `placement` | 对象 | 必填 | `origin`、`normal`、`tangent` 三个三维向量。 |
| `relative_to_entry` | Boolean | `false` | origin 是否相对于实例入口。 |
| `shape` | 对象 | 必填 | 同预设。 |
| `destination` | 对象 | 必填 | 见下。 |
| `appearance` | 对象 | 默认外观 | 同预设。 |
| `duration_ticks` | Long 非负 | `0` | 门的寿命；`0` 永久。 |
| `enabled` | Boolean | `true` | 是否可通行。 |

`normal` 与 `tangent` 不能为零或平行；加载时正交归一化。局部世界坐标为 `origin + tangent*u + (normal × tangent)*v`。模板顶点必须位于维度高度与边界内。

目的地由 `type` 选择：

| type | 字段 | 规则 |
| --- | --- | --- |
| `position` | `pos` 必填；`dimension`、`yaw`、`pitch` 可选；`nearby` 默认 false | 省略 dimension 表示门所在的实例维度；pitch 在 -90..90；nearby 允许最多 4 格安全搜索。 |
| `secret_realm` | `realm` 必填 | 秘境定义 id；第一次成功进入后绑定实例。 |
| `return` | 无 | 使用实体进入秘境时的来源。 |

传送先寻找已有安全落点；没有时尝试在空白处铺一层泥土，普通玩家通常为 3×3，按实体尺寸扩大并留一格边。平台不覆盖已有方块，不清理液体或障碍，必须在世界边界内且不占用其他实体。生成时脚部高度向上取整，且至少高于世界最低高度一格；`nearby=false` 只尝试原位置及这项高度调整，`true` 可在各轴偏移 4 格内继续尝试。仍无法安全落地则拒绝传送。

```json
{
  "portals": [{
    "key": "exit",
    "placement": {"origin": [3, 0, 0], "normal": [0, 0, 1], "tangent": [1, 0, 0]},
    "relative_to_entry": true,
    "shape": {"vertices": [[-1, 0], [1, 0], [1, 2.5], [-1, 2.5]]},
    "destination": {"type": "return"},
    "duration_ticks": 0
  }]
}
```

布局最多 128 门，结构放置并确定入口后整体校验再发布。仅在实例第一次准备时安装；已准备实例里的门被删除或到期，不会因为重新打开实例而补回。
