---
title: KubeJS API 参考
description: "MiXianTu KubeJS 桥接的 API 参考：按领域一个全局对象（MxtActions、MxtCosts、MxtAbilities…），一个对象一个页面，另有通用数据规则、返回值与错误处理。"
---

# KubeJS API 参考

MiXianTu 的 KubeJS 桥接**按领域一个全局对象**，不提供承载全部方法的 `Mxt` 根对象；每个对象一个页面，见下面的表。所有会改动游戏状态的 API 都必须从 `kubejs/server_scripts/` 调用，并会进入本体既有的服务端事务和事件流程。

下文与各子页面里的 `id`、`resource`、`ability`、`curse`、`zone` 等标识符均为带命名空间的字符串，例如 `mxt:spirit_power` 或 `example:fireball`。传入非法标识符或无法按 Codec 解析的 JSON 会直接抛出脚本错误，以便定位数据问题。

## 根对象

| 对象 | 负责什么 | 页面 |
| --- | --- | --- |
| `MxtActions` | 注册 `mxt:js` Action 回调，或直接运行内置 Action。 | [MxtActions](/kubejs/api/actions) |
| `MxtConditions` | 注册 `mxt:js` Condition 回调，或直接测试内置 Condition。 | [MxtConditions](/kubejs/api/conditions) |
| `MxtValues` | 注册或计算 NumberProvider 与 ResourceValueProvider；`FormulaContext` 的读法在这里。 | [MxtValues](/kubejs/api/values) |
| `MxtCosts` | 预检或支付**一个** `Cost`。 | [MxtCosts](/kubejs/api/costs) |
| `MxtResources` | 把**一整份** `Cost` 数组当作一笔原子事务支付。 | [MxtResources](/kubejs/api/resources) |
| `MxtAbilities` | 施放技能，并授予、撤销、查询实体持有的技能与来源。 | [MxtAbilities](/kubejs/api/abilities) |
| `MxtCultivation` | 增加修为、按资源链尝试突破。 | [MxtCultivation](/kubejs/api/cultivation) |
| `MxtCurses` | 施加（可带时长）、释放、移除与查询诅咒。 | [MxtCurses](/kubejs/api/curses) |
| `MxtAura` | 查询世界灵气，添加与移除服务端灵气区域。 | [MxtAura](/kubejs/api/aura) |
| `MxtElements` | 读实体身上的元素与元素附着，并施加附着。 | [MxtElements](/kubejs/api/elements) |
| `MxtSpiritRoots` | 查询、授予、移除与开关灵根。 | [MxtSpiritRoots](/kubejs/api/spirit_roots) |
| `MxtPhysiques` | 查询、授予、移除与开关体质。 | [MxtPhysiques](/kubejs/api/physiques) |
| `MxtQuality` | 读物品堆解析出的品质与所属链条，写覆盖组件或沿链条升一档。 | [MxtQuality](/kubejs/api/quality) |
| `MxtSouls` | 回收实体可转移的魂魄。 | [MxtSouls](/kubejs/api/souls) |
| `MxtTriggers` | 发布自定义触发器信号，并让脚本订阅信号。 | [MxtTriggers](/kubejs/api/triggers) |
| `MxtLoot` | 注册脚本战利品条件与战利品函数。 | [MxtLoot](/kubejs/api/loot) |
| `MxtEvents` | 所有 MXT 服务端生命周期事件。 | [MxtEvents](/kubejs/api/events) |

前四个对象（`MxtActions`、`MxtConditions`、`MxtValues`、`MxtCosts`）与 `MxtLoot`、`MxtTriggers.matcher` 是**数据包回调**的注册处：它们给数据包里预注册的 `mxt:js` 类型提供实现。其余对象是**运行时领域 API**：脚本主动读状态或改状态。

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

各类回调的注册方法在它们自己的页面上：[MxtActions](/kubejs/api/actions)、[MxtConditions](/kubejs/api/conditions)、[MxtValues](/kubejs/api/values)、[MxtCosts](/kubejs/api/costs)、[MxtTriggers](/kubejs/api/triggers)、[MxtLoot](/kubejs/api/loot)、[MxtAbilities](/kubejs/api/abilities)。

## 返回值与错误

服务 API 返回的 Java record 一律使用 Java accessor，例如 `result.committed()`，而非假设存在 JavaScript 字段。失败通常不会抛出：请检查 `failure()`、`committed()`、`advanced()`、`applied()` 等返回值。只有 API 参数非法、标识符非法、JSON 无法被对应 Codec 解码，或对错误事件阶段调用可变 setter 时才会抛异常。

只在服务端才有意义的操作遇到客户端脚本时都不会改动玩家或世界：`MxtCosts.consume` 与 `MxtTriggers.subscribe` / `subscribeOnce` 会记录一次警告并返回 `false`；`MxtAbilities`、`MxtCultivation`、`MxtCurses`、`MxtSouls`、`MxtElements.attach`、`MxtSpiritRoots`、`MxtPhysiques` 与 `MxtQuality` 的改变状态方法，以及 `MxtTriggers.publish` 直接返回 `false`（`MxtElements.attach` 返回 `0`），或把结果里的 `failure()` / `failure` 置为 `SERVER_ONLY`，不写日志。唯一的例外是 `MxtAura.addBox`：它在客户端会抛 `IllegalArgumentException`（只接受 `ServerLevel`）。

`MxtActions.execute*` 故意不设该保护，因为内置 Action 自己决定作用端：JSON 里声明了客户端执行的 Action（例如带 `client` 标志的速度 Action）本来就应当就地运行。

## 相关

- [KubeJS 总览](/kubejs/index) —— 什么时候需要脚本、怎么注册内容。
- [物品与绑定](/kubejs/items) —— 把脚本注册的物品接到绑定表上。
- [综合示例](/kubejs/examples) —— 把几个对象组合起来用的完整脚本。
- 用脚本注册物品的完整教程：[用 KubeJS 创建物品](/tutorial/create-items-with-kubejs)。
