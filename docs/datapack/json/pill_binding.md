---
title: pill_binding（丹药绑定）
aside: false
---

# pill_binding（丹药绑定） {#pill_binding}

文件位置：`data/<namespace>/mxt/pill_binding/<path>.json`

**用途**：给一件已经注册的可食用物品加上丹药规则——吃完做什么、攒多少丹毒、什么时候算过量。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | 物品 id、`#标签` 或混合数组 | **必填** | 匹配已有可食用物品，见[匹配器](/datapack/types/shared_data_types#itemmatcher)。 |
| `priority` | Int | `0` | 多份同类定义匹配同一件物品时的先后：数值大者先（见 [匹配器](/datapack/types/shared_data_types#itemmatcher)）；相同则按注册表顺序。 |
| `on_consume` | `EntityAction` | `mxt:no_op` | 食用完成后行为。 |
| `toxicity_gain` | `NumberProvider` | `0` | 增加丹毒。 |
| `toxicity_threshold` | `NumberProvider` | `Double.MAX_VALUE` | 过量阈值。 |
| `on_overdose` | `EntityAction` | `mxt:no_op` | 达到或超过阈值时的行为。 |
| `toxicity_after_overdose` | `NumberProvider` | `0` | 过量后丹毒值。 |
| `quality_chain` | `quality_chain` id | 无 | 这个物品所在的品质链条（见 [quality_chain](./quality_chain.md)）。链同时给出成员资格（解析出的档必须在链上，否则不能使用）、默认档（链的 `default`）与可升级的路径。 |
| `conditions` | `EntityCondition[]` | `[]` | 食用前检查；支持内联条件或带描述的条件对象。 |

```json
// data/example/mxt/pill_binding/qi_pill.json
{
  "items": "example:qi_pill",
  "on_consume": {"type": "mxt:no_op"},
  "toxicity_gain": 10,
  "toxicity_threshold": 100,
  "toxicity_after_overdose": 25,
  "on_overdose": {
    "type": "mxt:apply_effect",
    "effect": "minecraft:poison",
    "duration_ticks": 100
  },
  "conditions": [
    {
      "condition": {"type": "mxt:realm", "realm": "example:foundation"},
      "description": "condition.example.foundation_required"
    }
  ]
}
```

吃下这一叠时先跑 `on_consume`，再把 `toxicity_gain` 加进这个实体的丹毒并记下新值。`toxicity_threshold` 求值结果有限、且新值 `>=` 阈值时算过量：跑 `on_overdose`，然后把丹毒**设成** `toxicity_after_overdose`（不是清零），所以照旧接着吃会继续过量。阈值求值结果不是有限数时这一叠永远不会过量，往上叠多少都不触发。

`conditions` 每项都可以写成 `{condition, description}`：带描述的条件会在 Tooltip 里用绿色 `✓` 或红色 `✗` 标出结果，所有条件都满足这一叠才能吃。

**一堆丹药可以自己带两个组件。** `mxt:pill` 的键与上表同名、全部可选，按**字段**覆盖这份定义——只写 `toxicity_threshold` 就是"只有这一堆过量得更晚"，其余字段照旧读定义；堆上完全没有定义认领时也可以只写这个组件，其余字段取上表默认值。`mxt:quality_chain`（单值）优先于定义里写的那条链。`items`、`priority`、`conditions` 没有组件，只由定义给。

`items` 是共用匹配器：可以写物品 id、`#标签` 或混合数组，数组里每一项也可以是带 `type` 的匹配器条目（`mxt:item`、`mxt:tag`、`mxt:wildcard`、`mxt:regex`、`mxt:technique`、`mxt:spirit_storage` 与 `mxt:herb_tag`）。匹配器只引用已经注册的物品。多个定义同时匹配一件物品时，**每个注册表只取命中它的、`priority` 最大的那一条**（字段默认 `0`；`artifact`、`item`/`weapon`/`pill`/`tool`/`blueprint`/`technique` 六种 binding、`spirit_herb`、`item_aura`、`currency`，共十张表都接受它）；只有 `priority` 相同的两条定义才回落到注册表顺序，所以「谁赢」由数据包自己写死、与文件名无关（与 `aura_zone`、`element_reaction` 的 `priority` 同一个方向）。**这与匹配条目是哪一种无关**：一条定义只要命中就按它自己声明的那个数参与排序，点名物品并不会让它更靠前。详见 [`ItemMatcher`](/datapack/types/shared_data_types#itemmatcher)。
