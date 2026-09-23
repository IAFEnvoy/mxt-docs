---
title: spirit_crafting（灵气合成）
description: 灵气合成配方接受 mxt:spirit_shaped 与 mxt:spirit_shapeless 两种类型，它们除材料外还要消耗灵气，只在灵气工作台里跑。
aside: false
---

# spirit_crafting（灵气合成）

灵气工作台（方块 `mxt:spirit_crafting_table`）沿用原版工作台的布局，但只接受本模组注册的两种配方类型：`mxt:spirit_shaped` 与 `mxt:spirit_shapeless`。除常规材料之外，每个配方还声明一份灵气消耗。

## 文件位置

灵气合成配方就是普通的配方文件，因此放在数据包内的 `data/<namespace>/recipe/` 目录。

**用途**：灵气合成配方，只在灵气工作台里跑。

文件名对应它的 ID。例如 `data/example/recipe/spirit_iron_ingot.json` 的 ID 是 `example:spirit_iron_ingot`。

配方类型写在文件里：`"type": "mxt:spirit_shaped"` 或 `"type": "mxt:spirit_shapeless"`。

## 有序配方

有序配方有以下字段。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `pattern` | String[] | **必填** | 一到三行，每行一到三个字符。 |
| `key` | `Map<String, Ingredient>` | **必填** | 把 pattern 中用到的每个符号映射到它的材料。每个键都必须是单个非空格字符。 |
| `result` | `ItemStackTemplate` | **必填** | 产出的物品，按原版物品栈模板的形状书写。 |
| `aura` | 只含 `mxt:aura` 条目的 `List<Cost>` | **必填** | 一次合成的灵气消耗，从**灵气工作台自己的存量**支付、按整单位向上取整。只接受 `mxt:aura` 条目（写其它类型是加载错误）；旧的 `{"<灵气 id>": NumberProvider}` 映射写法仍可读（兼容），但一律写成数组。不能为空。写法见[共享数据类型 · `Cost`](../types/shared_data_types.md#cost)。 |

pattern 会在 3x3 网格的每一个可能偏移处进行匹配，pattern 未覆盖到的槽位必须为空。

## 无序配方

无序配方有以下字段。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `ingredients` | `Ingredient[]` | **必填** | 一到九个材料，任意顺序匹配。 |
| `result` | `ItemStackTemplate` | **必填** | 产出的物品，按原版物品栈模板的形状书写。 |
| `aura` | 只含 `mxt:aura` 条目的 `List<Cost>` | **必填** | 一次合成的灵气消耗，从**灵气工作台自己的存量**支付、按整单位向上取整。只接受 `mxt:aura` 条目（写其它类型是加载错误）；旧的 `{"<灵气 id>": NumberProvider}` 映射写法仍可读（兼容），但一律写成数组。不能为空。写法见[共享数据类型 · `Cost`](../types/shared_data_types.md#cost)。 |

材料必须与网格中非空的槽位完全对应，因此无序配方不允许在网格里留下无关物品。

## 行为

有序配方先于无序配方检查，因此只有在没有有序配方匹配时才会用到无序配方。

配方声明的灵气是一份只含 `mxt:aura` 条目的 `Cost` 数组，`amount` 以数值提供器给出；该值在配方匹配时求值，并向上取整。只要存在匹配的配方，合成台就接受该配方的灵气，并且只为该配方保存它，因此改动网格或改变匹配到的配方都会丢弃已保存的灵气。消耗在取出产物时由统一的消耗事务从**灵气工作台自己的存量**里扣除，输入物品仍留在网格中。

`aura` 的条目是 `mxt:aura` 身份，而不是存储的数值：被消耗的是一种灵气，由它的定义标识；每份定义通过自己的 `resource` 字段指出它按哪个数值计数。这里从工作台存量支付，所以扣的就是这门灵气本身，而不是它度量的那个数值。

## 示例

一个有序配方：

```json
{
  "type": "mxt:spirit_shaped",
  "pattern": [
    "FF",
    "FF"
  ],
  "key": {
    "F": "minecraft:fire_charge"
  },
  "result": {
    "id": "minecraft:magma_block"
  },
  "aura": [
    {"type": "mxt:aura", "aura": "mxt:common", "amount": 20}
  ]
}
```

一个无序配方，每个物品列一个材料：

```json
{
  "type": "mxt:spirit_shapeless",
  "ingredients": [
    "minecraft:blaze_powder",
    "minecraft:prismarine_shard"
  ],
  "result": {
    "id": "minecraft:sea_lantern"
  },
  "aura": [
    {"type": "mxt:aura", "aura": "mxt:common", "amount": 8}
  ]
}
```

配方消耗的灵气属于 [`mxt:aura` 注册表](./aura.md) 所定义的灵气，它的 `resource` 字段指出这门灵气按哪个数值计量。配方不是注册表，因此与那些数据表不同，它们确实会随 `/reload` 重新加载。
