---
title: 物品绑定与组件
---

# 物品绑定与组件

本体不造逻辑物品：物理物品由原版、内容模组或 KubeJS 注册，数据包只把玩法规则接到已有的物品 ID 上。这一页讲这两条路——绑定表，以及逐件附加的数据组件。

## 物品绑定

| 表 | 用途 |
| --- | --- |
| `item_binding` | 给现有物品附加行为、条件、灵根或通用显示。 |
| `weapon_binding` | 给武器附加原版属性修正（攻击力与攻速也写在这里）与攻击/使用/Tick 行为。 |
| `pill` | 一份丹药的作用：食用行为、丹毒增量、过量阈值与过量后的残留。 |
| `pill_binding` | 把一族已有物品认成同一份丹药，并给出服用次数与冷却。 |
| `tool_binding` | 认领工具物品，并给出它们解锁的锻打方式。 |
| `blueprint_binding` | 认领图纸物品，并给出它们提供的锻造蓝图。 |
| `technique_binding` | 描述一门功法的**手册是哪几件物品**、本体替它生成载体时用哪个物品，以及学习前的条件。**哪一叠是手册、教的是哪门功法，先看堆上的物品组件 `mxt:technique`；没有组件时才看声明的 `items`。** |

`item_binding`、`weapon_binding`、`tool_binding`、`blueprint_binding` 与 `pill`、`pill_binding`、`technique_binding` 一样都是注册表：一份文件一条定义，文件在 `data/<命名空间>/mxt/<表>/<条目>.json`，条目用 `items` 认领物品（`pill` 不认领物品，认领它的是 `pill_binding`）。

各张认领表的 `items` 支持单个物品、原版物品标签、通配符、正则和混合数组；`carrier_item` 是例外，它只接受单个物品 id。`block_aura` 与 `heat_source` 的 `blocks` 只认方块 id 或 `#方块标签`，标签在加载期展开。`technique_binding` 的声明按功法 id 匹配，它的 `items` 是可选的那条路。

**逐件附加的内容走物品组件**：`mxt:quality`（单值，整份品质对象；档位与这一堆读的链一起换）、`mxt:element`（列表，与定义取并集）、`mxt:pill`（可选 `pill` 指名一份丹药定义，`on_consume` / `toxicity_gain` / `toxicity_threshold` / `on_overdose` / `toxicity_after_overdose` 再按字段覆盖）、`mxt:technique_reading`（按字段覆盖功法阅读参数）、`mxt:forging_methods` 与 `mxt:forging_blueprints`（列表，与定义取并集）——它们只写给这一堆。`conditions` 与武器的数值/动作**没有**组件：想逐件改就在对应的物品键注册表里加一条认领那件物品的定义，武器的属性数值则写原版 `minecraft:attribute_modifiers`。

## 数据组件示例

组件值可以直接在物品组件语法或 KubeJS 中写入，引用的数据包注册表 ID 会由原版注册表 Codec 解析：

```mcfunction
give @s mxt:contract_scroll[mxt:contract_scroll={contract_type:"mxt_test:master_servant"}]
give @s mxt:formation_plate[mxt:formation_plate={formation:"mxt_test:spirit_gathering"}]
give @s mxt:secret_realm_token[mxt:secret_realm_token={realm:"mxt_test:trial_realm"}]
give @s mxt:reward_box[mxt:reward_box="mxt_test:reward_box/spirit_stones"]
give @s mxt:rift_anchor[mxt:rift={recorded:{type:"position",dimension:"minecraft:overworld",pos:[0.5d,65.0d,0.5d]}}]
give @s mxt:spirit_vessel[mxt:resource_capacity={"mxt_test:qi":1000.0},mxt:resource_container={"mxt_test:qi":25.0}]
give @s mxt:talisman[mxt:talisman={talisman:"mxt_test:flame_sigil"}]
give @s mxt:physique[mxt:physique="mxt_test:sword_bone"]
give @s mxt:spirit_root[mxt:spirit_root="mxt_test:fire_root"]
give @s mxt:technique_book[mxt:technique="mxt_test:azure_water_manual"]
```

最后一行是**手册**的做法：堆上带 `mxt:technique` 组件时，这一叠才教那门功法；不带组件、也没有任何声明的 `items` 认领的功法书什么都不教、Tooltip 里也不显示功法。功法绑定（`technique_binding`）只决定**手册是哪几件物品、学它之前要过什么条件**，以及 `/picker mxt:technique` 替它生成的载体用哪个物品（**创造模式物品栏不生成载体**）；读多久、什么姿势写在[功法](/datapack/json/technique)自己身上。把物品写进声明的 `items` 也可以让那一叠不带组件就当手册，见[功法绑定](/datapack/json/technique_binding)。

倒数第二、第三行是**灵根物品**与**体质物品**的做法：组件里写定义 ID，右键即授予（灵根被拒的理由是"已持有 / 元素互斥"，体质是"已持有 / 条件不满足 / 互斥标签冲突"），成功消耗 1 个、**创造模式不消耗**，见 [spirit_root](/datapack/json/spirit_root#holding) 与 [physique](/datapack/json/physique#holding)。

注意 `mxt:resource_container` 与 `mxt:resource_capacity` 的值都是**裸 map**，键就是资源 ID，**没有** `values` 外壳；写错外壳会被当作一个无法解析的键**静默忽略**（只留一条 WARN 日志），表仍是空的。灵力容器**没写上限就什么都存不进**——数值本身没有天然上限，容量必须由 `mxt:resource_capacity` 写下来。

铭刻好的符箓还可以带上一部分灌注进度（`mxt:spirit_storage` 与灵石共用，按 aura 记已灌单位，缺省表示一点都没灌）：

```mcfunction
give @s mxt:talisman[mxt:talisman={talisman:"mxt_test:common_sigil"},mxt:spirit_storage={amounts:{"mxt:common":3}}]
```

阵盘也可以在游戏内绑定：主手持有阵盘时执行 `/mxt formation bind <formation>`（需要 gamemaster 权限）。绑定不再是取得可用阵盘的前提——**没绑定的阵盘右键时会自己认出脚下的阵法**（见 [未绑定的阵盘会自动识别](/datapack/json/formation)），命令与组件语法的用处变成了**限制**这块盘能立哪一座。组件语法要求先知道注册表 ID 和 NBT 结构，命令则由服务端做 Tab 补全并在 ID 不存在时拒绝。

契约卷轴、阵盘、秘境令牌和奖励箱没有绑定定义时会安全失败，并显示提示；灵兽袋、灵力容器和令牌的状态保存在 ItemStack 数据组件中，服务端是唯一权威。
