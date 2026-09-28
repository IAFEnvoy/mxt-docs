---
title: pill_binding（丹药绑定）
aside: false
---

# pill_binding（丹药绑定） {#pill_binding}

文件位置：`data/<namespace>/mxt/pill_binding/<path>.json`

**用途**：给一件已经注册的可食用物品加上丹药规则——吃完做什么、攒多少丹毒、什么时候算过量、能吃几次、两次之间等多久。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | 文本组件 | `pill_binding.mxt.<命名空间>.<路径>` | 显示名。省略时用左列的键。 |
| `description` | 文本组件 | 同上加 `.description` | 描述。 |
| `items` | `ItemMatcher` | `[]` | 匹配已有可食用物品，见[匹配器](../types/shared_data_types.md#itemmatcher)。可以省略；只靠组件 `binding` 点名时就留空。 |
| `priority` | Int | `0` | 多份同类定义匹配同一件物品时的先后：数值大者先；相同则按注册表顺序。**没有 `binding` 时才走到这里**。 |
| `max_uses` | Integer | 无 | 可选正整数。省略表示不限次数。按**这条定义本身**计次，换载体物品绕不过去。 |
| `cooldown` | `NumberProvider` | `0` | 冷却，单位 tick。常量必须有限且 ≥ `0`。用主世界 `gameTime`，离线也会到期。 |
| `on_consume` | `EntityAction` | `mxt:no_op` | 食用完成后行为。 |
| `toxicity_gain` | `NumberProvider` | `0` | 增加丹毒。 |
| `toxicity_threshold` | `NumberProvider` | `Double.MAX_VALUE` | 过量阈值。累计值达到它才触发，不默认禁止再吃。 |
| `on_overdose` | `EntityAction` | `mxt:no_op` | 达到或超过阈值时的行为。 |
| `toxicity_after_overdose` | `NumberProvider` | `0` | 过量后丹毒值。 |
| `conditions` | `EntityCondition[]` | `[]` | 食用前检查；支持内联条件或带描述的条件对象。 |

`data/example/mxt/pill_binding/qi_pill.json`：

```json
{
  "items": "example:qi_pill",
  "max_uses": 2,
  "cooldown": 20,
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

吃下这一叠时先过两道闸：`conditions` 全部成立，并且这一堆对应的定义没有超 `max_uses`、也不在 `cooldown` 里。任一条不成立就拒绝，物品、容器剩余物、药效和次数都不变；已经吃下去的一口，不会再被吃完后变化的饱食或生命条件否掉。

通过闸门后先跑 `on_consume`，再把 `toxicity_gain` 加进这个实体的丹毒并记下新值。`toxicity_threshold` 求值结果有限、且新值 `>=` 阈值时算过量：跑 `on_overdose`，然后把丹毒**设成** `toxicity_after_overdose`（不是清零），所以照旧接着吃会继续过量。阈值求值结果不是有限数时这一叠永远不会过量，往上叠多少都不触发。

`max_uses` 是这条定义自己的次数上限，按定义计、不按物品堆计：同一件载体分成几堆、换成别的物品，都绕不过去。次数与冷却记在与丹毒分开的账上，两者都保存、同步，并沿用死亡复制——死亡、换维度、重新登录都不清次数和丹毒，排毒也不清次数。

丹毒用实体条件 `mxt:pill_toxicity`（`comparison` 与 `compare_to`）和公式变量 `pill_toxicity` 读；从未服丹的实体读 `0`，也不会因此建附件。改丹毒用行为 `mxt:modify_pill_toxicity`：`mode` 为 `add` 或 `set`，默认 `add`，`amount` 必填；`set` 且常量小于 `0` 会加载失败，负的 `add` 用于排毒，结果不低于 `0`。服务端配置「炼丹 → 每秒丹毒自然消退」默认 `0`，表示不自然消退；设成正数后只对已有且非零的丹毒、每累计 `20` 个实体活跃 tick 减一次，离线不减，也不给没服过丹的实体建空附件。

**一堆丹药可以自己带 `mxt:pill` 对象。** 可选 `binding` 指向一条定义；`on_consume`、`toxicity_gain`、`toxicity_threshold`、`on_overdose`、`toxicity_after_overdose` 按**字段**覆盖——只写 `toxicity_threshold` 就是「只有这一堆过量得更晚」，其余字段照旧读定义。解析先看 `binding`：写了但定义不在注册表里就拒绝，不回退匹配；没写 `binding` 才按 `items` 的 `priority` 匹配，然后做字段覆盖。组件上没有 `max_uses`、`cooldown`、`conditions` 和 `priority`，所以覆盖不了次数上限、冷却与闸门，也改不了计次的身份。没有绑定、也没有 `items` 命中时，可以只写效果键，用默认值再盖上组件，但这种堆没有绑定身份，不记次数和冷却。绑定上的名字就是载体显示名；没有绑定时用物品自己的翻译。`mxt:quality` 组件照常有效，它换掉的不只是档位，还有这一档所属的那条链。

```mcfunction
give @s mxt:pill[mxt:pill={binding:"example:warming_pill"}]
```

本体物品 `mxt:pill` 只提供原版食用、名字和 Tooltip，药效仍只走一次。`conditions` 每项都可以写成 `{condition, description}`：带描述的条件会在 Tooltip 里用绿色 `✓` 或红色 `✗` 标出结果。

`items` 是共用匹配器：可以写物品 id、`#标签` 或混合数组，数组里每一项也可以是带 `type` 的匹配器条目（`mxt:item`、`mxt:tag`、`mxt:wildcard`、`mxt:regex`、`mxt:technique`、`mxt:spirit_storage` 与 `mxt:herb_tag`）。匹配器只引用已经注册的物品。多个定义同时匹配一件物品时，**每个注册表只取命中它的、`priority` 最大的那一条**（字段默认 `0`；`artifact`、`item`/`weapon`/`pill`/`tool`/`blueprint`/`technique` 六种 binding、`spirit_herb`、`item_aura`、`currency`，共十张表都接受它）；只有 `priority` 相同的两条定义才回落到注册表顺序，所以「谁赢」由数据包自己写死、与文件名无关（与 `aura_zone`、`element_reaction` 的 `priority` 同一个方向）。**这与匹配条目是哪一种无关**：一条定义只要命中就按它自己声明的那个数参与排序，点名物品并不会让它更靠前。详见 [`ItemMatcher`](../types/shared_data_types.md#itemmatcher)。
