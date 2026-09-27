---
title: weapon_binding（武器绑定）
aside: false
---

# weapon_binding（武器绑定） {#weapon_binding}

文件位置：`data/<namespace>/mxt/weapon_binding/<path>.json`

武器绑定给**已经注册的物品**一套武器属性与行为：`attributes` 是它贡献的原版属性修正，三个动作分别是右键、命中与持有 tick。它不创建物品，也不替换物品自身的数值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | 物品 id、`#标签` 或混合数组 | **必填** | 这份定义认领哪些武器物品，见[匹配器](/datapack/types/shared_data_types#itemmatcher)。 |
| `priority` | Int | `0` | 多份同类定义匹配同一件物品时的先后：数值大者先（见 [匹配器](/datapack/types/shared_data_types#itemmatcher)）；相同则按注册表顺序。 |
| `attributes` | `AttributeEntry[]` | `[]` | 这把武器贡献的原版属性修正；可选 `value` 会在每 tick 更新物品属性组件。**武器自己的攻击力与攻速也写在这里**（`minecraft:attack_damage` / `minecraft:attack_speed`，`operation` 用 `add_value`）。 |
| `use_action` | `EntityAction` | `mxt:no_op` | 右键使用行为。 |
| `attack_action` | `BiEntityAction` | `mxt:no_op` | 命中攻击行为。 |
| `tick_action` | `EntityAction` | `mxt:no_op` | 持有 tick 行为。 |
| `conditions` | `EntityCondition[]` | `[]` | 使用、攻击和属性应用前的条件；支持内联条件或带描述的条件对象。 |
| `element` | 元素 id 或 `#元素标签`，可写数组 | `[]` | 这把武器**是什么元素**：条目是一个元素、`#` 标签是一组元素。堆上的 `mxt:element` 组件与它取并集。 |

**武器自己的攻击力与攻速也写在 `attributes` 里**（`minecraft:attack_damage` / `minecraft:attack_speed`，`operation` 用 `add_value`）：它是**加法叠加**在物品自带的修正之上，**不会替换**物品自身的数值。想「这件武器的基础伤害就是 8」要改物品自己的 `minecraft:attribute_modifiers`（配方组件、`mxt:merge_components` 或 KJS），或者换一个本来就没有攻击修正的底材。每个条目写它属于哪个属性、用哪个原版修正、修正量多少；修正本身按原版属性修正的形状写。

```json
// data/example/mxt/weapon_binding/frost_blade.json
{
  "items": "example:frost_blade",
  "attributes": [
    {
      "attribute": "minecraft:attack_damage",
      "id": "example:frost_blade/damage",
      "amount": 5,
      "operation": "add_value"
    },
    {
      "attribute": "minecraft:attack_speed",
      "id": "example:frost_blade/speed",
      "amount": -1.5,
      "operation": "add_value"
    }
  ],
  "attack_action": {"type": "mxt:no_op"},
  "element": ["mxt:water"]
}
```

**武器只有两个组件**：`mxt:quality`（单值，**整份品质对象**：组件写在那一堆上就以它为准，档位与这一档所属的链一起换）与 `mxt:element`（列表，与定义声明取并集）。`attributes`、三个动作（`use_action` / `attack_action` / `tick_action`）与 `conditions` **都只在定义里**：那一堆想改数值就写原版 `minecraft:attribute_modifiers`（KubeJS 或配方组件），或者为它写一条定义、用 `items` 点名。

**物品的元素**只有一条读取口径，按顺序问两件事：先看**声明**，堆上的 `mxt:element` 组件，加上 `weapon_binding`、[item_binding](./item_binding.md) 或 [artifact](./artifact.md) 里哪个认领了这堆物品、它写没写 `element`（三个注册表的结果取并集，每个注册表各取 `priority` 最大的那条匹配定义，标签会展开成元素集合）；一个都没声明时，才看**物品携带的灵气**：`mxt:spirit_storage` 里那唯一一种灵气，或（存量为空、或存了多种时）它的 `mxt:item_aura` 定义声明的灵气，取该灵气的 `aura_type`。条件 `mxt:item_element` 读的就是这条口径。

`items` 是共用匹配器：可以写物品 id、`#标签` 或混合数组，数组里每一项也可以是带 `type` 的匹配器条目（`mxt:item`、`mxt:tag`、`mxt:wildcard`、`mxt:regex`、`mxt:technique`、`mxt:spirit_storage` 与 `mxt:herb_tag`）。匹配器只引用已经注册的物品。多个定义同时匹配一件物品时，按各自声明的 `priority` **从高到低**选择（字段默认 `0`；`artifact`、`item`/`weapon`/`pill`/`tool`/`blueprint`/`technique` 六种 binding、`spirit_herb`、`item_aura`、`currency`，共十张表都接受它）；只有 `priority` 相同的两条定义才回落到注册表顺序，所以「谁赢」由数据包自己写死、与文件名无关（与 `aura_zone`、`element_reaction` 的 `priority` 同一个方向）。**这与匹配条目是哪一种无关**：一条定义只要命中就按它自己声明的那个数参与排序，点名物品并不会让它更靠前。详见 [`ItemMatcher`](/datapack/types/shared_data_types#itemmatcher)。
