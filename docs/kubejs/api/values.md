---
title: MxtValues：脚本数值
---

# `MxtValues`：脚本数值

## 注册脚本 Provider

| 方法 | 回调参数 | 返回值 | 用途 |
| --- | --- | --- | --- |
| `number(id, callback)` | `(context: FormulaContext, params: object)` | 有限 `number` | `mxt:js` NumberProvider。 |
| `resourceValue(id, callback)` | `(holder: ResourceHolderAttachment, resource: Holder<Resource>, context: FormulaContext, params: object)` | 有限 `number` | `mxt:js` ResourceValueProvider。 |

### `FormulaContext`

所有拿到公式上下文的回调用的都是同一个对象：`MxtValues.number`、`MxtValues.resourceValue`，以及 Action、Condition 的 `mxt:js` 回调。它提供：

| 方法 | 说明 |
| --- | --- |
| `context.value(name)` | 读取变量：先取显式上下文值，再查内置变量表。上下文无法提供的名字会被报告——开发环境打印完整 ERROR 日志，生产环境每个不同消息打印一行 WARN——并返回 `0`。 |
| `context.explicit(name)` | 只取显式值；上下文没有该值时返回 `NaN`。用于判断当前事件是否提供了某个载荷，而不用去查变量表。 |
| `context.contains(name)` | 判断当前上下文能否提供该名字；不报告也不抛异常。 |
| `context.player()` | 返回当前玩家；不存在时为 `null`。 |
| `context.caster()` | 返回施法实体；上下文没有实体时为 `null`。 |
| `context.target()` | 返回双实体公式中的第二个实体；不存在时为 `null`。 |
| `context.resource()` | 返回本次计算绑定的资源修炼状态；公式不针对单个资源时为 `null`。 |
| `context.variables()` | 只返回显式值（事件载荷与调用方写入的值）；实体与资源变量按需从上下文对象读取，不在此表中。 |
| `context.random()` | 返回本次计算使用的权威随机源。 |

`resourceValue` 中的 `holder` 是资源附件，`resource` 是资源 Holder；通常只读使用，例如 `holder.get(resource)`。不要把该回调用于写入状态。

## 求值

| 方法 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `evaluateNumber(entity, definition)` | `Entity`、NumberProvider 对象 | `number` | 计算任意注册 Provider。非有限结果返回 `0`。 |
| `evaluateResource(entity, resource, definition)` | `LivingEntity`、资源 ID、ResourceValueProvider JSON | `number` | 计算指定资源的值。实体感知 Provider 会读取当前位置环境/实际灵气。 |

同一个 JSON 文本只解析一次并复用（解析会构建整棵 Provider 树，包括其中的表达式），所以脚本每 tick 计算同一份定义也只付出一次解析代价。世界注册表变化时缓存会被丢弃；脚本改动定义后 JSON 文本不同，也会重新解析。

```js
const levelScaled = MxtValues.evaluateNumber(player, {
  type: 'mxt:expression',
  expression: 'level * 2 + 1'
})
const actualAura = MxtValues.evaluateResource(player, 'mxt:spirit_power', {
  type: 'mxt:actual_concentration'
})
```
