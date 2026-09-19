---
title: 数值提供器
---

# 数值提供器

所有需要随等级、境界或事件上下文变化的数值都可以使用 `NumberProvider`。求值在服务端完成，客户端只使用同步后的结果。

## 简写

数字自动解析为常量：

```json
"amount": 5
```

字符串自动解析为表达式：

```json
"amount": "4 + level * 0.5"
```

## 结构化表达式

```json
{
  "type": "mxt:expression",
  "expression": "base_damage * multiplier",
  "params": {
    "base_damage": 8,
    "multiplier": "1 + level * 0.1"
  }
}
```

`params` 的值本身也是 `NumberProvider`，并覆盖同名上下文变量。变量名是否可用由内置变量表和当前上下文共同决定：上下文无法提供的名字会在求值时被报告——开发环境打印完整 ERROR 日志（含异常与堆栈），生产环境每个不同消息打印一行 WARN，两者都继续按 `0` 求值。加载阶段可判定的公式问题（表达式为空、语法错误、`params` 非法等）属于解码错误：加载失败，但加载器会**收集全部失败条目后一并列出**，不会只报第一个。

## 固有数值提供器

| `type` | 字段 | 说明 |
| --- | --- | --- |
| `mxt:constant` | `value` | 固定数值。数字简写等价于该类型。 |
| `mxt:expression` | `expression`、`params` | exp4j 表达式；`params` 可覆盖上下文变量。 |
| `mxt:context_variable` | `variable`、`fallback` | 读取当前上下文变量，不存在时使用回退值。 |
| `mxt:sum` | `summands` | 数值提供器求和。 |
| `mxt:uniform` | `min`、`max` | 使用传入上下文的 `RandomSource` 取均匀随机值。 |
| `mxt:binomial` | `n`、`p` | `n` 次伯努利试验；`n` 为 `0..16384`，`p` 为 `0..1`。 |
| `mxt:weighted_list` | `distribution` | 按正整数 `weight` 选择 `data`。 |
| `mxt:conditional` | `branches`、`fallback` | 按顺序检查条件并返回第一个满足分支的值；`fallback` 只能填写数字或表达式字符串，用于没有 `Player` 或所有分支均不匹配的情况。未填写时返回 `0`。 |
| `mxt:js` | 类型专用字段 | 调用 KubeJS 数值提供器扩展。 |

资源数值提供器注册表 `resource_value_provider_type` 还提供两个灵气浓度来源：

| `type` | 说明 |
| --- | --- |
| `mxt:environment_concentration` | 当前位置的环境模板浓度，只计算群系/维度/区域等环境来源，不包含区块库存和方块、阵法释放的灵气。 |
| `mxt:actual_concentration` | 当前位置最终解析浓度，包含环境、区块库存以及方块和阵法等所有已生效来源。 |

实体和 Level 的 `RandomSource` 会优先传入随机提供器；不要在客户端重新滚动随机值来决定游戏结果。
