---
title: 注册表与 Codec
---

# 注册表与 Codec

MiXianTu 有两类注册表。**固有注册表**装的是数据包用 `type` 选中的 `MapCodec` 实现，由 Java 代码填充；**数据包注册表**的条目写在 JSON 文件里，由 Minecraft 在世界加载时读取、由注册表系统同步给客户端。因为它们在世界加载时读，`/reload` 不会重读——见[加载、同步与调试](/datapack/overview#加载、同步与调试)。

## 固有类型注册表

固有注册表用 NeoForge 的 `DeferredRegister<MapCodec<?>>`，数据包通过 `type` 分派到对应实现：

```java
public static final DeferredRegister<MapCodec<? extends Cost>> REGISTRY =
        DeferredRegister.create(MxtRegistries.COST_TYPE, MiXianTu.MOD_ID);
```

注册表实例声明在 `MxtRegistries`，它们的 key 只在 `MxtResourceKeys` 声明一次：

| 注册表 | Key | 内容 |
| --- | --- | --- |
| `MxtRegistries.ABILITY_TYPE` | `mxt:ability_type` | 技能类型 codec。 |
| `MxtRegistries.ABILITY_TARGET_SELECTOR_TYPE` | `mxt:ability_target_selector_type` | 技能目标选择器 codec。 |
| `MxtRegistries.COST_TYPE` | `mxt:cost_type` | 消耗类型 codec。 |
| `MxtRegistries.CURSE_TYPE` | `mxt:curse_type` | 诅咒类型 codec。 |
| `MxtRegistries.DATA_STORAGE_TYPE` | `mxt:data_storage_type` | 状态种类 codec；一个宿主声明哪些种类由它自己的类型决定（`AbilityType.createComponents`），内置的登记在 `MxtDataStorages`。 |
| `MxtRegistries.TRIGGER_TYPE` | `mxt:trigger_type` | 技能触发器 codec。 |
| `MxtRegistries.NUMBER_PROVIDER_TYPE` | `mxt:number_provider_type` | 数值提供器 codec。 |
| `MxtRegistries.AURA_MAXIMUM_TYPE` | `mxt:aura_maximum_type` | 环境灵气上限 codec。 |
| `MxtRegistries.FORMULA_FUNCTION` | `mxt:formula_function` | 表达式可用的公式函数。 |
| `MxtRegistries.FORMULA_VARIABLE` | `mxt:formula_variable` | 内置公式变量。每条条目从公式上下文带着的对象里读一个数，数据包不能加条目；名字列在[公式变量](/datapack/types/formula_variables)。 |
| `MxtRegistries.RESOURCE_VALUE_PROVIDER_TYPE` | `mxt:resource_value_provider_type` | 资源数值来源 codec。 |
| `MxtRegistries.ENTITY_ACTION_TYPE` | `mxt:entity_action_type` | 实体行为 codec。 |
| `MxtRegistries.BI_ENTITY_ACTION_TYPE` | `mxt:bi_entity_action_type` | 双实体行为 codec。 |
| `MxtRegistries.BLOCK_ACTION_TYPE` | `mxt:block_action_type` | 方块行为 codec。 |
| `MxtRegistries.ITEM_ACTION_TYPE` | `mxt:item_action_type` | 物品行为 codec。 |
| `MxtRegistries.ENTITY_CONDITION_TYPE` | `mxt:entity_condition_type` | 实体条件 codec。 |
| `MxtRegistries.BI_ENTITY_CONDITION_TYPE` | `mxt:bi_entity_condition_type` | 双实体条件 codec。 |
| `MxtRegistries.BLOCK_CONDITION_TYPE` | `mxt:block_condition_type` | 方块条件 codec。 |
| `MxtRegistries.ITEM_CONDITION_TYPE` | `mxt:item_condition_type` | 物品条件 codec。 |
| `MxtRegistries.DAMAGE_CONDITION_TYPE` | `mxt:damage_condition_type` | 伤害条件 codec。 |
| `MxtRegistries.RESOURCE_BAR_RENDER_DATA_TYPE` | `mxt:resource_bar_render_data_type` | 资源条绘制数据 codec。 |
| `MxtRegistries.MOUNT_RENDER_TYPE` | `mxt:mount_render_type` | 载具渲染方式 codec。 |
| `MxtRegistries.RESOURCE_BAR_CONTEXT` | `mxt:resource_bar_context` | 资源条上下文。 |
| `MxtRegistries.RESOURCE_BAR_VISIBILITY_TYPE` | `mxt:resource_bar_visibility_type` | 资源条显示条件 codec。 |
| `MxtRegistries.ITEM_MATCHER_ENTRY_TYPE` | `mxt:item_matcher_entry_type` | 物品匹配器条目 codec。 |
| `MxtRegistries.FORMATION_ACTION_TYPE` | `mxt:formation_action_type` | 阵法功能 codec，按模块的 `type` 分派；内置的登记在 `MxtFormationActionTypes`。 |
| `MxtRegistries.TIMELINE_ENTRY_TYPE` | `mxt:timeline_entry_type` | 天劫节拍 codec，按条目的 `type` 分派；内置的登记在 `MxtTimelineEntries`。 |
| `MxtRegistries.SECRET_REALM_GENERATION_TYPE` | `mxt:secret_realm_generation_type` | 秘境生成方式 codec。 |

固有类型按族分在 `MxtEntityActions`、`MxtBiEntityActions`、`MxtBlockActions`、`MxtItemActions`、`MxtEntityConditions` 这类类里注册。加一个固有类型就是提供一个 `MapCodec` 并加进对应的 `DeferredRegister`；数据包不能往这些注册表里加条目。

这些注册表对别的模组开放：第三方模块可以往其中任何一个加自己的 codec（内置触发器那一页明确写了这一点），加进去的 `type` id 随之对数据包可用。

## 公式变量

`mxt:formula_variable` 装的是公式能读的内置变量。一条条目实现 `FormulaVariable`，按需从 `FormulaContext` 带着的对象里读出数值，所以什么都不预计算：

| 成员 | 说明 |
| --- | --- |
| `names()` | 这个变量提供的准确名字。名字只索引一次，一个名字只能被一个变量占用；冲突会被报出来。 |
| `prefixes()` | 这个变量提供的前缀，每个都含自己的分隔符，例如 `caster_`。以某个前缀开头的名字交给那个变量，并把前缀去掉。 |
| `value(key, suffix, context)` | 这个名字的值。`key` 是命中的名字或前缀，`suffix` 是它后面的部分，所以 `caster_mxt_common` 到达时是 `caster_` 加后缀 `mxt_common`。返回 `Double.NaN` 表示不认这个名字，于是下一个占用它的变量会被问；解析器对"答不出来"与非有限值各报一次，然后按 `0` 继续。 |

用 `DeferredRegister.create(MxtRegistries.FORMULA_VARIABLE, MODID)` 注册。查不到的名字与非有限值都走 `FormulaDiagnostics`：开发环境打完整错误，生产环境按不同消息各留一行警告，所以附属模组不用自己定错误策略；codec 在解析期就能看出的问题按解码错误报。`FormulaNames` 把注册表 id 摊成公式标识符，并维护资源名与属性名的索引。

一个名字拆给哪些变量只做一次、而且按表达式做：`Expression` 把绑定存在编译好的 exp4j 表达式旁边，所以每 tick 求值的公式每个名字只解析一次，之后只重读数值。名字本身列在[公式变量](/datapack/types/formula_variables)。

## 数据包注册表

本模组声明的每一张注册表——文件目录、用途与每个字段——都列在 [JSON 数据格式](/datapack/json/index)。附属模组通常是往这些注册表里加条目，而不是新增注册表。

## 读取注册表

`MxtDatapackRegistries` 是服务端与已同步的客户端副本共用的入口。每次读都是普通注册表读，**不过滤任何东西**。把一条定义停用是加载期的事——定义文件里的 `neoforge:conditions` 让那条条目根本不进注册表——所以注册表里有它，就一定能用（见[停用一条定义](/datapack/overview#停用一条定义)）。

| 成员 | 说明 |
| --- | --- |
| `registries()` | 本模组拥有的每个注册表 key，按注册顺序。 |
| `get(key, id)` | 按 ID 读一条定义的值。 |
| `holder(key, id)` | 解析一条条目并保留它稳定的 holder 引用。 |
| `holders(key)` | 流式读出某个注册表的每条条目。 |
| `holders(access, key)` / `holders(provider, key)` | 从 `RegistryAccess` 或 `HolderLookup.Provider` 读，客户端读同步副本走的就是这条路。 |
| `get(access, key, id)` | 从客户端同步的 lookup 里读一个值。 |
| `holderOrEmpty(key, id)` | 与 `holder(key, id)` 相同，但没有服务端在跑时给空而不是抛异常。 |
| `isTagged(key, id, tagId)` / `isTagged(key, holder, tagId)` | 查一条条目上的原版数据包标签。 |
| `size(key)` / `registry(key)` | 拿到底层 `Registry`；只在服务端运行时可用。 |

::: info

没有服务端在跑时 `registry(key)` 与 `size(key)` 抛 `IllegalStateException`。客户端请改用带同步 lookup 的 `holders(access, key)` 与 `get(access, key, id)`。

:::

## Codec

一个定义类暴露两个 codec。`CODEC` 读写 `Holder<Definition>` 引用，字段或另一份 JSON 指向一条定义时用它；`DIRECT_CODEC` 读写整个对象，注册表拿它读条目本身。要一条定义的字段值就读 `DIRECT_CODEC`，例如 `Resource.DIRECT_CODEC` 或 `ItemQuality.DIRECT_CODEC`。

注册表怎么分成内容层与绑定层、一份定义从文件到一次结算经过什么、组件与声明谁压过谁，见[数据加载](/technical/data-loading)。
