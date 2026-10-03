---
title: pill_binding（丹药绑定）
aside: false
---

# pill_binding（丹药绑定） {#pill_binding}

文件位置：`data/<namespace>/mxt/pill_binding/<path>.json`

**用途**：把一族已经注册的物品认成同一份丹药，并给出这族物品自己的服用次数上限与冷却。**吃下去跑什么、加多少丹毒、越过阈值之后怎么办**不在这张表里，写在 [pill](./pill.md) 上。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | 文本组件 | `pill_binding.mxt.<命名空间>.<路径>` | 显示名。省略时用左列的键。 |
| `description` | 文本组件 | 同上加 `.description` | 描述。 |
| `items` | `ItemMatcher` | `[]` | 认领哪些已有物品，见[匹配器](../types/shared_data_types.md#itemmatcher)。绑定只有这一条入口，所以空表等于这条定义不起作用。 |
| `pill` | 一份 `pill` 定义的 id | **必填** | 这族物品是哪一份丹药，见 [pill](./pill.md)。 |
| `priority` | Int | `0` | 多份同类定义匹配同一件物品时的先后：数值大者先；相同则按注册表顺序。 |
| `max_uses` | Integer | 无 | 可选正整数。省略表示不限次数。按**这条定义本身**计次，换载体物品、把载体分成几堆都绕不过去。 |
| `cooldown` | `NumberProvider` | `0` | 冷却，单位 tick。常量必须有限且 ≥ `0`。用主世界 `gameTime`，离线也会到期。 |

`data/example/mxt/pill_binding/qi_pill.json`：

```json
{
  "items": "example:qi_pill",
  "pill": "example:warming_pill",
  "max_uses": 2,
  "cooldown": 20
}
```

吃下这一叠时先过两道闸：这条绑定指名的丹药自己的 `conditions` 全部成立，并且这条绑定没有超 `max_uses`、也不在 `cooldown` 里。任一条不成立就拒绝，物品、容器剩余物、药效和次数都不变；已经吃下去的一口，不会再被吃完后变化的饱食或生命条件否掉。

**次数与冷却记在这条定义的身份上**：`max_uses` 按定义计、不按物品堆计，同一件载体分成几堆、换成别的物品，都绕不过去。次数与冷却记在与丹毒分开的账上，两者都保存、同步，并沿用死亡复制——死亡、换维度、重新登录都不清次数和丹毒，排毒也不清次数。

丹毒用实体条件 `mxt:pill_toxicity`（`comparison` 与 `compare_to`）和公式变量 `pill_toxicity` 读；从未服丹的实体读 `0`，也不会因此建附件。改丹毒用行为 `mxt:modify_pill_toxicity`：`mode` 为 `add` 或 `set`，默认 `add`，`amount` 必填；`set` 且常量小于 `0` 会加载失败，负的 `add` 用于排毒，结果不低于 `0`。服务端配置「炼丹 → 每秒丹毒自然消退」默认 `0`，表示不自然消退；设成正数后只对已有且非零的丹毒、每累计 `20` 个实体活跃 tick 减一次，离线不减，也不给没服过丹的实体建空附件。

**一堆丹药可以自己带 `mxt:pill` 对象，但那只改作用。** 组件可选 `pill` 指名一份丹药定义（优先于这条绑定指名的），`on_consume`、`toxicity_gain`、`toxicity_threshold`、`on_overdose`、`toxicity_after_overdose` 按**字段**覆盖——只写 `toxicity_threshold` 就是「只有这一堆过量得更晚」，其余字段照旧读定义。组件上没有 `max_uses`、`cooldown`、`conditions` 和 `priority`，所以覆盖不了次数上限、冷却与闸门。**身份仍然只由 `items` 认领产生**：只写效果键、或组件指名了定义而这件物品没有被任何绑定认领时，这一口不计次数、也没有冷却。指名的那份**引用失效**（键还在、注册表里已经没有值）就拒绝，不回退匹配；"指名一份当前包里没有的 `pill`"写不出来——**定义**里指名它会让整个数据包加载失败。完整顺序见 [pill](./pill.md)。

```mcfunction
give @s mxt:pill[mxt:pill={pill:"example:warming_pill"}]
```

本体物品 `mxt:pill` 只提供原版食用、名字和 Tooltip，药效仍只走一次。**能不能吃由被绑的物品自己答**：原版开始一次食用只看栈上的 `minecraft:consumable`，所以被绑定物品**自带**它就按那个物品自己的时长与姿势吃（食物在饱食度满时原版照样吃不下，这时会给服丹者一句提示）；**没有**它就由框架在右键那一刻替这一叠补上、动作结束时收回，绑定之后就能吃，物品上也留不下任何东西。自带用途的物品不吃这条：可换装、盾牌与动能武器由原版自己的分支应答右键，那一路优先；同时被长按声明认领的物品按长按读，不按丹药吃。载体的标题取组件指名的那份丹药的 `name`；没有组件时（药效由绑定指名）标题仍是本体物品自己的键 `item.mxt.pill`，那份丹药的名字显示在 Tooltip 第一行。

`items` 是共用匹配器：可以写物品 id、`#标签` 或混合数组，数组里每一项也可以是带 `type` 的匹配器条目（`mxt:item`、`mxt:tag`、`mxt:wildcard`、`mxt:regex`、`mxt:technique`、`mxt:spirit_storage` 与 `mxt:herb_tag`）。匹配器只引用已经注册的物品。多个定义同时匹配一件物品时，**每个注册表只取命中它的、`priority` 最大的那一条**（字段默认 `0`；`artifact`、`item`/`weapon`/`pill`/`tool`/`blueprint`/`technique` 六种 binding、`spirit_herb`、`item_aura`、`currency`，共十张表都接受它）；只有 `priority` 相同的两条定义才回落到注册表顺序，所以「谁赢」由数据包自己写死、与文件名无关（与 `aura_zone`、`element_reaction` 的 `priority` 同一个方向）。**这与匹配条目是哪一种无关**：一条定义只要命中就按它自己声明的那个数参与排序，点名物品并不会让它更靠前。详见 [`ItemMatcher`](../types/shared_data_types.md#itemmatcher)。
