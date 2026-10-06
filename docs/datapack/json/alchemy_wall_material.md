---
title: alchemy_wall_material（炉壁材料）
description: 炉壁材料的耐温定义：一块炉壁能承受多热，以及整座炉子为什么取最低值。
aside: false
---

# alchemy_wall_material（炉壁材料） {#alchemy_wall_material}

一份 `alchemy_wall_material` 只描述**一块炉壁**：一个名字、一段描述、一个有限的耐温上限，以及可选的档位。槽位、容量与回落速度属于[炉型规格](./alchemy_furnace.md)，不写在这里。

整炉耐温是 18 块炉壁里**最低**的那个 `max_temperature`。混用材料时薄弱处说了算，高耐温的炉壁不能把低耐温的拉平。它只是炉温上限的**三个来源之一**：另外两个是[炉型规格](./alchemy_furnace.md)自己可选的 `max_temperature` 与供热方块给出的最高温，上限取三者最低。

## 文件位置

炉壁材料文件放在数据包的 `data/<namespace>/mxt/alchemy_wall_material/`。

**用途**：一块炉壁的耐温上限与起始档位。

文件名对应它的 ID。例如 `data/example/mxt/alchemy_wall_material/bronze.json` 的 ID 是 `example:bronze`。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `alchemy_wall_material.mxt.<命名空间>.<路径>` | 材料显示名。 |
| `description` | Text Component | 同上加 `.description` | 材料描述。 |
| `quality` | 品质 id | 无 | 可选。由这种材料砌起来的炉壁方块起始的档位。 |
| `max_temperature` | Double | **必填** | 这一材料的耐温上限，有限且大于 `0`。 |

```json
{
  "name": "material.mxt.example.bronze",
  "max_temperature": 800
}
```

例子里给了自己的名字翻译键；省略 `name` 与 `description` 时用的仍是按条目 id 生成的那两个键。`max_temperature` 的数值由内容包自己定，本体不内置铜、铁或灵材的温度表。

`quality` 是可选的：炉壁方块是所有炉壁材料共用的一种方块，方块本身说不清是哪一档，只有堆上携带的这份材料报得出——由这种材料砌起来的炉壁方块起始就在这一档。堆上写了自己的 `mxt:quality` 组件时以组件为准；这份材料没写 `quality` 时这一层不作答，继续落到注册表 [default_quality](./default_quality.md)。

## 承载与成型

炉壁物品用组件 `mxt:alchemy_wall_material` 携带材料身份：放置、存档、同步、创造模式取样与正常拆回都保留它。定义不在注册表中时不能成型，本体不会拿一个硬编码数值兜底。

核心、三个仓与 18 块炉壁都就位时整座炉子才成型，实际可设的炉温上限是炉型规格的 `max_temperature`、整炉耐温与供热方块给出的最高温三者里最低的那个，见 [alchemy_furnace](./alchemy_furnace.md)。代表性材料只放在测试数据包里，生产内容由内容包提供。
