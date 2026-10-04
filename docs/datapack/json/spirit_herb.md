---
title: spirit_herb（灵植）
description: 把已有物品声明成灵植：药性药力、寒热与药龄，以及可选的单格培育。
aside: false
---

# spirit_herb（灵植） {#spirit_herb}

`spirit_herb` 把一件**已有物品**标记成灵植，给它药性药力、寒热偏向，还可以给它一套培育方式。它不注册任何新物品：草本身由内容包或别的模组提供。**定义里没有 `quality` 字段**：灵植按**物品**认领（`items` 就是那套 `ItemMatcher`），堆上不装定义身份组件，没有可以问的对象，所以这株草的档写在数据表 [default_quality](./default_quality.md) 里，按物品 id 或 `#标签` 给。

## 文件位置

灵植文件放在数据包的 `data/<namespace>/mxt/spirit_herb/`。

文件名对应它的 ID。例如 `data/example/mxt/spirit_herb/fire_ginseng.json` 的 ID 是 `example:fire_ginseng`。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | 文本组件 | `spirit_herb.mxt.<命名空间>.<路径>` | 显示名。 |
| `description` | 文本组件 | 同上加 `.description` | 描述。 |
| `items` | `ItemMatcher` | **必填** | 绑定现有物品，不创建新的灵植物品。多条绑定时按 `priority` 取一条，不把药力相加。 |
| `priority` | Int | `0` | 多份灵草定义匹配同一件物品时的先后：数值大者先（见 [匹配器](../types/shared_data_types.md#itemmatcher)）；相同则按注册表顺序。 |
| `default_age` | Integer | `0` | 非负。堆上没有 `mxt:herb_age` 组件时用它。 |
| `element_tags` | 元素 id 或 `#标签` 的数组 | `[]` | 元素归属，**不是药性**。写的是元素注册表；可被 `mxt:herb_tag` 的 `element` 匹配。 |
| `material_tags` | Identifier[] | `[]` | 材料分类，由 `mxt:herb_tag` 的 `material` 匹配。 |
| `main_effects` | 药性 id 到 `NumberProvider` 的映射 | `{}` | 作为主药时每件提供的药力。 |
| `auxiliary_effects` | 同上 | `{}` | 作为辅药时每件提供的药力。 |
| `catalyst_power` | `NumberProvider` | `0` | 作为药引时每件的调和药力，非负。 |
| `thermal_bias` | Double | `0` | 有限数，取值 `[-1,1]`。负为寒、正为热，与火或水元素不是一回事。 |
| `growth` | 对象 | 无 | 省略则不可种植，但仍能入药。 |

`items` 用的是各定义共用的物品匹配器：单个物品 ID、单个 `#命名空间:标签`，或两者混写的数组；数组项也可以写成由固有注册表 `item_matcher_entry_type` 分派的带 `type` 对象，见[共享数据类型](../types/shared_data_types.md#itemmatcher)。`element_tags` 与 `material_tags` 是这株草自己的属性，不是物品的属性，所以内容包可以写「任意火属性灵草」，而不必知道之后有哪些物品被绑到那条草上。

## 药龄

药龄是这株草额外的元数据，存在物品组件 **`mxt:herb_age`** 里，是一个非负整数。读取顺序只有一条：堆上有组件就用组件的值，没有就用定义里的 `default_age`。

堆本身不会增龄：背包、容器和地上都不自己长岁数。不同药龄的堆按原版组件规则各自成堆，不合堆、不平均、不刷新。

药龄是**公式输入**，不是第二套倍率：`main_effects` / `auxiliary_effects` / `catalyst_power` 求值时，当前药龄可以从局部变量 `herb_age` 读到，想让百年老药更值钱就把增益写进表达式，例如 `"3 * (1 + herb_age / 100)"`。

## `growth`（培育）

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `seeds` | `ItemMatcher` | **必填**，非空 | 可作为种苗的已有物品。 |
| `mature_age` | Integer | **必填** | 正整数。达到后可以采收，也可以继续养。 |
| `max_age` | Integer | **必填** | 正整数，且 ≥ `mature_age`。达到后停止花费。 |
| `growth_rate` | `NumberProvider` | **必填** | 每 `20` 个该植物实际加载 tick 增加的药龄，非负。 |
| `condition` | `BlockCondition` | `mxt:always` | 光照、群系、邻接、`aura_range` 等。 |
| `costs` | [`Cost`](../types/shared_data_types.md#cost) 数组 | `[]` | 只收 `mxt:aura` 条目，从灵田所在地的场地灵气池付。 |
| `harvest` | `ItemStackTemplate` | **必填** | 采收产出的物品，必须能解析回这条灵植。数量和组件由数据提供。 |
| `texture` | Identifier | **必填** | 交叉草叶贴图。不为每种植物注册方块。 |

种苗与物品绑定是两份列表：`growth.seeds` 里的东西不必是这条灵植自己绑定或采收的物品。`harvest` 必须能解析回这条灵植，否则加载后报错。

## 灵田与生长

灵田是方块 `mxt:spirit_herb_plot`，一格一株，没有培育界面。

持可作为种苗的物品右键空灵田，检查位置与交互权限后消耗 `1` 件种苗。新种植从药龄 `0` 开始，不继承种苗上原有的药龄；同一格重复右键不能叠种。不能种植的材料或受保护的位置不消耗种苗。

每 `20` 个已加载 tick 结算一次：定义仍在注册表中、未到 `max_age`、`condition` 成立、增长量有效，然后整组支付 `costs`。付不出就暂停，不扣部分账单，也不死苗；区块卸载与停服不补算。

此次增长量是 **`growth_rate` 求值后再乘 `max(0, 1 + spirit_plant_bonus)`**，管线只乘这一次，公式里不要再乘它。药龄在 `max_age` 处封顶。

空手右键未成熟的灵田会显示药龄、成熟要求和暂停原因。成熟后空手右键采收：清空植株，给出 `harvest`（药龄组件为当前进度向下取整）和原种苗 `1` 件；背包装不下的剩余物只掉落一次。潜行空手拔除只返还原种苗。普通破坏时按同一套掉落：成熟给出收获物与原种苗，未成熟只返还种苗。定义解析不出时停止成长，仍可取回保存的种苗。

## 示例

```json
{
  "items": ["minecraft:red_mushroom", "#mxt_test:spirit_herbs"],
  "default_age": 100,
  "element_tags": ["example:fire"],
  "material_tags": ["example:herb"],
  "main_effects": { "example:nourish": "3 * (1 + herb_age / 100)" },
  "thermal_bias": 1,
  "growth": {
    "seeds": "minecraft:beetroot_seeds",
    "mature_age": 100,
    "max_age": 200,
    "growth_rate": 25,
    "costs": [{ "type": "mxt:aura", "aura": "example:spirit_power", "amount": 1 }],
    "harvest": { "id": "minecraft:red_mushroom", "count": 1 },
    "texture": "example:block/herb/fire_ginseng"
  }
}
```

## 与其他系统的关系

- 炼丹：灵植是[丹方](./alchemy_recipe.md)的材料，`main_effects` / `auxiliary_effects` / `catalyst_power` 就是主药、辅药与药引读到的药力；药性本身由[药性](./medicinal_property.md)定义。
- 匹配：`mxt:herb_tag` 是物品匹配器的一个条目类型，按 `element` 或 `material` 认出「这一株是不是那种草」，所以能写进任何接受 `ItemMatcher` 的地方。两个字段至少要写一个，写了的每个字段都必须在这株草上成立。
- 品质：灵植定义**不声明档位**——灵植按物品认领，堆上没有装定义身份的组件可问，所以这株草的档由 [default_quality](./default_quality.md) 按物品 id 或 `#标签` 给，见[品质是哪一档](./quality.md#resolution)。
