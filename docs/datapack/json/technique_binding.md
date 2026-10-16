---
title: technique_binding（功法绑定）
aside: false
---

# technique_binding（功法绑定） {#technique_binding}

文件位置：`data/<namespace>/mxt/technique_binding/<path>.json`

**用途**：一门功法的**手册是哪几件物品**、本体替它生成的载体用哪一件，以及学习前的条件。读多久、什么姿势、什么声音不在这里，写在[功法](./technique.md)自己身上。**这一叠是不是手册、教的是哪门功法，先看堆上的物品组件 `mxt:technique`；没有组件时，才看哪条声明的 `items` 认领了这一叠。**

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `technique` | `technique` id | **必填** | 这份声明描述哪一条功法。一条功法用一条即可。 |
| `items` | 物品 id、`#标签` 或混合数组 | `[]` | **可选**：这些物品不带任何组件也算这门功法的手册，见[匹配器](/datapack/types/shared_data_types#itemmatcher)。省略时这份声明只能按功法 id 被读到。 |
| `priority` | Int | `0` | 两条声明都认领同一件物品时数值大者先。 |
| `carrier_item` | 物品 id | `mxt:technique_book` | 本体替这门功法**生成**载体物品时使用哪个物品（`/picker mxt:technique` 用它）。单个物品 id，不支持物品标签、通配符或数组。**声明的 `items` 里点名了具体物品时，选择器直接给那件物品、不再生成载体。** |
| `conditions` | `EntityCondition[]` | `[]` | 学习前条件；支持内联条件或带描述的条件对象。 |

::: warning `items` 是「不带组件也算手册」的声明
声明的 `items` 让那一叠**不带组件**也算这门功法的手册，但**身份仍以堆上的 `mxt:technique` 组件为先**：同一件物品带着组件时，读的是组件写的那一门，不是这条声明里的 `technique`。
:::

## 一叠物品怎么才算手册 {#manual}

**哪一叠教哪门功法，堆上的组件优先。** 顺序是：**① 堆上的 `mxt:technique` 组件**（值是功法定义 id）——它是「这一叠教哪门功法」的身份；**② 没有组件时**，看哪条 `technique_binding` 的 `items` 认领了这一叠，它 `technique` 写的就是这一叠教的功法。两者都没有，这一叠就不是手册，右键什么也不会发生。

```mcfunction
give @s mxt:technique_book[mxt:technique="example:azure_breath"]
```

所以一件物品可以**不带任何组件**地当某门功法的手册——只要那条声明的 `items` 点名了它；带着组件的同一物品也照旧读组件说的那一门。反过来，既没有组件、也没有任何 `items` 认领的同一物品（例如创造模式物品栏里拿出来的 `mxt:technique_book`）**什么都不教、Tooltip 里也不显示功法**。

组件是**堆数据**，所以世界里自然生成的物品不会自动带上它。任何能写到堆上的途径都同样成立：

- 配方产物的 `components`；
- 战利品函数；
- `/give` 的物品组件语法（如上）。

## 本体替功法生成的载体 {#carrier}

本体按 `mxt:technique` 注册表**为每条功法生成一份载体**，生成用的物品就是这条功法声明里 `carrier_item` 指定的那个，**不写就是功法书** `mxt:technique_book`。物品选择器的 `/picker mxt:technique` 分类就是这个入口；**创造模式物品栏不生成载体**。`carrier_item` 只在声明没有认领任何物品时才是这套生成用的物品：声明的 `items` 里点名了具体物品时，选择器直接给那件物品、**不再生成，也不往它身上写组件**。

内容包想用自己的物品当手册，两条路都行：写 `carrier_item: "命名空间:物品"`，让选择器生成那一叠已经带好 `mxt:technique` 组件的载体；或者更直接，把物品写进声明的 `items`，那一叠**不带组件**就是手册。

读多久、什么姿势、什么声音由[功法定义](./technique.md)给；某几堆想读得不一样就写 `mxt:technique_reading` 组件（字段与功法上的同名、全部可选，按**字段**覆盖功法给的那一套）。这一族物品读哪条品质链不由这张表决定：链名写在 `quality` 条目自己身上，而且写在入口档上，运行时再沿 `next` 传给它上面的每一档。

**一条功法可以没有绑定。** 绑定按功法 id 匹配，一条都没有就没有额外的学习前条件、载体就是功法书。也就是说没有任何 `technique_binding` 文件的功法照样能通过堆上的组件学习，读法完全由它自己的定义（以及堆上那个组件）说了算。

## 示例

一门要让内容包自己的物品当载体的功法：

```json
// data/example/mxt/technique_binding/fire_manual.json
{
  "technique": "example:fire_manual",
  "carrier_item": "kubejs:fire_manual",
  "conditions": [{"type": "mxt:realm", "realm": "example:foundation"}]
}
```

让内容包自己的物品**不带组件**就当这门功法的手册：

```json
{
  "technique": "mxt_test:azure_water_manual",
  "items": "mxt_test:azure_water_manual",
  "conditions": [{"type": "mxt:always"}]
}
```

写完之后，手册有两个来源：声明的 `items` 点名的那件物品（不带组件也算），或者任何**带组件的堆**——用上面 `give` 那样的物品组件语法，或让配方产物带上 `{"mxt:technique": "mxt_test:azure_water_manual"}`。长按三秒、收纳袋姿势这类读法写在这门功法的定义里，见 [technique](./technique.md)。
