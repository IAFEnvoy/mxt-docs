---
title: spirit_crafting（灵气合成）
description: 灵气合成配方接受 mxt:spirit_shaped 与 mxt:spirit_shapeless 两种类型，它们除材料外还要消耗灵气，只在灵气工作台里跑。
aside: false
---

# spirit_crafting（灵气合成）

灵气工作台（方块 `mxt:spirit_crafting_table`）沿用原版工作台的布局，但只做**灵气合成**这一件事：`mxt:spirit_shaped` 与 `mxt:spirit_shapeless` 两种配方类型。除常规材料之外，每个配方还声明一份灵气消耗，从工作台自己的存量里扣。

这是本模组注册的**原版配方类型**，不是数据包注册表。

## 文件位置

配方就是普通的配方文件，放在数据包内的 `data/<namespace>/recipe/` 目录。文件名对应它的 ID：`data/example/recipe/spirit_iron_ingot.json` 的 ID 是 `example:spirit_iron_ingot`。

类型写在文件里：`"type": "mxt:spirit_shaped"` 或 `"type": "mxt:spirit_shapeless"`。

::: warning 灵气合成与炼丹是两条线
工作台只认上面两个类型。`mxt:alchemy` 的配方不会在这里跑，工作台里的东西也不会进炼丹流程——两者之间没有任何转换。
:::

## 配方类型

`type` 取下面两种之一。

### `mxt:spirit_shaped`（有序配方）

按 `pattern` 的形状匹配。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `type` | String | **必填** | 必须是 `mxt:spirit_shaped`。 |
| `pattern` | String[] | **必填** | 一到三行，每行一到三个字符。 |
| `key` | 字符到材料的映射 | **必填** | 把 `pattern` 里的每个符号映射到它的材料。每个键都必须是单个非空格字符。 |
| `result` | `ItemStackTemplate` | **必填** | 产出的物品，按原版物品栈模板的形状书写。 |
| `aura` | 只含 `mxt:aura` 条目的 `Cost` 数组 | **必填** | 一次合成的灵气消耗，从工作台自己的存量支付，按整单位向上取整。写法见[共享数据类型 · `Cost`](../types/shared_data_types.md#cost)。 |

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

`pattern` 会在 3×3 网格的每一个可能偏移处试一遍，pattern 没覆盖到的槽位必须是空的。

### `mxt:spirit_shapeless`（无序配方）

材料与网格里非空的槽位必须完全对应，顺序随意，所以网格里不允许留下无关物品。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `type` | String | **必填** | 必须是 `mxt:spirit_shapeless`。 |
| `ingredients` | 材料数组 | **必填** | 一到九个材料，任意顺序匹配。 |
| `result` | `ItemStackTemplate` | **必填** | 产出的物品，按原版物品栈模板的形状书写。 |
| `aura` | 只含 `mxt:aura` 条目的 `Cost` 数组 | **必填** | 一次合成的灵气消耗，从工作台自己的存量支付，按整单位向上取整。写法见[共享数据类型 · `Cost`](../types/shared_data_types.md#cost)。 |

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

## 按组件筛材料

`key` 与 `ingredients` 收的是原版材料（`Ingredient`）：直接写物品 id 或 `#物品标签` 时只比物品本身，**不看堆上的任何数据**。要按组件筛，用 NeoForge 在材料上加的那一层自定义材料——`neoforge:ingredient_type` 选类型，`neoforge:components` 按「物品 + 组件」匹配：

```json
{
  "type": "mxt:spirit_shaped",
  "pattern": ["PP"],
  "key": {
    "P": {
      "neoforge:ingredient_type": "neoforge:components",
      "items": "mxt:blank_talisman",
      "components": { "mxt:quality": "example:paper_tier_3" }
    }
  },
  "result": { "id": "example:refined_talisman" },
  "aura": [{ "type": "mxt:aura", "aura": "mxt:common", "amount": 20 }]
}
```

`items` 收物品 id、`#物品标签` 或它们的数组（必填）；`components` 是一份原版组件补丁，**每一条都必须与堆上那一份完全相等**才算匹配；`strict` 可选（默认 `false`），为真时堆上不许再有 `components` 没列出的组件。判据是**相等**而不是「大于等于」，所以「三档及以上」要把 3/4/5 三档各写一条，再用 `neoforge:compound` 做或：

```json
{
  "neoforge:ingredient_type": "neoforge:compound",
  "children": [
    { "neoforge:ingredient_type": "neoforge:components", "items": "mxt:blank_talisman", "components": { "mxt:quality": "example:paper_tier_3" } },
    { "neoforge:ingredient_type": "neoforge:components", "items": "mxt:blank_talisman", "components": { "mxt:quality": "example:paper_tier_4" } }
  ]
}
```

**要「及以上」不必再枚举档位**：本体注册了一种自定义材料 `mxt:quality`（`items` 必填，加上 `quality` 成员列表或 `min_quality` 最少到哪一档）：

```json
{
  "neoforge:ingredient_type": "mxt:quality",
  "items": "mxt:blank_talisman",
  "min_quality": "example:tier_3"
}
```

它判的是这一堆[解析出来的档](./quality.md#resolution)（组件 → 携带的定义 → `default_quality` 注册表），不是组件精确相等；`min_quality` 跨链答否、只写它时没有档的物品答否。`neoforge:compound` 的字段是 `children`（别名 `ingredients` 也认），另有 `neoforge:difference`（`base` / `subtracted`）与 `neoforge:intersection`（`children`）。按档位筛物品的各个口子见[品质 · 按档位筛物品](./quality.md#gating)。

## `aura` 字段

`aura` 是一份 `Cost` 数组，**只收 `mxt:aura` 条目**，写其它类型是加载错误，空数组也是。条目里的 `aura` 是一门**灵气身份**，不是某个数值：扣的是这门灵气本身，由它的定义标识；定义自己的 `resource` 字段指出它按哪个数值计数，见 [`mxt:aura`](./aura.md)。这里从工作台存量支付，所以扣的就是这门灵气，而不是它度量的那个数值。

整份数组必须一次付清：缺一门灵气就一次都不合成，部分扣除不存在。付不付得起只看工作台自己的存量，与别人身上有多少无关。

`amount` 是数值提供器，匹配到配方时求值、向上取整。求值结果不是有限数、为负或超出整数范围时这次合成不成立，存量不会被扣坏。同一门灵气也可以写成"灵气 id 到数值"的映射，那种写法的每一项按 `mxt:aura` 条目读入。

工作台接收的灵气只为当前匹配到的配方保存，**改动网格、或者网格匹配到了另一个配方，已经存进去的灵气就被丢掉**；网格没有任何配方匹配时同样清空。工作台能接收的上限是每种灵气 `99 ×` 一次合成所需的量，多送的部分原样退回。这份存量**不落盘**，工作台重新加载时只恢复网格与产物槽。

## 检查顺序

有序配方先于无序配方检查，只有在没有有序配方匹配时才会用到无序配方。

匹配到的配方每 tick 都会被检查一次合成条件：灵气够、产物槽空着或装着同样的产物并且还装得下，这个 tick 就合成一次。不满足时什么都不发生（输入与已存的灵气都留在原地），继续等下一个 tick。合成成功时每个非空输入槽各消耗 `1` 个物品，灵气从工作台自己的存量里扣，产物落在产物槽里；**输入物品不会被一次清空**。

配方是原版配方文件，不是注册表条目，所以它们会随 `/reload` 重新加载。
