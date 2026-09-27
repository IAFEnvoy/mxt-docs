---
title: KubeJS 物品与绑定
description: 在 KubeJS 启动脚本里注册真实物品，再用物品、武器、丹药、工具、图纸与功法六张绑定表把 MiXianTu 的规则接到它身上。
---

# KubeJS 物品与绑定

MiXianTu 不注册任何物品。物品由 KubeJS 在启动脚本里注册，MiXianTu 通过绑定表把行为、条件、灵气、货币与 Tooltip 接到它**真实的物品 ID** 上。不要为它写 `mxt:item`、`mxt:pill` 或 `mxt:weapon` 文件：这几张注册表并不存在。

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

## 用绑定表接上规则

MiXianTu 负责行为、条件、灵气、货币与 Tooltip，绑定表则把一件已注册的物品接到这些规则上。每份文件放在 `kubejs/data/<命名空间>/mxt/<注册表>/` 下，六张表都只引用**已经由 KubeJS、原版或其他模组注册过**的物品：

| 绑定表 | 目录 | 接上什么 |
| --- | --- | --- |
| 物品绑定 | `mxt/item_binding/` | 任意物品的有序实体行为与 Tooltip 条件。 |
| 武器绑定 | `mxt/weapon_binding/` | 原版属性修正（攻击力与攻速也写在这里）、武器行为。 |
| 丹药绑定 | `mxt/pill_binding/` | 可食用物品的服用行为与丹毒。 |
| 工具绑定 | `mxt/tool_binding/` | 认领工具物品，并给出它们解锁的锻打方式。 |
| 图纸绑定 | `mxt/blueprint_binding/` | 认领图纸物品，并给出它们提供的锻造蓝图。 |
| 功法绑定 | `mxt/technique_binding/` | 一门功法**怎么读**：长按时长、姿势、音效、品质链与条件，以及本体为它生成的载体物品。手册的身份是堆上的 `mxt:technique` 组件，`items` 是可选的第二条路。 |

给一颗授予灵根的丹药做绑定：

```json
// kubejs/data/example/mxt/item_binding/fire_root_pellet.json
{
  "items": "kubejs:fire_root_pellet",
  "quality_chain": "example:pellet",
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
  "items": ["kubejs:firebound_sword", "#example:fire_weapons"],
  "attributes": [
    {"attribute": "minecraft:attack_damage", "id": "example:firebound_sword/damage", "amount": 8, "operation": "add_value"},
    {"attribute": "minecraft:attack_speed", "id": "example:firebound_sword/speed", "amount": -2.4, "operation": "add_value"}
  ],
  "quality_chain": "example:firebound_weapon"
}
```

给一颗丹药绑定丹毒：

```json
// kubejs/data/example/mxt/pill_binding/returning_pill.json
{
  "items": "kubejs:returning_pill",
  "quality_chain": "example:pill",
  "toxicity_gain": 10,
  "toxicity_threshold": 100,
  "toxicity_after_overdose": 25
}
```

给一门功法绑定它的载体物品：

```json
// kubejs/data/example/mxt/technique_binding/fire_manual.json
{
  "technique": "example:fire_manual",
  "carrier_item": "kubejs:fire_manual",
  "quality_chain": "example:manual"
}
```

前五张表都是**拿物品去匹配**的：`items` 接受物品 ID、物品标签或混合数组，所以一份文件能覆盖一整族物品（`tool_binding` / `blueprint_binding` 也一样，只是它们给出的分别是锻打方式与蓝图）。`technique_binding` 的声明按**功法 id** 匹配，而它的 `items` 是可选的第二条路：一叠物品之所以是某门功法的手册，**首先看它自己身上的 `mxt:technique` 组件**，没有组件时才看哪条声明的 `items` 认领了它——所以上面那件物品可以靠 `/picker mxt:technique` 给出的带组件载体，也可以直接把 id 写进声明的 `items`。`quality_chain` 是可选的、指向一条 [品质链条](/datapack/json/quality_chain) 的引用：链同时给出成员资格、默认档与升级路径。绑定里写了一个**不存在**的物品 ID 会让数据包加载失败，因此不会留下解析不出来的物品规则。各表的完整字段见 [物品绑定](/datapack/json/item_binding)、[武器绑定](/datapack/json/weapon_binding)、[丹药绑定](/datapack/json/pill_binding)、[工具绑定](/datapack/json/tool_binding)、[图纸绑定](/datapack/json/blueprint_binding) 与 [功法绑定](/datapack/json/technique_binding)。

## 重载

注册物品发生在启动阶段，需要重启游戏。MiXianTu 的绑定表是数据包注册表，Minecraft 在**世界加载**时读取它们，所以改绑定表要重新进世界，而不是 `/reload`。`/reload` 真正会刷新的是 KubeJS 的服务端脚本，因为 KubeJS 会清空全部回调并重新执行脚本：

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
- [用 KubeJS 创建物品](/tutorial/create-items-with-kubejs) —— 同样的材料，走一遍分步教程。
