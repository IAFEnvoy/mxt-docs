---
title: quality_chain（品质链条）
aside: false
---

# quality_chain（品质链条） {#quality_chain}

::: warning 已标记为将来可能移除

`QualityChain` 上是 `//TODO::May be removed`。它把"排序、默认档、成员资格、升级代价"从一组原版标签提升成一张注册表；若将来品质的阶梯收回 `quality` 自身（或收回绑定表），它会连同 `QualityChainService`、4 张绑定表的 `quality_chain` 字段、`/quality upgrade` 的按步结算与脚本侧的 `MxtQuality.upgrade` 一起消失。**现在声明它是完全受支持的**，只是不要把它当成不会变的地基。

:::

文件位置：`data/<namespace>/mxt/quality_chain/<path>.json`

**用途**：若干品质由低到高排成一条链，并声明默认档与每一步的升级代价/条件。**已标记为将来可能移除。**

一张链是一条**由低到高**的品质阶梯。绑定表用 `quality_chain` 引用它，于是"这个物品属于哪条链""没写组件时默认是哪一档""往上爬一步要付什么"三件事在同一处回答；链同时给出**成员资格**——物品解析出的档必须在链上，否则不能使用。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `quality_chain.mxt.<命名空间>.<路径>` | 链条显示名。省略时用左列的默认键。 |
| `description` | Text Component | `quality_chain.mxt.<命名空间>.<路径>.description` | 链条描述。省略时用左列的默认键。 |
| `tiers` | `Holder<quality>[]` | **必填** | 由低到高的档位。**数组顺序就是链条顺序**（不受数据包合并顺序影响），不能为空、不能重复。 |
| `default` | `Holder<quality>` | 最低一档 | 没有覆盖组件、也没有结算结果时物品落到哪一档。必须是 `tiers` 里的一项；被 `mxt:disabled` 停用的档不能当默认档——那种情况下这族物品就没有默认档，而不是自动往下顺延。 |
| `upgrades` | `List<Step>` | `[]` | 每一步的代价与条件：`upgrades[i]` 描述 `tiers[i] → tiers[i+1]` 这一步。 |

`Step` 只有两个字段：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `costs` | `Cost[]` | `[]` | 这一步的代价，走与技能消耗完全相同的那一套事务：`plan` → `commit` **整组原子**，付不出就一步都不动、也不会写档。解码失败不会被静默丢弃。 |
| `condition` | `EntityCondition` | `mxt:always_true` | 这一步能不能走（在扣费之前判）。 |

```json
{
  "tiers": ["example:common", "example:refined", "example:flawless"],
  "default": "example:common",
  "upgrades": [
    { "costs": [{ "id": "example:qi", "amount": 20 }] },
    { "costs": [{ "id": "example:qi", "amount": 60 }], "condition": { "type": "mxt:always_true" } }
  ]
}
```

## 三条约定

- **没声明的步不能走。** `upgrades` 比 `tiers` 短（或整个省略）时，后面那些步的提升会被拒绝，**不会**当成免费。只想用链来排序、不做升级时，一个 `upgrades` 都不写即可。
- **一次一步。** [`/quality upgrade`](/player-guide/commands/quality) 与脚本的 [MxtQuality](/kubejs/api/quality) 都只把物品往上推一档，付的就是那一步自己声明的那笔代价；跳档要一步一步来。
- **加载期校验**：`tiers` 非空且不重复、`default` 属于 `tiers`、`upgrades` 最多 `tiers.size() - 1` 项。写错在加载期就被拒，而不是运行期悄悄失效。

## 品质是怎么解析出来的 {#resolution}

一条堆的品质按固定顺序取第一个能拿到的：

1. 堆上的 `mxt:item_quality` **覆盖组件**——[`/quality set`](/player-guide/commands/quality) 与 `MxtQuality.set` 写的就是它；
2. 堆上的锻造结果 `mxt:forging_result` 记着的那一档；
3. **定义默认档**：法器 [artifact](/datapack/json/artifact) 的 `quality`、功法 [technique](/datapack/json/technique) 的 `quality`；
4. 这一栈所属**链条的 `default`**；
5. 匹配到的灵植 [spirit_herb](/datapack/json/spirit_herb) 声明的 `quality`。

链本身来自绑定表的 `quality_chain`（见[物品绑定](/datapack/json/item_binding)、[武器绑定](/datapack/json/weapon_binding)、[丹药绑定](/datapack/json/pill_binding)与[功法绑定](/datapack/json/technique_binding)）。绑定表没声明时按"唯一持有该档的那条链"反查；同一档属于多条链时升级会被拒绝，而不是替你猜一条。

## 相关

- 品质条目本身：[quality](/datapack/json/quality)。
- 升级入口：[`/quality`](/player-guide/commands/quality) 与 [MxtQuality](/kubejs/api/quality)。
- 锻造自己的档位阶梯是蓝图上的 [`quality_by_extra_steps`](/datapack/json/forging_blueprint)，与链条无关：那条曲线读的是额外步数。
