---
title: element_reaction（元素反应）
---

# element_reaction（元素反应） {#element_reaction}

文件位置：`data/<namespace>/mxt/element_reaction/<path>.json`

**用途**：元素附着达到要求时触发的反应。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `amounts` | `Map<Holder<element>, NumberProvider>` | **必填** | 每个列出的元素要攒到多少才成立；写几项就要同时满足几项。 |
| `consume` | `Map<Holder<element>, NumberProvider>` | 同 `amounts` | 触发时扣掉多少；**省略**就是扣掉与需求相同的量，写空对象 `{}` 则一点不扣（"答话但不清账"），写的键必须出现在 `amounts` 里。 |
| `condition` | `EntityCondition` | `mxt:always_true` | 附加条件，用来做"下雨时才炸""站在水里才反应"这类情境限制。 |
| `action` | `EntityAction` | 无 | 触发时对**持有者自己**执行的行为。 |
| `priority` | Int | `0` | 越高越先尝试；同高按注册表 id 排序。 |

一次反应就是"攒够了就答话"：`amounts` 是要求，不是数量。元素攒够后管线按优先级找**第一条**要求与条件都成立的，执行它的 `action` 并扣掉 `consume`，然后**继续找**——所以一条反应可以引出另一条。链条有上限（一次应用最多 8 条），因为"消耗自己又重新施加自己"是合法写法。这个上限是**整条链**的上限而不是每层一层：反应的行为里再次施加元素（或打出带属性的伤害、又在受击处积累附着）时，那次施加不会另开一条链，只把量加上去，由正在跑的那条链在下一轮读到并结算——所以"火一直烧到有人扑灭"写得出来，也不会自己喂自己喂到把线程撑爆。自然衰减不会触发反应：衰减只会让总量变少，够不着的仍然够不着。

```json
// data/example/mxt/element_reaction/fire_burst.json
{
  "amounts": { "example:fire": 8 },
  "action": { "type": "mxt:damage", "amount": "4 + 2 * realm_rank" },
  "priority": 10
}
```

附着量本身住在实体附件 `mxt:element_attachment` 里：按元素分键、随存档与同步一起走、归零即删键，所以"攒了多少"与"攒够之后做什么"是分开的两件事。攒附着的两条路是 `element.damage_attachment`（被打）与实体行为 `mxt:attach_element`（其它来源，比如泡在岩浆里、服丹、诅咒）；清附着同样用 `mxt:attach_element` 写负数，或让元素自己 `attachment_decay` 每 tick 扣。实体条件 `mxt:element_attachment` 可以只读当前量（同样的 `{min?, max}` 窗口），用来写"攒得越多越糟"这类效果而不需要任何反应成立；被 `mxt:disabled` 停用的元素在这里答 `false`（附着表里可能还留着它停用前的量，但那不再是这个元素的事），写空表会在加载期被拒绝而不是当成"恒真"。

反应**没有自己的事件回调**，要观测就在 `action` 里写行为；玩家侧也没有任何入口——附着与反应完全由内容驱动（伤害类型认领与行为），本模组不提供命令、按键或界面去加附着或手动触发。元素定义侧的 `damage_types`、`damage_attachment` 与 `attachment_decay` 见 [element](/datapack/json/element)。
