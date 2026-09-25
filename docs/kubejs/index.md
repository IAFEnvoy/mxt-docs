---
title: KubeJS 开发
description: "MiXianTu 可选 KubeJS 桥接的总览：按领域一个全局对象、什么时候真的需要脚本、注册物品到接上绑定的最短路径，以及重载与重启的区别。"
---

# KubeJS 开发

KubeJS 适合注册具体物品、方块、配方和内容对象；MiXianTu 负责读取这些对象，并通过绑定表赋予它们行为、条件、灵气、货币与 Tooltip。不要在脚本里直接改服务端附件，也不要绕过 Cost 校验。

## 这个桥接给你什么

桥接是**可选**的，它**按领域一个全局对象**，而不是一个 `Mxt` 大对象：

| 全局对象 | 负责什么 |
| --- | --- |
| `MxtActions` | 注册 `mxt:js` Action 回调，或直接运行内置 Action。 |
| `MxtConditions` | 注册 `mxt:js` Condition 回调，或直接测试内置 Condition。 |
| `MxtValues` | 注册或计算 NumberProvider 与 ResourceValueProvider。 |
| `MxtCosts` | 预检或支付一个 `Cost`。 |
| `MxtResources` | 把一整份 `Cost` 数组当作一笔原子事务支付。 |
| `MxtAbilities` | 施放、授予、撤销与查询实体持有的技能。 |
| `MxtCultivation` | 增加修为、尝试境界突破。 |
| `MxtCurses` | 施加（可带时长）、释放、移除与查询诅咒。 |
| `MxtAura` | 查询、添加、移除服务端灵气区域。 |
| `MxtElements` | 读取实体身上的元素与元素附着，并施加附着。 |
| `MxtSpiritRoots` | 查询、授予、移除与开关灵根。 |
| `MxtPhysiques` | 查询、授予、移除与开关体质。 |
| `MxtQuality` | 读物品堆解析出的品质与所属链条，写覆盖组件或沿链条升一档。 |
| `MxtSouls` | 回收实体可转移的魂魄。 |
| `MxtTriggers` | 发布自定义触发器信号，并让脚本订阅信号。 |
| `MxtLoot` | 注册脚本战利品条件与战利品函数。 |
| `MxtEvents` | 所有 MXT 服务端生命周期事件。 |

每个对象一个页面，完整方法表、通用数据规则（NumberProvider、`mxt:js` 回调）与错误口径都在 [KubeJS API 参考](/kubejs/api-reference)。

所有会改动游戏状态的 API 都必须从 `kubejs/server_scripts/` 调用，并进入本体既有的服务端事务和事件流程；客户端脚本只应做只读的事。

## 什么时候需要 KubeJS

本体是框架而不是内容包：

- 数据包能定义规则，但**造不出**新物品、方块或配方。
- 要绑定的东西已经存在时——原版物品、其它模组的物品，或本体自带的物品——纯数据包 JSON 就够了，KubeJS 保持可选。
- 想要自己的物品、食物、工具或配方时，用 KubeJS 注册内容，再把这些真实物品 ID 绑到框架上。
- 脚本回调同样可选：条件、行为与数值提供者也能完全用数据包 JSON 搭配内置类型写出来。

## 最短路径

**一、** 在启动脚本里注册物品：

```js
// kubejs/startup_scripts/mxt_items.js
StartupEvents.registry('item', event => {
  event.create('fire_root_pellet')
    .displayName('火灵丹')
    .food(food => food.hunger(2).saturation(0.2))
})
```

**二、** 在数据包里用绑定表把规则接到它的真实 ID 上：

```json
// kubejs/data/example/mxt/item_binding/fire_root_pellet.json
{
  "items": "kubejs:fire_root_pellet",
  "actions": [
    { "type": "mxt:grant_spirit_root", "spirit_root": "example:fire_root" }
  ]
}
```

四张绑定表（物品、武器、丹药、功法）的字段与示例见 [物品与绑定](/kubejs/items)。

**三、**（可选）在服务端脚本里提供数据包要用的回调，然后在数据包字段里点名它：

```js
MxtActions.entity('example:heal', (entity, params, context) => {
  entity.heal(params.amount || 1)
})
```

```json
{ "type": "mxt:js", "id": "example:heal", "params": { "amount": 4 } }
```

**四、** 按下面的表决定怎么让改动生效。

## 重载与重启

| 改了什么 | 怎么生效 |
| --- | --- |
| 启动脚本（注册物品、方块、配方） | **重启游戏**；`/reload` 不会重跑启动脚本。 |
| 绑定表与其它数据包定义 | **重新加载世界**；它们是注册表，在世界加载时读取。 |
| 服务端脚本（回调、事件订阅） | `/reload` 会清空全部回调并重跑脚本，因此回调会重新注册；脚本自己挂的运行时订阅需要自己重新挂。 |

## 接下来

- [物品与绑定](/kubejs/items) —— 四张绑定表的字段与示例。
- [KubeJS API 参考](/kubejs/api-reference) —— 17 个全局对象，一个对象一个页面。
- [综合示例](/kubejs/examples) —— 把几个对象组合起来用的完整脚本。
- [用 KubeJS 创建物品](/tutorial/create-items-with-kubejs) —— 分步教程。
- [物品一览](/player-guide/items) —— 本体自己提供的物品。
