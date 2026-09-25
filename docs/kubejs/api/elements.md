---
title: MxtElements：元素与附着
description: 读取实体当前生效的元素与已攒下的元素附着，并按与打击相同的管线施加附着。
---

# `MxtElements`：元素与附着

元素与附着是两件事：`list`/`has` 读的是灵根（这个身体**是什么**），`amount`/`attach` 读写的是一张按元素记数的附着表（这个身体**攒了多少**）。四个方法都在同一个对象上，但读的是两份不同的状态。

## 方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `list(entity)` | `Entity` | `List<String>` | 该实体**当前生效**的灵根所指的元素 ID，按 ID 排序。停用的元素与关闭的灵根都不算，没有灵根则为空列表。 |
| `has(entity, element)` | `Entity`、元素 ID | `boolean` | 该实体的灵根是否指向这个元素。 |
| `amount(entity, element)` | `Entity`、元素 ID | `double` | 这个元素在该实体身上的附着量；没有则为 `0`，元素被停用或不存在也返回 `0`。客户端读同步过来的副本。 |
| `attach(entity, element, amount)` | `Entity`、元素 ID、有限数值 | `double` | 走与打击**同一条**管线给实体加上（负数则扣掉）该元素的附着，返回新的附着量。攒够时 [`element_reaction`](/datapack/json/element_reaction) 照常触发。 |

`attach` 与实体行为 `mxt:attach_element` 等价，因此"泡在岩浆里""服丹""诅咒持续喂火"这类来源用脚本写也一样；负数可以用来净化。三个读方法两侧都能用（附着表是同步过来的附件，客户端脚本读的是本地副本，物品悬浮提示那类逻辑正是这么用的）；只有 `attach` 是服务端操作，客户端、未知或被停用的元素、非有限值、`0` 一律返回 `0` 且不改动任何东西。

```js
// kubejs/server_scripts/mxt_element.js
PlayerEvents.tick(event => {
  const player = event.player
  if (player.level().isClientSide()) return
  // "身上有水灵根、且火气攒到 8 了" —— 反应还没触发就能先看到苗头。
  if (MxtElements.has(player, 'mxt_test:water') && MxtElements.amount(player, 'mxt_test:fire') >= 8) {
    console.info(`water cultivator carrying ${MxtElements.list(player)}`)
  }
})

// 让一次自定义事件给目标攒火气；攒够时数据包里的 element_reaction 会自己结算。
MxtElements.attach(target, 'mxt_test:fire', 4)
```

## 相关

- 数据包侧：[元素 `element`](/datapack/json/element)、[元素反应 `element_reaction`](/datapack/json/element_reaction)。
- 元素从哪来：[MxtSpiritRoots](/kubejs/api/spirit_roots)（灵根绑定的元素）与 [MxtAura](/kubejs/api/aura)（环境灵气）。
- 伤害管线上的元素因子：[伤害结算](/technical/damage)。
- [KubeJS API 参考](/kubejs/api-reference)。
