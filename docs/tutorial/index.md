---
title: 教程
description: "一步步搭建一个小型 MiXianTu 内容包：灵气与境界、灵气环境、KubeJS 物品与绑定，以及技能。"
---

# 教程

本站的参考页面一次只讲一个文件、一个字段或一个 API。这些教程正好相反：每一篇都从空数据包开始，最后得到能在游戏里看着它跑起来的东西，这样你在逐个查字段之前，先看清这些表是如何拼在一起的。

## 示例包

所有教程都在扩展同一个位于 `example` 命名空间下的小型内容包。前面四篇是一条线，每一篇都假定前面的页面已经完成；后面几篇各自独立，只用到这个包里已有的那几个定义。整组教程结束时，它长这样：

```text
data/example/
├── mxt/
│   ├── element/common.json                  Element named by the qi aura
│   ├── element/fire.json                    Element for the fire spirit root
│   ├── resource/qi.json                     The stored value
│   ├── aura/qi.json                         The aura the value carries, and its realm chain entry
│   ├── realm_stage/qi_condensation.json     Realm chain
│   ├── realm_stage/foundation.json
│   ├── realm_stage/core_formation.json
│   ├── cultivate_action/meditation.json     What the player does to absorb aura
│   ├── aura_zone/common_land.json           Where the aura is
│   ├── aura_zone/misty_valley.json          A denser zone (aura environment tutorial)
│   ├── block_aura/spirit_stone_ore.json     Blocks that emit aura
│   ├── item_aura/spirit_stone.json          Items that act as cultivation fuel
│   ├── spirit_root/fire_root.json           Granted by a pill
│   ├── technique/azure_breath.json
│   ├── ability/qi_bolt.json                 An active ability
│   ├── ability/qi_recovery.json             A triggered ability
│   ├── ability/spark.json                   An ability a talisman inscribes
│   ├── talisman/flame_sigil.json            The talisman: abilities + aura bill
│   ├── formation/spirit_gathering_array.json Structure, upkeep, buff module
│   ├── formation/ward_array.json            Protection + attack modules
│   ├── secret_realm/trial_realm.json      A pocket world template
│   ├── tribulation/heavenly_gate.json       The trial a breakthrough starts
│   ├── forging_method/light_strike.json     One strike: meter shift, cost, cooldown
│   ├── forging_method/heavy_strike.json
│   ├── tool_binding/smith_hammer.json       Which methods a placed tool unlocks
│   ├── forging_blueprint/spirit_sword.json  Materials, target band, quality ladder
│   ├── blueprint_binding/sword_manual.json  Which blueprint the item offers
│   ├── quality/common.json             Quality tiers
│   ├── quality/refined.json
│   ├── quality/flawless.json
│   ├── quality_chain/pill.json              A tier ladder: order, default tier, step costs
│   ├── quality_chain/weapon.json
│   ├── item_binding/qi_pill.json            Bindings attach rules to real items
│   ├── item_binding/root_pellet.json
│   ├── pill_binding/qi_pill.json
│   ├── weapon_binding/spirit_sword.json
│   └── technique_binding/azure_manual.json
└── (kubejs/startup_scripts/mxt_items.js)    The items themselves, registered by KubeJS
```

## 教程列表

| 教程 | 你会搭建 | 什么时候读 |
| --- | --- | --- |
| [定义灵气与境界](./define-aura-and-realms.md) | 一个元素、一个灵气数值、一条线性境界链、一个修炼行为和一个最小的灵气区域——核心修炼循环。 | 你想让玩家能够修炼并突破。 |
| [搭建灵气环境](./aura-environment.md) | 分层灵气区域、方块灵气、物品燃料、噪声、波动、雾效和 HUD 条。 | 基础循环已经跑通，你想让世界参与进来。 |
| [用 KubeJS 创建物品并绑定它们](./create-items-with-kubejs.md) | 由脚本注册的真实物品，加上四张绑定表、品质层级，以及让它们有玩法意义的配方。 | 你需要自己的丹药、武器或手册。 |
| [添加技能](./add-an-ability.md) | 一个主动技能、一个触发技能，以及授予它们的方式。 | 你想给玩家一个花灵气的地方。 |
| [定义一个阵法](./define-a-formation.md) | 一座按结构激活、每周期收维持费的阵法：增益、灵气域、攻击与守御模块，以及阵盘。 | 你想让玩家搭出会运转的东西。 |
| [开一个秘境](./open-a-realm.md) | 一份能开出独立实例维度的秘境模板：生成、边界、落点、认领与时限。 | 你想要一次性或可认领的小世界。 |
| [刻一张符箓](./inscribe-a-talisman.md) | 把技能铭刻到载体上、灌注灵气、右键发动，以及手持与展示架的两套规则。 | 你想让法术能被"带在身上"。 |
| [让突破引来天劫](./bring-down-a-tribulation.md) | 一条突破时启动的天劫时间线：前摇、节拍、带颜色的雷击与成败结果。 | 你想让突破有风险。 |
| [锻造一件法器](./forge-a-treasure.md) | 一条能跑通的锻造产线：手法、工具绑定、图纸物品，以及锻打条、目标区间、收尾模式、品质阶梯与失败结算。 | 你想让玩家把东西"打"出来，而不是合成出来。 |
| [炼制一枚丹药](./refine-a-pill.md) | 占位页：炼丹的数据格式已经定稿，但工作台还没接线；这里先列清已有的部件与缺掉的入口。 | 你想做丹药，想知道今天能走到哪一步。 |

## 约定

- **命名空间。** 所有示例都使用 `example`。把它改成你自己整合包或内容包的 ID，并保持文件的 ID 与它们之间的引用同步。
- **文件位置。** 数据包文件放在 `data/<namespace>/mxt/<registry>/<path>.json` 下；标签放在 `data/<namespace>/tags/...` 下。内容一多就按类别分进子文件夹（目录是 ID 的一部分），写法见[数据包开发总览](../datapack/overview.md)。完整列表见 [动态注册表](../datapack/json/index.md)。
- **生效方式。** MiXianTu 的数据表是原版数据包注册表，Minecraft 在**世界加载时**读取它们，所以 `/reload` 不会重新读取。修改数据包文件后，请退回标题界面重新打开世界（或重启服务器）。`/reload` 只会刷新配方、战利品表、进度、函数和 KubeJS 服务端脚本。用 KubeJS 注册新物品或方块同样需要重启游戏。
- **坏文件会挡住世界。** 没有上一份快照可以退回：只要有定义解码失败，世界就会一直加载不了，直到该文件被修好。日志会给出文件名和 Codec 错误，所以要留一份正在编辑的文件的最后可用副本。
- **校验。** `/mxt registries validate` 报告注册表数量、条目总数以及校验是否通过，`/mxt registries list` 打印每个注册表 ID 及其条目数量。其余命令列在[命令](../player-guide/commands.md)里。
- **版本。** 这些页面跟随模组的**当前开发版本**（不在文档里写死版本号，以你装的那份 Jar 为准），版本仍在开发中、数据包格式尚未冻结；字段变化时，参考页面也会随之更新。

## 接下来读什么

- [数据包开发总览](../datapack/overview.md) —— 文件位置、ID、Holder 引用、停用标签与错误报告，如果你还没读过。
- [数据包示例](../datapack/examples.md) —— 同样的形状，写成短小独立的片段。
- [KubeJS API 参考](../kubejs/api-reference.md) —— 第三篇教程里用到的脚本对象。
