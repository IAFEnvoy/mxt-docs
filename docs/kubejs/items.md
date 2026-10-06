---
title: KubeJS 物品与绑定
description: 在 KubeJS 启动脚本里注册真实物品，再用物品、武器、丹药、工具、图纸与功法六张表把 MiXianTu 的规则接到它身上。
---

# KubeJS 物品与绑定

MiXianTu 不注册任何物品。物品由 KubeJS 在启动脚本里注册，MiXianTu 通过这些表把行为、条件、灵气、货币与 Tooltip 接到它**真实的物品 ID** 上。不要为它写 `mxt:item` 或 `mxt:weapon` 文件：这两张注册表并不存在。`mxt:pill` 倒是三个不同的东西——一件内置载体物品、一个物品组件、以及一张注册表——三者都只写**丹药的作用**，见 [丹药](/datapack/json/pill)；它跟物品本身的注册无关。

## 注册物品

物品由 KubeJS 在启动脚本里注册：

```js
// kubejs/startup_scripts/mxt_items.js
StartupEvents.registry('item', event => {
  event.create('jade_token').displayName('玉令')
})
```

一段脚本可以顺手把食物与工具一起注册：

```js
// kubejs/startup_scripts/mxt_items.js
StartupEvents.registry('item', event => {
  event.create('fire_root_pellet')
    .displayName('火灵丹')
    .food(food => food.hunger(2).saturation(0.2))

  event.create('returning_pill')
    .displayName('回气丹')
    .food(food => food.hunger(1).saturation(0.1))

  event.create('firebound_sword', 'sword')
    .displayName('束火剑')
    .tier('diamond')
})
```

不带命名空间注册的物品属于 `kubejs`，因此 `event.create('jade_token')` 产出的是 `kubejs:jade_token`——所有绑定都要用这个 ID。

改启动脚本需要**重启游戏**：启动脚本在游戏注册物品之前运行，`/reload` 永远不会重跑它。

## 用注册表与绑定表接上规则

MiXianTu 负责行为、条件、灵气、货币与 Tooltip，这些表则把一件已注册的物品接到这些规则上。六张表都是**数据包注册表**：一份文件一条定义，放在 `kubejs/data/<命名空间>/mxt/<表>/<条目>.json` 下，条目按 `items` 认领物品。六张表都只引用**已经由 KubeJS、原版或其他模组注册过**的物品：

| 表 | 文件 | 接上什么 |
| --- | --- | --- |
| 物品绑定 | `mxt/item_binding/<条目>.json` | 任意物品的有序实体行为与 Tooltip 条件。 |
| 武器绑定 | `mxt/weapon_binding/<条目>.json` | 原版属性修正（攻击力与攻速也写在这里）、武器行为。 |
| 丹药绑定 | `mxt/pill_binding/<条目>.json` | 把这一族已注册物品认成同一份丹药，并给出服用次数与冷却；作用写在 [丹药](/datapack/json/pill) 里。 |
| 工具绑定 | `mxt/tool_binding/<条目>.json` | 认领工具物品，并给出它们解锁的锻打方式。 |
| 图纸绑定 | `mxt/blueprint_binding/<条目>.json` | 认领图纸物品，并给出它们提供的锻造蓝图。 |
| 功法绑定 | `mxt/technique_binding/<条目>.json` | 一门功法**怎么读**：长按时长、姿势、音效、品质链与条件，以及本体为它生成的载体物品。手册的身份是堆上的 `mxt:technique` 组件，`items` 是可选的第二条路。 |

给一颗授予灵根的丹药做绑定：

```json
// kubejs/data/example/mxt/item_binding/fire_root_pellet.json
{
  "items": "kubejs:fire_root_pellet",
  "actions": [
    {
      "type": "mxt:grant_spirit_root",
      "spirit_root": "example:fire_root"
    }
  ]
}
```

给一把武器绑定属性修正（攻击力与攻速也走这里）：

```json
// kubejs/data/example/mxt/weapon_binding/firebound_sword.json
{
  "items": "kubejs:firebound_sword",
  "attributes": [
    {"attribute": "minecraft:attack_damage", "id": "example:firebound_sword/damage", "amount": 8, "operation": "add_value"},
    {"attribute": "minecraft:attack_speed", "id": "example:firebound_sword/speed", "amount": -2.4, "operation": "add_value"}
  ]
}
```

给一颗丹药写一份作用，再把它认领到那件物品上：

```json
// kubejs/data/example/mxt/pill/returning_pill.json
{
  "toxicity_gain": 10,
  "toxicity_threshold": 100,
  "toxicity_after_overdose": 25
}
```

```json
// kubejs/data/example/mxt/pill_binding/returning_pill.json
{
  "items": "kubejs:returning_pill",
  "pill": "example:returning_pill",
  "max_uses": 3,
  "cooldown": 40
}
```

给一门功法绑定它的载体物品：

```json
// kubejs/data/example/mxt/technique_binding/fire_manual.json
{
  "technique": "example:fire_manual",
  "carrier_item": "kubejs:fire_manual"
}
```

六张表都是**注册表**，条目按 `items` 认领物品：`items` 里写物品 id、`#物品标签`，或带 `type` 的匹配条目，所以一条定义能覆盖一整族物品。`technique_binding` 的声明按**功法 id** 匹配，而它的 `items` 是可选的第二条路：一叠物品之所以是某门功法的手册，**首先看它自己身上的 `mxt:technique` 组件**，没有组件时才看哪条声明的 `items` 认领了它——所以上面那件物品可以靠 `/picker mxt:technique` 给出的带组件载体，也可以直接把 id 写进声明的 `items`。这些表都**不声明品质链**：链名写在 `quality` 条目自己身上（那一档的 `quality`），物品解析出的档位属于哪条链，它就落在哪条链上，见 [quality](/datapack/json/quality)。这几张表的 `items` 里写了一个**不存在的物品 ID** 会让数据包加载失败，因此不会留下解析不出来的物品规则。各表的完整字段见 [物品绑定](/datapack/json/item_binding)、[武器绑定](/datapack/json/weapon_binding)、[丹药](/datapack/json/pill)、[丹药绑定](/datapack/json/pill_binding)、[工具绑定](/datapack/json/tool_binding)、[图纸绑定](/datapack/json/blueprint_binding) 与 [功法绑定](/datapack/json/technique_binding)。

## 重载

注册物品发生在启动阶段，需要重启游戏。MiXianTu 的注册表都在**世界加载**时读取，所以改它们要重新进世界，而不是 `/reload`。`/reload` 真正会刷新的是 KubeJS 的服务端脚本，因为 KubeJS 会清空全部回调并重新执行脚本：

```js
// kubejs/server_scripts/mxt_reload_notice.js
ServerEvents.loaded(event => {
  console.log('MiXianTu 数据包已加载，使用 /mxt registries validate 检查注册表')
})
```

## 相关

- [KubeJS 总览](/kubejs/index) —— 这个桥接整体怎么用。
- [KubeJS API 参考](/kubejs/api-reference) —— 脚本对象、方法与事件。
- [综合示例](/kubejs/examples) —— 完整脚本。
- [KubeJS 创建物品并绑定行为](/tutorial/create-items-with-kubejs) —— 同样的材料，走一遍分步教程。
