---
title: 教程
description: "一步步搭建一个小型 MiXianTu 内容包：灵气与境界、灵气环境、物品与绑定、技能、阵法、秘境、符箓、天劫、锻造与炼丹。"
---

# 教程

本站的参考页面一次只讲一个文件、一个字段或一个 API。这些教程的写法相反：每一篇都从空数据包开始，做到能在游戏里看见结果，这样在逐个查字段之前，先把这些表如何拼在一起看清楚。

## 示例包

所有教程都在扩展同一个位于 `example` 命名空间下的小型内容包。前面几篇是一条线，每一篇都假定它依赖的页面已经完成（双修那篇挂在第二篇后面，只用到同一个包里已有的定义）；后面几篇各自独立，只用到这个包里已有的那几个定义。整组教程结束时，它长这样：

```text
data/example/
├── mxt/
│   ├── element/common.json                  Element named by the qi aura
│   ├── element/fire.json                    Element for the fire spirit root
│   ├── resource/qi.json                     The stored value
│   ├── resource/azure_mastery.json          Mastery of a technique, a plain value
│   ├── aura/qi.json                         The aura the value carries, and its realm chain entry
│   ├── realm_stage/qi_condensation.json     Realm chain
│   ├── realm_stage/foundation.json
│   ├── realm_stage/core_formation.json
│   ├── cultivation/meditation.json     What the player does to absorb aura
│   ├── cultivation/dual_meditation.json  Only yields beside a friend holding a manual
│   ├── aura_zone/common_land.json           Where the aura is
│   ├── aura_zone/misty_valley.json          A denser zone (aura environment tutorial)
│   ├── block_aura/spirit_stone_ore.json     Blocks that emit aura
│   ├── item_aura/spirit_stone.json          Items that act as cultivation fuel
│   ├── spirit_root/fire_root.json           Granted by a pill
│   ├── spirit_root/fire_common_root.json    Two elements with shares (spirit root tutorial)
│   ├── physique/sword_bone.json             Attributes, exclusion tags, damage multipliers
│   ├── progression/azure_breath_1.json      The technique's mastery chain
│   ├── progression/azure_breath_2.json
│   ├── progression/azure_breath_3.json
│   ├── technique/azure_breath.json
│   ├── ability/qi_bolt.json                 An active ability
│   ├── ability/qi_recovery.json             A triggered ability
│   ├── ability/spark.json                   An ability a talisman inscribes
│   ├── ability/blade_storage.json           A storage ability: slots and cooldown
│   ├── artifact/blade_sheath.json           Claims an item and hangs the storage ability on it
│   ├── ability/azure_sword_mount.json       The vehicle: speed, seats, fuel, looks
│   ├── ability/azure_sword_flight.json      The flying skill: which hand, and its own price
│   ├── artifact/azure_sword.json            Claims the sword and declares the vehicle on it
│   ├── curse/qi_backlash.json               A timed curse: on_apply, per-tick, stacking
│   ├── talisman/flame_sigil.json            The talisman: abilities + capacity + costs
│   ├── formation/spirit_gathering_array.json Structure, upkeep, buff module
│   ├── formation/ward_array.json            Protection + attack modules
│   ├── secret_realm/trial_realm.json      A pocket world template
│   ├── tribulation/heavenly_gate.json       The trial a breakthrough starts
│   ├── forging_method/light_strike.json     One strike: meter shift, cost, cooldown
│   ├── forging_method/heavy_strike.json
│   ├── tool_binding/smith_hammer.json       Claims the hammer; lists its methods
│   ├── forging_blueprint/spirit_sword.json  Materials, target band, quality ladder
│   ├── blueprint_binding/sword_manual.json  Claims the manual; lists its blueprint
│   ├── quality/common.json             Quality tiers: chain identity, next tier, step cost
│   ├── quality/refined.json
│   ├── quality/flawless.json
│   ├── item_binding/qi_pill.json            Bindings attach rules to real items
│   ├── item_binding/root_pellet.json
│   ├── pill/qi_pill.json                   What the pill does: dose action, toxicity, overdose
│   ├── pill_binding/qi_pill.json            Which items are that pill, and their cap and cooldown
│   ├── weapon_binding/spirit_sword.json
│   ├── technique_binding/azure_manual.json
│   ├── trigger/azure_mastery_from_kill.json  A kill raises mastery
│   └── contract_type/spirit_familiar.json   Conditions, costs and caps for one beast
├── tags/entity_type/contract/spirit_familiar.json  Narrows which entities it accepts
└── (kubejs/startup_scripts/mxt_items.js)    The items themselves, registered by KubeJS
```

## 教程列表

