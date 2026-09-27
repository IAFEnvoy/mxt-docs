---
title: quality_chain（品质链条）
description: 把若干品质排成一条由低到高的阶梯，并声明默认档与每一步升级的代价和条件。
aside: false
---

# quality_chain（品质链条） {#quality_chain}

文件位置：`data/<namespace>/mxt/quality_chain/<path>.json`

一张链是一条**由低到高**的品质阶梯。绑定表用 `quality_chain` 引用它，于是"这个物品属于哪条链""没写组件时默认是哪一档""往上爬一步要付什么"三件事在同一处回答；链同时给出**成员资格**——物品解析出的档必须在链上，否则不能使用。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `quality_chain.mxt.<命名空间>.<路径>` | 链条显示名。省略时用左列的默认键。 |
| `description` | Text Component | `quality_chain.mxt.<命名空间>.<路径>.description` | 链条描述。省略时用左列的默认键。 |
| `tiers` | 品质 id 数组 | **必填** | 由低到高的档位。**数组顺序就是链条顺序**，不受数据包合并顺序影响。 |
| `default` | 品质 id | 最低一档 | 没有覆盖组件、也没有结算结果时物品落到哪一档。 |
| `upgrades` | `Step` 数组 | `[]` | 每一步的代价与条件：`upgrades[i]` 描述 `tiers[i] → tiers[i+1]` 这一步。 |

`Step` 只有两个字段：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `costs` | `Cost` 数组 | `[]` | 这一步的代价，走与技能消耗完全相同的那一套事务：`plan` → `commit` **整组原子**，付不出就一步都不动、也不会写档。 |
| `condition` | `EntityCondition` | `mxt:always` | 这一步能不能走，在扣费之前判。 |

`tiers` 与 `default` 都是条目引用：引用的定义不在注册表里（文件被删，或被 `neoforge:conditions` 挡掉）时，这个链条文件本身就解码失败——那不是"这族物品没有默认档"，而是整张链读不进来。

`Step.costs` 的解码失败不会被静默丢弃。

```json
{
  "tiers": ["example:common", "example:refined", "example:flawless"],
  "default": "example:common",
  "upgrades": [
    { "costs": [{ "id": "example:qi", "amount": 20 }] },
    { "costs": [{ "id": "example:qi", "amount": 60 }], "condition": { "type": "mxt:always" } }
  ]
}
```

## 三条约定 {#rules}

- **没声明的步不能走。** `upgrades` 比 `tiers` 短（或整个省略）时，后面那些步的提升会被拒绝（`NO_STEP`），**不会**当成免费。只想用链来排序、不做升级时，一个 `upgrades` 都不写即可。
- **一次一步。** [`/quality upgrade`](/player-guide/commands/quality) 与脚本的 [MxtQuality](/kubejs/api/quality) 都只把物品往上推一档，付的就是那一步自己声明的那笔代价；跳档要一步一步来。
- **加载期校验**：`tiers` 非空且不重复、`default` 属于 `tiers`、`upgrades` 最多 `tiers.size() - 1` 项。写错在加载期就被拒，而不是运行期悄悄失效。

## 品质是怎么解析出来的 {#resolution}

一条堆的品质按固定顺序取第一个能拿到的：

1. 堆上的 `mxt:item_quality` **覆盖组件**——[`/quality set`](/player-guide/commands/quality) 与 `MxtQuality.set` 写的就是它；
2. 堆上的锻造结果 `mxt:forging_result` 记着的那一档；
3. **定义默认档**：法器 [artifact](./artifact.md) 的 `quality`、功法 [technique](./technique.md) 的 `quality`；
4. 这一栈所属**链条的 `default`**；
5. 匹配到的灵植 [spirit_herb](./spirit_herb.md) 声明的 `quality`。

链本身来自绑定表的 `quality_chain`（见[物品绑定](./item_binding.md)、[武器绑定](./weapon_binding.md)、[丹药绑定](./pill_binding.md)与[功法绑定](./technique_binding.md)）。绑定表没声明时按"唯一持有该档的那条链"反查；同一档属于多条链时升级会被拒绝，而不是替你猜一条。物品解析出的档不在链上时不能使用（`QUALITY_CHAIN`）。

## 相关

- 品质条目本身：[quality](./quality.md)。
- 升级入口：[`/quality`](/player-guide/commands/quality) 与 [MxtQuality](/kubejs/api/quality)。
- 锻造自己的档位阶梯是蓝图上的 [`quality_by_extra_steps`](./forging_blueprint.md)，与链条无关：那条曲线读的是额外步数。
