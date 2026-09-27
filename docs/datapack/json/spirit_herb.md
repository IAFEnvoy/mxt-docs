---
title: spirit_herb（灵植）
description: 给已有物品挂上灵植身份：默认品阶与分类元数据，不注册新物品。
aside: false
---

# spirit_herb（灵植） {#spirit_herb}

`spirit_herb` 把一件**已有物品**标记成灵植，给它一个默认品阶和一组分类元数据。它不注册任何新物品：草本身由内容包或别的模组提供，这条定义只是让既有物品变成灵植。

## 文件位置

灵植文件放在数据包的 `data/<namespace>/mxt/spirit_herb/`。

**用途**：已有物品的灵植元数据。

文件名对应它的 ID。例如 `data/example/mxt/spirit_herb/fire_ginseng.json` 的 ID 是 `example:fire_ginseng`。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `ItemMatcher` | **必填** | 绑定现有物品，不创建新的灵植物品。 |
| `priority` | Int | `0` | 多份同类定义匹配同一件物品时的先后：数值大者先（见 [匹配器](/datapack/types/shared_data_types#itemmatcher)）；相同则按注册表顺序。 |
| `quality` | 品阶 id | **必填** | 该物品的品质，也是整套解析顺序的**最后一格**：覆盖组件 → 锻造结果 → 定义默认档（法器 / 功法）→ 所属链条的 `default` → 灵植这里（见 [quality_chain](./quality_chain.md#resolution)）。 |
| `age` | `NumberProvider` | `0` | 年龄元数据。 |
| `element_tags` | 元素 id 或 `#标签` 的数组 | `[]` | 这株草的元素归属，写的是**元素注册表**：条目是一个元素，`#` 标签是一组元素。可被 `mxt:herb_tag`（`element`）匹配，因此能写进任何接受 `ItemMatcher` 的地方（物品条件、绑定、`mxt:item_matcher`…）。 |
| `material_tags` | Identifier[] | `[]` | 材料分类标签，同上由 `mxt:herb_tag` 的 `material` 匹配。 |
| `growth_rate` | `NumberProvider` | `0` | 生长速率元数据。 |
| `drop_chance` | `NumberProvider` | `1` | 掉落概率元数据。 |

## 示例

```json
{
  "items": ["minecraft:red_mushroom", "#mxt_test:spirit_herbs"],
  "quality": "mxt_test:spirit_iron",
  "age": 100,
  "element_tags": ["mxt_test:fire"],
  "material_tags": ["mxt_test:herb"],
  "growth_rate": 0.05,
  "drop_chance": 1
}
```

`items` 用的是各定义共用的物品匹配器：单个物品 ID、单个 `#命名空间:标签`，或两者混写的数组；数组项也可以写成由固有注册表 `item_matcher_entry_type` 分派的带 `type` 对象，见[共享数据类型](../types/shared_data_types.md)。`element_tags` 与 `material_tags` 是这株草自己的属性，不是物品的属性，所以内容包可以写「任意火属性灵草」，而不必知道之后有哪些物品被绑到那条草上。

::: info 制作中

绑定、品质查询、Tooltip 与两个分类标签的匹配都已经接上（`mxt:herb_tag`）；`age`、`growth_rate` 与 `drop_chance` 目前只是给内容模组读取的元数据，背后没有生命周期——本模组不提供种植/生长系统，生长、采集与生成按设计留给内容模组。`mxt:aura_zone` 的 `spirit_plant_bonus` 与 `natural_spawn_herb` 也是因为同一件事而没有消费者。

:::

灵植是[炼丹配方](./alchemy_recipe.md)的材料，它的品阶由 [quality](./quality.md) 定义。
