---
title: weapon_binding（武器绑定）
aside: false
---

# weapon_binding（武器绑定） {#weapon_binding}

`weapon_binding` 给**已经注册的物品**一套武器属性与行为：`attributes` 是它贡献的原版属性修正，三个动作分别是右键、命中与持有 tick。它不创建物品，也不替换物品自身的数值。

## 文件位置

`weapon_binding` 是一张**数据包注册表**，一份文件就是一条定义：

```text
data/<namespace>/mxt/weapon_binding/<条目>.json
```

条目 id 是 `<namespace>:<路径>`——`data/example/mxt/weapon_binding/frost_blade.json` 就是 `example:frost_blade`。本体不为这张注册表提供条目；内容包写自己的命名空间，不要塞进 `mxt`。

顶层直接写下面字段表里的键。**没有 `values` 包一层**，一份文件只描述一条定义；要在别的包里盖过同一件物品，靠 `priority` 分先后，没有 `replace` 这类开关。文件级 `neoforge:conditions` 是生效的：条件不成立时这条定义根本不进注册表。

这张注册表和别的数据包注册表一样在**世界加载时**读取，`/reload` 不会重读。`/mxt registries list` 与 `/mxt registries validate` 都包含它；`/picker mxt:weapon_binding` 列出这些定义认领的物品。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | 物品条目 | **必填** | 这条定义认领哪些物品：单个物品 id、`#物品标签`，或它们的数组；数组里还可以是带 `type` 的匹配器条目，写法见 [`ItemMatcher`](../types/shared_data_types.md#itemmatcher)。 |
| `attributes` | `AttributeEntry[]` | `[]` | 这把武器贡献的原版属性修正；可选 `value` 会在每 tick 更新物品属性组件。**武器自己的攻击力与攻速也写在这里**（`minecraft:attack_damage` / `minecraft:attack_speed`，`operation` 用 `add_value`）。 |
| `use_action` | `EntityAction` | `mxt:no_op` | 右键使用行为。 |
| `attack_action` | `BiEntityAction` | `mxt:no_op` | 命中攻击行为。 |
| `tick_action` | `EntityAction` | `mxt:no_op` | 持有 tick 行为。 |
| `conditions` | `EntityCondition[]` | `[]` | 使用、攻击和属性应用前的条件；支持内联条件或带描述的条件对象。 |
| `element` | 元素 id 或 `#元素标签`，可写数组 | `[]` | 这把武器**是什么元素**：条目是一个元素、`#` 标签是一组元素。堆上的 `mxt:element` 组件与它取并集。 |
| `priority` | Int | `0` | 同一件物品被多条定义命中时的先后：数值大者先；**同分回落到注册表顺序**。 |

**武器自己的攻击力与攻速也写在 `attributes` 里**（`minecraft:attack_damage` / `minecraft:attack_speed`，`operation` 用 `add_value`）：它是**加法叠加**在物品自带的修正之上，**不会替换**物品自身的数值。想「这件武器的基础伤害就是 8」要改物品自己的 `minecraft:attribute_modifiers`（配方组件、`mxt:merge_components` 或 KJS），或者换一个本来就没有攻击修正的底材。每个条目写它属于哪个属性、用哪个原版修正、修正量多少；修正本身按原版属性修正的形状写。

`data/example/mxt/weapon_binding/frost_blade.json`：

```json
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

同一件物品被多条定义命中时，按每条定义自己的 `priority` **从高到低**选一条，字段默认 `0`；只有 `priority` 相同的两条才回落到注册表顺序。**这与 `items` 里写的是物品还是标签无关**：一条定义只要命中就按它自己声明的那个数参与排序，点名物品并不会让它更靠前。

**武器只有两个组件**：`mxt:quality`（单值，**整份品质对象**：组件写在那一堆上就以它为准，档位与这一档所属的链一起换）与 `mxt:element`（列表，与定义里写的取并集）。`attributes`、三个动作（`use_action` / `attack_action` / `tick_action`）与 `conditions` **都只在这张注册表里**：那一堆想改数值就写原版 `minecraft:attribute_modifiers`（KubeJS 或配方组件），或者用那件物品自己的 id 写一条定义。

**物品的元素**只有一条读取口径，按顺序问两件事：先看**声明**，堆上的 `mxt:element` 组件，加上 `weapon_binding`、[item_binding](./item_binding.md) 或 [artifact](./artifact.md) 里哪条定义认领了这堆物品、它写没写 `element`（三个注册表的结果取并集，每张各取 `priority` 最大的那条定义，标签会展开成元素集合）；一个都没声明时，才看**物品携带的灵气**：`mxt:spirit_storage` 里那唯一一种灵气，或（存量为空、或存了多种时）它的 `mxt:item_aura` 定义声明的灵气，取该灵气的 `aura_type`。条件 `mxt:item_element` 读的就是这条口径。
