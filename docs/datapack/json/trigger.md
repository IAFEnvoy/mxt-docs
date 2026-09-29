---
title: trigger（事件规则）
aside: false
---

# trigger（事件规则） {#trigger}

文件位置：`data/<namespace>/mxt/trigger/<path>.json`

一条独立的事件反应规则：某个信号被发布时，匹配该信号的规则把条件对"信号的动作主体"求值，成立就执行行为。它不挂在任何技能上，所以内容包能把任意已发布的信号变成效果，比如"破坏方块时给某个资源 +1"。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `trigger` | `Trigger` | **必填** | 该规则响应的信号，写法与技能触发器一致：内置信号写 `{"type": "mxt:block_break"}`，脚本匹配器（`mxt:js`）可检查整个信号。 |
| `condition` | `EntityCondition` | `mxt:always` | 针对信号主体求值，使用事件提供的公式上下文；写数组表示全部满足。 |
| `action` | `EntityAction` | `mxt:no_op` | 条件成立后对该主体执行；写数组按顺序执行。 |
| `chance` | `NumberProvider` | `1` | 每次信号匹配后掷一次的概率：`≤0` 永不执行、`≥1` 必定执行，中间值按实体随机数掷。 |
| `cooldown` | `NumberProvider` | `0` | 执行之后要等多少 tick 才能再次执行，**按规则 id 分别记在主体身上**（存档保留、死亡不清）。`0` 表示不限流。 |

规则需要动作主体。没有主体的信号只会送达订阅，不会触发规则——条件与行为都属于某一个实体。`chance` 与 `cooldown` 也按主体求值：**同一条规则被两个实体持有，各自掷各自的概率、各记各的冷却**。`chance` 算不出数（非有限值）时按 `1` 处理。

条件与行为拿到的父上下文就是事件上下文，发布方写入的公式值因此可以读取：响应 `mxt:hurt` 的规则可以用 `damage` 决定数值，脚本用 `MxtTriggers.publish` 发布的自定义信号同理。

```json
// data/example/mxt/trigger/qi_from_mining.json
{
  "trigger": {"type": "mxt:block_break"},
  "condition": {"type": "mxt:health", "comparison": ">=", "compare_to": 1},
  "action": {"type": "mxt:add_resource", "resource": "example:qi", "amount": 1}
}
```

```json
// data/example/mxt/trigger/qi_from_damage.json
{
  "trigger": {"type": "mxt:hurt"},
  "condition": {"type": "mxt:resource_compare", "resource": "example:qi", "min": 10},
  "action": {"type": "mxt:add_resource", "resource": "example:qi", "amount": "damage / 2"}
}
```

规则在服务器缓存构建时按"触发器声明的信号"建索引，发布信号只花一次查表。规则的行为若又发布了自己响应的信号，会在自身执行期间被跳过以避免递归；规则抛异常只记录日志，不影响同一信号的其他规则与订阅。

订阅按「信号 → 所有者 → 模块:标识」分层索引：同一个标识只在它自己的实体内部唯一，所以两个实体持有同一份定义不会互相顶掉。发布时先按所有者判空，再取该所有者的订阅快照——一次性订阅在运行中会把自己摘掉，快照是为此存在的。发布主体是假玩家时整个信号被忽略。

校验在缓存构建时完成，问题**全部收集**而不是遇到第一个就中断：`/mxt registries validate` 一次列出所有问题（每条都带 `data/<命名空间>/mxt/<注册表>/<path>` 路径），`/mxt trigger rules <信号>` 确认某个信号到底有没有规则响应。规则声明了 `condition` 却漏写 `action` 也算一条问题——默认行为是空操作，这条规则会永远什么都不做。

三个同名概念要区分：**规则**（本页，数据包注册表 `mxt/trigger`）、**触发器匹配器**（固有注册表 `mxt:trigger_type`，决定信号如何匹配；内置按信号类型匹配，另有 `mxt:js`）、**信号**（运行时通知本身，模组为各类事件发布，脚本也可发布）。

移植过来的原版触发器也是 `mxt:trigger_type` 的条目，字段、各自提供的信号与时机见[trigger_type（触发器）](/datapack/types/other/trigger-type)。
