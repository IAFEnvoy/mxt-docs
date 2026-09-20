---
title: KubeJS API 参考
---

# KubeJS API 参考

MiXianTu 的 KubeJS 桥接按领域提供独立对象，不提供承载全部方法的 `Mxt` 根对象。所有会改动游戏状态的 API 都必须从 `kubejs/server_scripts/` 调用，并会进入本体既有的服务端事务和事件流程。

下文的 `id`、`resource`、`ability`、`curse`、`zone` 等标识符均为带命名空间的字符串，例如 `mxt:spirit_power` 或 `example:fireball`。传入非法标识符或无法按 Codec 解析的 JSON 会直接抛出脚本错误，以便定位数据问题。

## 子页面

- [MxtActions：脚本 Action](/kubejs/api/actions)
- [MxtConditions：脚本 Condition](/kubejs/api/conditions)
- [MxtValues：脚本数值](/kubejs/api/values)
- [MxtCosts 与 MxtResources](/kubejs/api/costs)
- [运行时领域 API](/kubejs/api/runtime)
- [MxtEvents：事件](/kubejs/api/events)

## 概览

| Global | Responsibility |
| --- | --- |
| `MxtActions` | 注册 `mxt:js` Action 回调，或运行内置 Action。 |
| `MxtConditions` | 注册 `mxt:js` Condition 回调，或测试内置 Condition。 |
| `MxtValues` | 注册/计算 NumberProvider 与 ResourceValueProvider。 |
| `MxtCosts` | 预检或支付一个完整的 `Cost`。 |
| `MxtResources` | 原子支付多个资源 Cost。 |
| `MxtAbilities` | 施放已授予实体的技能。 |
| `MxtCultivation` | 增加修为、尝试境界突破。 |
| `MxtCurses` | 施加（可带时长）、显式移除与查询诅咒。 |
| `MxtAura` | 查询、添加、移除服务端灵气区域。 |
| `MxtElements` | 查询实体身上的元素与元素附着，并施加附着。 |
| `MxtSpiritRoots` | 查询、授予、移除与开关灵根。 |
| `MxtPhysiques` | 查询、授予、移除与开关体质。 |
| `MxtSouls` | 回收实体可转移的魂魄。 |
| `MxtTriggers` | 发布自定义触发器信号，并让脚本订阅信号。 |
| `MxtLoot` | 注册脚本战利品条件与战利品函数。 |
| `MxtEvents` | 所有 MXT 服务端生命周期事件。 |

`Entity`、`LivingEntity`、`Player`、`Level`、`BlockPos`、`ItemStack`、`DamageSource` 均为 KubeJS 暴露的原版 Java 对象。`JsonObject`/`JsonElement` 参数可直接传普通 JavaScript 对象或数组。

## 通用数据规则

### NumberProvider

凡是参数名为 `amount`、`value` 等 NumberProvider 的字段都支持以下写法：

```js
10                                      // 常量
'level * 2 + 1'                         // 公式
{ type: 'mxt:uniform', min: 1, max: 3 } // 固有类型对象
```

公式上下文由调用 API 自动从实体或世界创建。脚本回调或 Provider 的计算结果必须是有限数字；`NaN`、`Infinity`、异常或未注册回调都会记录日志并作为 `0` 处理。

### `mxt:js` 回调定义

Action、Condition、NumberProvider、ResourceValueProvider、触发器匹配器、Cost、技能目标选择器、战利品条件与战利品函数均有一个预注册的 `mxt:js` 类型。先在服务器脚本中注册回调：

```js
MxtActions.entity('example:heal', (entity, params) => {
  entity.heal(params.amount || 1)
})
```

再在任意相应的数据包字段中使用：

```json
{
  "type": "mxt:js",
  "id": "example:heal",
  "params": { "amount": 4 }
}
```

`id` 在**同一种回调类别**内唯一。KubeJS 重载服务器脚本前会清空全部回调，随后重新执行脚本注册；不要把注册放入只执行一次的客户端脚本。没有找到回调时，Action 不执行、Condition 返回 `false`、数值返回 `0`，并输出警告日志。

## 返回值与错误

服务 API 返回的 Java record 一律使用 Java accessor，例如 `result.committed()`，而非假设存在 JavaScript 字段。失败通常不会抛出：请检查 `failure()`、`committed()`、`advanced()`、`applied()` 等返回值。只有 API 参数非法、标识符非法、JSON 无法被对应 Codec 解码，或对错误事件阶段调用可变 setter 时才会抛异常。

只在服务端才有意义的操作遇到客户端脚本时都不会改动玩家或世界：`MxtCosts.consume` 与 `MxtTriggers.subscribe` / `subscribeOnce` 会记录一次警告并返回 `false`；`MxtAbilities`、`MxtCultivation`、`MxtCurses`、`MxtSouls`、`MxtElements.attach`、`MxtSpiritRoots` 与 `MxtPhysiques` 的改变状态方法，以及 `MxtTriggers.publish` 直接返回 `false`（`MxtElements.attach` 返回 `0`），或把结果里的 `failure()` / `failure` 置为 `SERVER_ONLY`，不写日志。唯一的例外是 `MxtAura.addBox`：它在客户端会抛 `IllegalArgumentException`（只接受 `ServerLevel`）。

`MxtActions.execute*` 故意不设该保护，因为内置 Action 自己决定作用端：JSON 里声明了客户端执行的 Action（例如带 `client` 标志的速度 Action）本来就应当就地运行。

完整组合示例见 [KubeJS 综合示例](/kubejs/examples)。
