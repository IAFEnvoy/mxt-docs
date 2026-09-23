---
title: aura（灵气）
aside: false
---

# aura（灵气） {#aura}

文件位置：`data/<namespace>/mxt/aura/<path>.json`

**用途**：单个数值的灵气定义：它是什么（元素标记、灵力射线量）、境界链入口、恢复、换算与可用性。

一个 `aura` 定义描述**一个**数值的灵气身份与修炼行为，与 `resource` 是**一对一**关系：同一个数值最多有一个定义，服务器构建缓存时发现重复会直接拒绝。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `aura.mxt.<命名空间>.<路径>` | 可选显示名。省略时用左列的默认键。 |
| `description` | Text Component | `aura.mxt.<命名空间>.<路径>.description` | 可选描述。省略时用左列的默认键；目前只被存储与读取，还没有界面绘制它。 |
| `resource` | `Holder<resource>` | **必填** | 该档案描述的数值。 |
| `first_realm` | `Holder<realm_stage>` | 无 | 该数值对应境界链的首个境界；只用于确定凡人首次突破后的目标境界。省略则没有境界链，不能修炼。 |
| `start_exp` | `NumberProvider` | `0` | 凡人首次突破所需修为，同时是凡人阶段的修为上限；达到后不再增加，只能尝试突破。 |
| `start_cultivate_conditions` | `CultivateConditions` | 空对象 | 凡人开始修炼及首次突破前检查的条件，可用于冲突或身份限制。所有带 `first_realm` 的档案均满足后才能开始修炼。 |
| `cultivation_to_resource` | 对象 | `multiplier=1,max_per_tick=1` | 从修为计数抽取数值回复。 |
| `resource_to_cultivation` | 对象 | `multiplier=1,max_per_tick=1` | 仅修炼模式下把数值转回修为。 |
| `regen` | `NumberProvider` | `0` | 每 tick 的自然恢复值；未被修炼行为接管时生效，公式可读取该数值的境界变量。 |
| `aura_type` | `Holder<element>` | 无 | 该数值的灵气标记。用于灵气类型判定（灵根、生物元素偏好、环境灵气渲染），并显示在数值名称旁（例如 `/mxt aura query`）。元素被停用（`mxt:disabled`）时这个标记整个失效：不再参与匹配、不再着色、也不产生灵力爆发。 |
| `burst_amount` | `NumberProvider` | `0` | 大于 `0` 时，该数值可由“发射灵力”快捷键消耗并作为每发灵力射线的数值。每个数据包应只配置一个此值大于 `0` 的默认灵力资源。 |
| `use_condition` | `EntityCondition` | `mxt:always_true` | 控制实体是否能主动消耗该数值，并决定其资源条是否显示；不影响修炼、环境吸收、自然恢复或突破。 |
| `show_cultivation_info` | Boolean | `true` | 是否在角色信息面板显示该数值对应的境界和修为进度。 |

`CultivateConditions` 对象包含 `conditions`、可选 `triggers` 和可选 `action`。开始修炼和突破入口立即检查 `conditions`（全部满足）；达到突破阶段后，当前数值才会按 `triggers` 注册运行时订阅，匹配事件后再尝试突破。订阅不会直接序列化，存档加载或数据表加载后由修炼状态重建。

`cultivation_to_resource` 和 `resource_to_cultivation` 的两个字段如下：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `multiplier` | `NumberProvider` | `1` | 来源值转换为目标值的倍率。 |
| `max_per_tick` | `NumberProvider` | `1` | 每 tick 最多消耗的来源值；限制的是来源，不是目标。 |

示例：

```json
// data/example/mxt/aura/qi.json
{
  "resource": "example:qi",
  "regen": 0.25,
  "aura_type": "example:common",
  "burst_amount": 10,
  "cultivation_to_resource": {"multiplier": 1, "max_per_tick": 2},
  "resource_to_cultivation": {"multiplier": 0.5, "max_per_tick": 1},
  "first_realm": "example:foundation",
  "start_exp": 100,
  "use_condition": {
    "type": "mxt:has_realm",
    "aura": "example:qi"
  },
  "show_cultivation_info": true
}
```

`realm_stage` 的 `resource` 字段依然指向数值本身，链入口由档案的 `first_realm` 给出；档案的 `first_realm` 必须是该数值链上的阶段，服务器构建境界索引时会检查这一点。

修炼吸收默认只回复当前境界对应资源；只有处于修炼状态时才允许反向转换。`max` 和 `regen` 在服务端求值，客户端不参与结算。

`aura_zone` 提供世界环境灵气，按群系、维度、自定义区域和阵法覆写叠加。环境噪声支持 seed、柏林噪声和基础上限；自然环境通常保持在较低范围，方块和物品贡献独立计算。

`block_aura` 定义方块提供的灵气值；`item_aura` 定义物品携带的灵气种类（`type`）、容量、释放速度、耗尽行为和可选结果物品。方块释放的灵气不计入环境上限，多名玩家按区域分配策略共享。

```json
// data/example/mxt/block_aura/aura_source.json
{
  "blocks": ["#example:aura_source", "minecraft:amethyst_block"],
  "aura": {"mxt:common": {"amount": 12}}
}
```

```json
// data/example/mxt/item_aura/spirit_stone.json
{
  "items": ["mxt:spirit_stone"],
  "type": "mxt:common",
  "aura": 100,
  "consume_speed": 0.5,
  "release_speed": 1.0,
  "result_stack": {"id": "mxt:empty_spirit_stone", "count": 1}
}
```

