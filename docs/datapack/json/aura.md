---
title: aura（灵气）
description: 给一个数值挂上灵气身份与修炼行为：元素标记、境界链入口、恢复、换算与可用性门禁。
aside: false
---

# aura（灵气） {#aura}

[resource](./resource.md) 只按实体存一个数：它的边界和显示方式。`aura` 定义给**一个**数值挂上灵气身份与修炼行为——它属于哪个元素、从哪条境界链入门、怎么自然恢复、怎么和修为互相换算、什么时候能被主动消耗。两者是**一对一**关系：同一个数值最多有一条灵气定义，服务器构建缓存时发现重复会直接拒绝。

## 文件位置

灵气文件放在数据包的 `data/<namespace>/mxt/aura/`。

**用途**：单个数值的灵气定义：它是什么（元素标记、灵力射线量）、境界链入口、恢复、换算与可用性。

文件名对应它的 ID，与它描述的那个数值相互独立。例如 `data/example/mxt/aura/qi.json` 的 ID 是 `example:qi`，它指向 `resource` 注册表里的 `example:qi`。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | 文本组件 | `aura.mxt.<命名空间>.<路径>` | 显示名；省略时用左列的生成键，写了就用你给的文本。 |
| `description` | 文本组件 | `aura.mxt.<命名空间>.<路径>.description` | 定义描述；省略时用左列的生成键。目前只被存储与读取，还没有界面绘制它。 |
| `resource` | 数值 id | **必填** | 这条灵气描述的那个数值。 |
| `first_realm` | 境界 id | 无 | 该数值对应境界链的首个境界；只用来确定凡人首次突破的目标境界。省略则没有境界链，不能修炼。 |
| `start_exp` | `NumberProvider` | `0` | 凡人首次突破所需修为，同时是凡人阶段的修为上限；达到后不再增加，只能尝试突破。 |
| `start_cultivate_conditions` | `CultivateConditions` | 空对象 | 凡人开始修炼及首次突破前检查的条件，可用于冲突或身份限制。所有带 `first_realm` 的定义均满足后才能开始修炼。 |
| `cultivation_to_resource` | 对象 | `multiplier=1,max_per_tick=1` | 从修为计数抽取数值回复。 |
| `resource_to_cultivation` | 对象 | `multiplier=1,max_per_tick=1` | 仅修炼模式下把数值转回修为。 |
| `regen` | `NumberProvider` | `0` | 每 tick 的自然恢复值；未被修炼行为接管时生效，公式可读取该数值的境界变量。 |
| `aura_type` | 元素 id | 无 | 该数值的灵气标记。用于灵气类型判定（灵根、生物元素偏好、环境灵气渲染），并显示在数值名称旁（例如 `/mxt aura query`）。 |
| `burst_amount` | `NumberProvider` | `0` | 大于 `0` 时，该数值可由「发射灵力」快捷键消耗，并作为每发灵力射线的数值。每个数据包应只配置一个此值大于 `0` 的默认灵力资源。 |
| `use_condition` | `EntityCondition` | `mxt:always` | 控制实体是否能主动消耗该数值，并决定其资源条是否显示；不影响修炼、环境吸收、自然恢复或突破。 |
| `show_cultivation_info` | Boolean | `true` | 是否在角色信息面板显示该数值对应的境界和修为进度。 |

`aura_type` 还是灵力爆发的前提：没有这个标记的灵气不能被灵力爆发发射，发射的两条路都要求它存在。

数值本身的边界（`min` / `max` / `default_value`）、图标、射线颜色与资源条都在 [resource](./resource.md) 那一侧，这里不再写一遍。没有对应灵气定义的数值就是一个普通计数器：照样能被消耗、比较、写进公式，但**不能被存进物品**——存取接口交换的是灵气，普通计数器没有灵气身份。

`resource` 只收**单个数值 id**：不能写 `#标签`，也不能写数组，一条灵气只描述一个数值。

`CultivateConditions` 对象包含 `conditions`、可选 `triggers` 和可选 `action`。开始修炼和突破入口立即检查 `conditions`（全部满足）；达到突破阶段后，当前数值才会按 `triggers` 注册运行时订阅，匹配事件后再尝试突破。订阅不会直接序列化，存档加载或数据表加载后由修炼状态重建。

`cultivation_to_resource` 和 `resource_to_cultivation` 的两个字段如下：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `multiplier` | `NumberProvider` | `1` | 来源值转换为目标值的倍率。 |
| `max_per_tick` | `NumberProvider` | `1` | 每 tick 最多消耗的来源值；限制的是来源，不是目标。 |

## 示例

```json
// data/example/mxt/resource/qi.json
{
  "default_value": 0,
  "max": "100 + realm_rank * 20 + absorbed_aura * 0.1",
  "bars": [{"context": "mxt:self_hud", "anchor": "left", "order": 0, "renderer": {"type": "mxt:boss_bar", "bar_index": 1}}]
}
```

```json
// data/example/mxt/aura/qi.json
{
  "resource": "example:qi",
  "first_realm": "example:foundation",
  "start_exp": 100,
  "regen": 0.25,
  "aura_type": "example:common",
  "burst_amount": 10,
  "cultivation_to_resource": {"multiplier": 1, "max_per_tick": 2},
  "resource_to_cultivation": {"multiplier": 0.5, "max_per_tick": 1},
  "use_condition": {"type": "mxt:has_realm", "aura": "example:qi"},
  "show_cultivation_info": true
}
```

::: info 服务端结算

修炼吸收默认只回复当前境界对应的那个数值，只有处于修炼状态时才允许反向转换。`regen` 与 `resource.max` 都在服务端求值，客户端不参与结算。

:::

::: info 境界链

链属于这份灵气定义：每个 `realm_stage` 用 `aura` 指回这条定义，链入口由 `first_realm` 给出，所以读境界状态时不必再反查数值。`first_realm` 必须是该数值链上的阶段，服务器构建境界索引时会检查这一点。没有 `first_realm` 的灵气没有链，只剩 `regen` 的自然恢复。

:::

`aura` 是可以自带可选 `name` / `description` 的 23 张表之一，省略时用生成键；生成规则与语言文件的写法见[数据包开发总览](../overview.md)。
