---
title: MxtCultivation：修为与突破
description: 增加某个资源链的修为进度，或按那条链尝试一次突破。
---

# `MxtCultivation`：修为与突破

`MxtCultivation` 只管两件事：给某个资源的修为进度加数，以及按那条资源链尝试一次突破。突破走的是与修炼、事件完全相同的一条服务端流程。

## 方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `add(entity, resource, amount)` | `LivingEntity`、资源 ID、有限非负数 | `boolean` | 向该资源对应的修为进度增加数值。客户端、未知资源、负数或非有限数返回 `false`。 |
| `tryBreakthrough(entity, resource)` | `LivingEntity`、资源 ID | `CultivationService.BreakthroughResult` | 按对应资源的境界链尝试突破。 |

突破结果的 record 访问器为 `advanced()`、`failure()`、`failedResource()`、`costs()`。它会正常触发 `cultivationBreak`、突破动作、粒子、天劫和关联技能流程。

```js
const result = MxtCultivation.tryBreakthrough(player, 'mxt:spirit_power')
if (!result.advanced()) console.warn(`breakthrough refused: ${result.failure()}`)
```

## 相关

- 数据包侧：[境界阶段 `realm_stage`](/datapack/json/realm_stage)、[数值 `resource`](/datapack/json/resource)、[灵气 `aura`](/datapack/json/aura)。
- 读/改这一处的环境与数值：[MxtAura](/kubejs/api/aura)、[MxtValues](/kubejs/api/values)。
- 想拦下或改写突破消耗：[MxtEvents](/kubejs/api/events) 的 `cultivationBreak`。
- [KubeJS API 参考](/kubejs/api-reference)。
