---
title: item_binding（物品绑定）
aside: false
---

# item_binding（物品绑定） {#item_binding}

`item_binding` 把**已经注册的物品**认领成一组行为、一层使用门槛和一份元素声明。它不创建物品，也不改物品自身的数值。

## 文件位置

`item_binding` 是一张**数据包注册表**，一份文件就是一条定义：

```text
data/<namespace>/mxt/item_binding/<条目>.json
```

条目 id 是 `<namespace>:<路径>`——`data/example/mxt/item_binding/frost_blade.json` 就是 `example:frost_blade`。本体不为这张注册表提供条目；内容包写自己的命名空间，不要塞进 `mxt`。

顶层直接写下面字段表里的键。**没有 `values` 包一层**，一份文件只描述一条定义；要在别的包里盖过同一件物品，靠 `priority` 分先后，没有 `replace` 这类开关。文件级 `neoforge:conditions` 是生效的：条件不成立时这条定义根本不进注册表。

这张注册表和别的数据包注册表一样在**世界加载时**读取，`/reload` 不会重读。`/mxt registries list` 与 `/mxt registries validate` 都包含它；`/picker mxt:item_binding` 列出这些定义认领的物品。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | 物品条目 | **必填** | 这条定义认领哪些物品：单个物品 id、`#物品标签`，或它们的数组；数组里还可以是带 `type` 的匹配器条目，写法见 [`ItemMatcher`](../types/shared_data_types.md#itemmatcher)。 |
| `actions` | `EntityAction[]` | `[]` | 物品使用周期走完时按顺序执行的行为。 |
| `conditions` | `EntityCondition[]` | `[]` | 使用门槛；每一项都必须满足。 |
| `element` | 元素 id、`#标签` 或混合数组 | `[]` | 这件物品**是什么元素**，读取口径见下方。 |
| `priority` | Int | `0` | 同一件物品被多条定义命中时的先后：数值大者先；**同分回落到注册表顺序**。 |

## 用法

`items` 是唯一的认领入口，它只引用已经注册的物品。功法手册不由这张注册表承接：那一叠算不算手册看堆上的 `mxt:technique` 组件，或者看 [technique_binding](./technique_binding.md) 那条可选的 `items`。[weapon_binding](./weapon_binding.md) 与 [pill_binding](./pill_binding.md) 的字段和它互不混用：武器的属性、攻击 / 使用 / tick 行为写在 `weapon_binding` 里。

::: warning
`actions` **不绑右键**。它只在物品的**使用周期走完**那一拍执行，也就是吃完一份食物那种时刻。一件右键不会举起来使用的物品永远走不到这里，行为一个也不跑。
:::

同一件物品被多条定义命中时，按每条定义自己的 `priority` **从高到低**选一条，字段默认 `0`；只有 `priority` 相同的两条才回落到注册表顺序。**这与 `items` 里写的是物品还是标签无关**：一条定义只要命中就按它自己声明的那个数参与排序，点名物品并不会让它更靠前。

`data/example/mxt/item_binding/frost_blade.json`：

```json
{
  "items": ["example:frost_blade", "#example:swords"],
  "actions": [
    {"type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root"}
  ],
  "conditions": [
    {"condition": {"type": "mxt:always"}, "description": "condition.example.ready"}
  ]
}
```

`conditions` 里可以直接填写条件，也可以填写带翻译键 `description` 的 `{condition, description}` 对象。所有条件都必须满足；带描述的条件会在物品 Tooltip 中以绿色 `✓` 或红色 `✗` 标出结果，描述文字保持普通样式。这一层是**使用门槛**：不满足时这堆物品用不了（右键、右键方块、攻击与使用周期都会被拦下，动作栏给出原因）；`actions` 在真正执行前还会再问一次，所以中途变得不满足时行为不跑。

`actions` 里如果有 `mxt:grant_spirit_root`，这堆物品的 Tooltip 会多出一行，写明它授予哪条灵根；高级提示还会给出那条灵根的条目 id。

灵根和体质的持有判定与增删都是数据包原语：`mxt:has_spirit_root` / `mxt:has_physique` 用于条件，`mxt:grant_spirit_root` / `mxt:remove_spirit_root` / `mxt:grant_physique` / `mxt:remove_physique` 用于行为。下面这条定义只对已有火灵根的玩家生效，并把火灵根换成水灵根：

```json
{
  "items": "kubejs:root_switching_pill",
  "conditions": [
    {
      "condition": {"type": "mxt:has_spirit_root", "spirit_root": "mxt:fire_root"},
      "description": "condition.example.requires_fire_root"
    }
  ],
  "actions": [
    {"type": "mxt:remove_spirit_root", "spirit_root": "mxt:fire_root"},
    {"type": "mxt:grant_spirit_root", "spirit_root": "mxt:water_root"}
  ]
}
```

这族物品**读哪条链完全由它解析出的那一档决定**（链名写在 `quality` 自己身上，见 [quality](./quality.md)），认领表不声明链。想让某一堆换档又换链，就在那一堆上写 `mxt:quality="<品质 id>"`。

**物品的元素**只有一条读取口径，按顺序问两件事：

1. **声明**：堆上的 `mxt:element` 组件，加上 [weapon_binding](./weapon_binding.md)、这张注册表与 [artifact](./artifact.md) 里哪条定义认领了这堆物品、它写没写 `element`。每个注册表各取 `priority` 最大的那条定义，全部结果**取并集**；每条声明都经元素注册表展开，所以 `#标签` 代表标签下的每个元素。
2. **物品携带的灵气**：一个都没声明时才走这条——`mxt:spirit_storage` 里那**唯一**一种灵气，或者（存量为空、或存了多种时）它的 `mxt:item_aura` 定义声明的灵气，取该灵气的 `aura_type`。法器的 `spirit_capacity` **不算**：那说的是「能装什么」，不是「是什么」。

完整口径见 [weapon_binding](./weapon_binding.md)。物品条件 `mxt:item_element` 读的就是这条口径。
