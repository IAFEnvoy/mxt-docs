---
title: MxtLoot：战利品条件与函数
description: 注册原版战利品表的脚本条件与脚本函数，让战利品表直接调用服务端脚本。
---

# `MxtLoot`：战利品条件与函数

MiXianTu 给原版战利品表加了几个类型，其中两个可以由脚本提供，于是普通战利品表也能调用服务端脚本，而不需要依赖某个物品或方块。

## 方法

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `condition(id, callback)` | 回调 ID、`(lootContext, params) => boolean` | `void` | 注册原版战利品条件类型 `mxt:js`。 |
| `function(id, callback)` | 回调 ID、`(stack, lootContext, params) => ItemStack` | `void` | 注册原版战利品函数类型 `mxt:js`。 |

```js
// KubeJS 没有把原版战利品参数键绑定为全局，先加载一次类。
const LootParams = Java.loadClass('net.minecraft.world.level.storage.loot.parameters.LootContextParams')

MxtLoot.condition('example:first_clear', (loot, params) => {
  const player = loot.getParam(LootParams.THIS_ENTITY)
  return player != null && player.tags.contains(`cleared_${params.dungeon}`)
})

MxtLoot.function('example:bless', (stack, loot, params) => {
  stack.grow((params.multiplier || 1) - 1)
  return stack
})
```

```json
{
  "conditions": [{"condition": "mxt:js", "id": "example:first_clear", "params": {"dungeon": "example:fire_temple"}}],
  "functions": [{"function": "mxt:js", "id": "example:bless", "params": {"multiplier": 3}}]
}
```

两个回调都在服务端生成战利品时执行，且都不接收 `FormulaContext`：请直接读原版 `LootContext`，例如 `loot.getParam(LootParams.THIS_ENTITY)`。战利品函数返回要保留的 stack——原样返回表示不改动掉落，返回新 stack 表示替换，返回 `null` 表示保留原样。回调缺失时条件为 `false`、函数保留原 stack，并记录一条警告。

## 相关

- 战利品表本身是原版格式，这两个类型只是被 `mxt:js` 认领；`id` 的注册见 [API 参考](/kubejs/api-reference) 的 `mxt:js` 一节。
- [MxtTriggers](/kubejs/api/triggers) —— 另一个"脚本提供数据包类型"的对象。
- [KubeJS API 参考](/kubejs/api-reference)。