| 教程 | 你会搭建 | 什么时候读 |
| --- | --- | --- |
| [定义灵气与境界](./define-aura-and-realms.md) | 一个元素、一个灵气数值、一条线性境界链、一个修炼行为和一个最小的灵气区域——核心修炼循环。 | 需要让玩家能够修炼并突破时。 |
| [编写双修功法](./dual-cultivation.md) | 一条只有身边有人时才出成果的修炼法门：判据怎么拼、两个人各自怎么进得去、对方走开时停不停。 | 基础循环已经跑通，想让"两个人一起修"成为一条规则时。 |
| [定义灵气环境](./aura-environment.md) | 分层灵气区域、方块灵气、物品燃料、噪声、波动、雾效和 HUD 条。 | 基础循环已经跑通，想让世界参与进来时。 |
| [定义灵根与体质](./define-spirit-roots-and-physiques.md) | 一条带元素占比的灵根、一条只在特定灵根下授予的体质，以及持有与生效的区别。 | 想让身体本身决定修炼倍率与伤害倍率时。 |
| [KubeJS 创建物品并绑定行为](./create-items-with-kubejs.md) | 由脚本注册的真实物品，加上四张绑定表，以及让它们有玩法意义的配方。 | 需要自己的丹药、武器或手册时。 |
| [KubeJS 绑定行为](./bind-actions.md) | 四张绑定表各自的钩子：什么时候执行、受什么限制、条件与先后怎么算。 | 物品已经能用了，想精确控制它什么时候做什么时。 |
| [定义品质链](./define-a-quality-chain.md) | 一条三档品质阶梯：链名写在哪、升级的代价写在哪、怎么给物品定档。 | 想让同一件物品有高低之分时。 |
| [定义技能](./add-an-ability.md) | 一个主动技能、一个触发技能，以及授予它们的方式。 | 想给玩家一个花灵气的地方时。 |
| [定义功法与晋级](./define-a-technique.md) | 一条三级进度链、衡量熟练度的数值，以及让熟练度涨起来的几条路。 | 技能已经能授予，想让功法随使用往上爬时。 |
| [定义阵法](./define-a-formation.md) | 一座按结构激活、每周期收维持费的阵法：增益、灵气域、攻击与守御模块，以及阵盘。 | 想让玩家搭出会运转的东西时。 |
| [定义秘境](./open-a-realm.md) | 一份能开出独立实例维度的秘境模板：生成、边界、落点、认领与时限。 | 想要一次性或可认领的小世界时。 |
| [定义符箓](./inscribe-a-talisman.md) | 把技能铭刻到载体上、灌注灵气、右键发动，以及手持与展示架的两套规则。 | 想让法术能被带在身上时。 |
| [定义天劫](./bring-down-a-tribulation.md) | 一条突破时启动的天劫时间线：前摇、节拍、带颜色的雷击与成败结果。 | 想让突破有风险时。 |
| [定义诅咒](./define-a-curse.md) | 一条按时间或信号发作、可以叠层、可以解毒的诅咒。 | 想给玩家一个会持续发作的状态时。 |
| [锻造法器](./forge-a-treasure.md) | 一条能跑通的锻造产线：手法、工具绑定、图纸物品，以及锻打条、目标区间、收尾模式、品质阶梯与失败结算。 | 想让玩家把东西"打"出来，而不是合成出来时。 |
| [炼制丹药](./refine-a-pill.md) | 手搭一座 3×3×3 部件丹炉，写一条按药性判定的丹方，用异火把炉温升到目标区间并收下成品。 | 想自己造丹药、灵田与异火时。 |
| [契约灵兽](./contract-a-beast.md) | 一份契约类型：谁签得了、代价多少、两个上限、几条命令，以及召回与灵兽袋。 | 想把别的模组的兽收成自己的时。 |
| [储物与灵器](./storage-and-spirit-vessels.md) | 灵力容器那件东西的形状与边界，以及挂在它下面的两篇子教程。 | 想让物品能装东西、或者想让它能飞时。 |
| [储物](./storage.md) | 一条挂在物品上的储物技能：格数怎么算、箱子存在哪、怎么预填。 | 想让物品能装东西时。 |
| [飞行法器](./flying-mount.md) | 一件会飞的物品：载具定义、御器之术、起剑落地与灵气燃料的两笔账。 | 想让玩家御剑飞行时。 |
| [裂隙](./rifts.md) | 用方块与命令架起会传送的裂隙：目标维度、颜色、连通与落点。 | 想在维度之间开一条自己的路时。 |

## 约定

- **命名空间。** 所有示例都使用 `example`。把它改成你自己整合包或内容包的 ID，并保持文件的 ID 与它们之间的引用同步。
- **文件位置。** 数据包文件放在 `data/<namespace>/mxt/<registry>/<path>.json` 下；标签放在 `data/<namespace>/tags/...` 下。内容一多就按类别分进子文件夹（目录是 ID 的一部分），写法见[数据包开发总览](../datapack/overview.md)。完整列表见 [动态注册表](../datapack/json/index.md)。
- **生效方式。** MiXianTu 的数据表是原版数据包注册表，Minecraft 在**世界加载时**读取它们，所以 `/reload` 不会重新读取。修改数据包文件后，请退回标题界面重新打开世界（或重启服务器）。`/reload` 只会刷新配方、战利品表、进度、函数和 KubeJS 服务端脚本。用 KubeJS 注册新物品或方块同样需要重启游戏。
- **坏文件会挡住世界。** 没有上一份快照可以退回：只要有定义解码失败，世界就会一直加载不了，直到该文件被修好。日志会给出文件名和 Codec 错误，所以要留一份正在编辑的文件的最后可用副本。
- **校验。** `/mxt registries validate` 报告注册表数量、条目总数以及校验是否通过，`/mxt registries list` 打印每个注册表 ID 及其条目数量。两条命令都只覆盖一部分注册表，各自的适用范围写在对应教程的验证一节里。其余命令列在[命令](../player-guide/commands.md)里。
- **版本。** 这些页面跟随模组的**当前开发版本**（不在文档里写死版本号，以你装的那份 Jar 为准），版本仍在开发中、数据包格式尚未冻结；字段变化时，参考页面也会随之更新。

## 延伸阅读

- [数据包开发总览](../datapack/overview.md) —— 文件位置、ID、Holder 引用、加载期条件与错误报告，如果你还没读过。
- [数据包示例](../datapack/examples.md) —— 同样的形状，写成短小独立的片段。
- [KubeJS API 参考](../kubejs/api-reference.md) —— 物品那两篇里用到的脚本对象。
