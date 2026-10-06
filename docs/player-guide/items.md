---
title: 内置物品与组件
---

# 内置物品与组件

MiXianTu 不为每个玩法预设具体数值，但提供少量通用承载物品和组件。数据驱动物品玩法通常通过绑定表或物品键注册表挂到现有物品上。

## 通用物品

当前内置内容包括灵石系列、灵铁锭、灵木、朱砂、符纸、符箓、契约卷轴、召回符、御兽铃、令牌、灵石袋、戒指、锻造台、丹炉部件、灵田、丹药载体、药渣、杂质、秘境奖励箱和展示架等。具体注册名以 `src/main/java/com/iafenvoy/mxt/registry` 和资源文件为准。

## 物品绑定

| 表 | 用途 |
| --- | --- |
| `item_binding` | 给现有物品附加行为、条件、灵根或通用显示。 |
| `weapon_binding` | 给武器附加原版属性修正（攻击力与攻速也写在这里）与攻击/使用/Tick 行为。 |
| `pill` | 一份丹药的作用：食用行为、丹毒增量、过量阈值与过量后的残留。 |
| `pill_binding` | 把一族已有物品认成同一份丹药，并给出服用次数与冷却。 |
| `tool_binding` | 认领工具物品，并给出它们解锁的锻打方式。 |
| `blueprint_binding` | 认领图纸物品，并给出它们提供的锻造蓝图。 |
| `technique_binding` | 描述一门功法**怎么被读**——长按时长、姿势、音效、品质链与条件，以及本体替它生成载体时用哪个物品。**哪一叠是手册、教的是哪门功法，先看堆上的物品组件 `mxt:technique`；没有组件时才看声明的 `items`。** |

`item_binding`、`weapon_binding`、`tool_binding`、`blueprint_binding` 与 `pill`、`pill_binding`、`technique_binding` 一样都是注册表：一份文件一条定义，文件在 `data/<命名空间>/mxt/<表>/<条目>.json`，条目用 `items` 认领物品（`pill` 不认领物品，认领它的是 `pill_binding`）。

各张认领表的 `items` 支持单个物品、原版物品标签、通配符、正则和混合数组；`carrier_item` 是例外，它只接受单个物品 id。`block_aura` 与 `heat_source` 的 `blocks` 只认方块 id 或 `#方块标签`，标签在加载期展开。`technique_binding` 的声明按功法 id 匹配，它的 `items` 是可选的那条路。

**逐件附加的内容走物品组件**：`mxt:quality`（单值，整份品质对象；档位与这一堆读的链一起换）、`mxt:element`（列表，与定义取并集）、`mxt:pill`（可选 `pill` 指名一份丹药定义，`on_consume` / `toxicity_gain` / `toxicity_threshold` / `on_overdose` / `toxicity_after_overdose` 再按字段覆盖）、`mxt:technique_reading`（按字段覆盖功法阅读参数）、`mxt:forging_methods` 与 `mxt:forging_blueprints`（列表，与定义取并集）——它们只写给这一堆。`conditions` 与武器的数值/动作**没有**组件：想逐件改就在对应的物品键注册表里加一条认领那件物品的定义，武器的属性数值则写原版 `minecraft:attribute_modifiers`。

## 灵气物品

`item_aura` 注册表给一件物品可释放的灵气容量、消耗速度、完成行为和可选 `result_stack`。修炼时会整组取出物品，容量、消耗速度和释放速度均按堆叠数量叠加，因此总消耗时间不变。物品剩余灵气保存在 `item_aura` 组件中，容量始终由数据包动态计算。

MiXianTu 是框架模组。本体只提供可被多个系统复用、没有固定流派或数值玩法的物品；具体武器、丹药、灵草、符纸、阵旗、法宝、契约物和储物道具应由数据包或 KubeJS 注册并通过绑定表或物品键注册表接入。

| 物品 | ID | 默认货币值 | 框架定位 |
| --- | --- | ---: | --- |
| 下品灵石 | `mxt:spirit_stone` | 1 | 基础灵气媒介与交易单位。 |
| 中品灵石 | `mxt:medium_spirit_stone` | 10 | 压缩的基础灵石。 |
| 上品灵石 | `mxt:high_spirit_stone` | 100 | 高阶交易与高消耗系统的默认媒介。 |
| 极品灵石 | `mxt:supreme_spirit_stone` | 1000 | 稀有的高价值媒介。 |
| 支票 | `mxt:cheque` | 由物品组件决定 | 现有交易系统的可签发价值载体。 |

四种灵石共享 `SpiritStoneItem` 基类，实现灵气充入和抽取。容量不在代码中定义，而是取 `item_aura` 注册表给这件物品的 `aura`；装的是**哪种**灵气则记在物品自己身上——与符箓共用的存储组件 `mxt:spirit_storage` 把数量记在灵气键下（`{amounts:{"mxt:common":100}}`），所以数据包事后改掉 `item_aura` 的 `type` 时，世界里已有的灵石不会被悄悄改写成另一种灵气（它只会与新 `type` 对不上，因而装不进也烧不出）。未携带该组件的灵石视为满充，灵气类型按定义读；空 map（或没写下那种灵气）表示空充。重新加载世界后，首次真实存取会将超上限旧值截断。灵石一次只装一种灵气、容量也就是 `aura` 那一个数，所以它读的是存储里**唯一**的那条记录。展示台接收灵力时会尝试为其展示的灵石充能，修炼燃料耗尽时则会将同一枚灵石抽空后归还。默认 `currency` 数据包只定义 10:1 双向兑换和值；内容方可直接覆写这些值，或在 `item_binding`、阵法、法宝、修炼和交易定义中引用任意一种灵石。

## 空白载体与固定材料

以下物品同样都是普通 `Item`，没有本体行为；它们的用途由绑定表、物品键注册表、组件、数据包和 KubeJS 决定。方块与已经存在的四阶灵石不在此表重复列出。

| 分类 | 物品 |
| --- | --- |
| 基础材料 | `mxt:spirit_iron_ingot`、`mxt:spirit_iron_nugget`、`mxt:spirit_wood`、`mxt:spirit_wood_core`、`mxt:cinnabar`、`mxt:alchemy_dregs`、`mxt:impurity` |
| 空白载体 | `mxt:spirit_ring`、`mxt:spirit_stone_bag` |
| 身份与记录 | `mxt:wooden_token`、`mxt:stone_token`、`mxt:cultivation_jade_slip`、`mxt:blank_talisman` |
| 固定道具 | `mxt:contract_scroll`、`mxt:recall_talisman`、`mxt:beast_taming_bell`、`mxt:secret_realm_reward_box` |

## 统一功能载体

以下物品由本体提供统一服务端实现。物品只保存数据包 Holder 或持久化状态，不复制对应模块的规则；具体契约、阵法、秘境和资源数值仍由数据包定义。

| 物品 | ID | 持久化组件 | 统一行为 |
| --- | --- | --- | --- |
| 契约卷轴 | `mxt:contract_scroll` | `mxt:contract_scroll` | 保存 `contract_type`，对生物使用时由 `ContractService` 校验并签订契约。 |
| 御兽铃 | `mxt:beast_taming_bell` | `mxt:contract_bell` | 保存"对准的那只灵宠"（UUID、显示名、它认的行为）。右键灵宠＝对准它，右键空处＝打开轮盘「契约灵兽」那一页，点一格给这只灵宠下跟随 / 游荡 / 驻守 / 召回的命令。 |
| 灵兽袋 | `mxt:spirit_beast_bag` | `mxt:spirit_beast` | 保存一只已契约生物的完整持久化实体数据（契约与档案附件也在里面），另外记着它的类型、当时的名字、契约类型与主人——这几项让提示框不必加载实体就能说清袋里是谁。对灵宠右键收纳，**对着方块右键在方块上方放出**。 |
| 阵盘 | `mxt:formation_plate` | `mxt:formation_plate` | 保存 `allowed`（允许激活哪些阵法，支持 `#标签`）与 `formation`（当前选中）；对方块使用时调用 `FormationWorldService`。没绑定阵法时会**自动识别**脚下这座阵法。 |
| 秘境令牌 | `mxt:secret_realm_token` | `mxt:secret_realm_token` | 保存一份 `secret_realm` 定义；右键进入绑定秘境（走定义自己的进入条件、实例上限与在场人数上限），在秘境内右键返回原位置（受定义的退出条件约束）。 |
| 裂隙（方块物品） | `mxt:rift` | `mxt:rift` | 摆放裂隙方块；堆叠上带组件时按组件里的目标与颜色摆。整套机制见[裂隙](./rift.md)。 |
| 灵力容器 | `mxt:spirit_vessel` | `mxt:resource_container` | 保存任意 `resource`；右键释放给持有者，潜行右键从持有者存入，每种资源容量为 1000。 |
| 木/石令牌 | `mxt:wooden_token`、`mxt:stone_token` | `mxt:token` | 统一承载 `kind`、`value`、`owner`，供秘境和交易等权限系统共用。 |
| 鉴定镜 | `mxt:identification_mirror` | 消费 `mxt:identification` | 统一解析带有鉴定组件的物品；具体待鉴定物品由内容包或其他模组提供。 |
| 灵根 | `mxt:spirit_root` | `mxt:spirit_root` | 保存一份 `spirit_root` 定义；右键获得这条灵根（"已持有"与元素互斥照旧被拒，见 [spirit_root](/datapack/json/spirit_root#holding)），授予成功时消耗 1 个，**创造模式不消耗**。 |
| 体质 | `mxt:physique` | `mxt:physique` | 保存一份 `physique` 定义；右键获得这项体质（"已持有"、`holder_condition` 不满足与互斥标签冲突照旧被拒，见 [physique](/datapack/json/physique#holding)），授予成功时消耗 1 个，**创造模式不消耗**。 |
| 符笔 | `mxt:talisman_brush` | `mxt:brush_pigment` | 符笔装自己的颜料存量，加料是原版储物袋那套点击（提着符笔点一下颜料就蘸）。颜料就是物品标签 `#mxt:brush_pigment` 里的物品，主资源包里只有朱砂 `mxt:cinnabar`；一份颜料给多少由服务端配置说了算（见[符笔与颜料](#符笔与颜料)）。 |
| 符箓 | `mxt:talisman` | `mxt:talisman` + `mxt:spirit_storage` | 保存**已铭刻的符箓**：一个按追加顺序排列的 `talisman` 定义条目列表，加上一个模式字段 `mode`（`"fire"` 缺省／`"store"`），空列表就是刚做出来的空载体。手持按住右键灌注灵气（容量 = 一次发动的灵气用量 × 铭刻定义的 `capacity` 倍率，实际倍率还要跟载体剩余使用次数取小，按灵气分别计量），灌满那一刻铭刻的能力全部发动并消耗一件本体（`store` 模式除外：它只积累，不自动发动）。存量够付清一次发动的灵气条目时，**右键即发动**——写了 `durability` / `consume` 再配大倍率，就能灌满一次连打好几次（见 [灌注与激发](/datapack/json/talisman)）。**潜行 + 右键切换模式**，`store` 且已灌满时潜行使用不切换而是**直接发动**。摆在展示架上被填满时按模式处理，并以展示架的位置作为激发地点——公式与位置类行为都用它（见 [灌注与激发](/datapack/json/talisman)）。铭刻（写符）服务尚未接入，`mxt:talisman` 组件目前可以手写或用物品组件语法直接写入（`/talisman give` 也能发）；灌注进度与灵石共用同一个存储组件 `mxt:spirit_storage`（按灵气记已灌单位，缺省表示一点都没灌）。**徒手右键与灌满自动发动走同一个入口**，但两条规则各按"在哪"分：**冷却只是手上的闸门**（服务端配置「符箓 → 使用冷却」，默认 20 刻、0 关闭），一次**尝试**就进冷却，窗口内长按灌注不会发动、那一 tick 的灵气也不会被灌进去；**消耗则按位置分**——手上一次发动消耗一件本体（**创造模式不消耗**），摆在展示架上的**永远消耗**、且不查也不记冷却。两条规则都由 `SpiritSource.consumedByHand()` 区分。**铭刻的定义可以声明耐久**（`durability` / `consume`）：上限写进原版组件（`max_damage` 加 `max_stack_size: 1` 与 `damage: 0`，物品上就有耐久条），每次发动改成扣耐久、扣满那一次销毁载体；没声明耐久的载体照旧一次一张本体。 |

## 炼丹与灵植

丹炉不是一件方块：它是一座手搭的固定 3×3×3。核心带炉型规格，两个投料仓分放主药与辅药药引，产物仓只负责出货，其余 18 格砌成炉壁（底层只放四角）。

| 方块 | ID | 用途 |
| --- | --- | --- |
| 丹炉核心 | `mxt:alchemy_furnace` | 正面中层那一块。炉温读数与「设定 / 开炉 / 终止」在这块打开的页面上。 |
| 主药投料仓 | `mxt:alchemy_main_input` | 面向正面时在左侧，两个主药格。 |
| 辅药投料仓 | `mxt:alchemy_auxiliary_input` | 面向正面时在右侧，两个辅药格加一个药引格。 |
| 丹炉产物仓 | `mxt:alchemy_output` | 顶部中心，四个输出格，只能取出。 |
| 丹炉炉壁 | `mxt:alchemy_furnace_casing` | 底层四角与上面两层，共 18 格，每块带自己的炉壁材料；炉壁不打开界面。 |
| 灵田 | `mxt:spirit_herb_plot` | 一格一株：持种苗右键种下，成熟后右键采收，潜行空手拔回种苗。 |
| 丹药 | `mxt:pill` | 丹药载体，提供原版食用、名字与 Tooltip；吃下去做什么写在 [pill](../datapack/json/pill.md) 上，服用次数与冷却由 [pill_binding](../datapack/json/pill_binding.md) 给。 |

手感是：**供热方块放进底层正中央那一格，主药放左侧仓，辅药与药引放右侧仓，成品从产物仓取。** 放进材料不会自己开炉，要玩家在核心那一页点「开炉」。壳不齐、炉壁材料无效、格子被另一座炉占了，都不算成型，也就开不了炉。

**本体不提供热源方块**：供热方块的数值写在注册表 [`mxt:heat_source`](../datapack/json/heat_source.md) 里（方块也可以自己实现接口），本体没有默认值。炉温上限是三者取最低：炉型规格自己可选的 `max_temperature`、整炉里最低的那块炉壁耐温、供热方块给出的最高温；所以换一款把 `max_temperature` 写大的高炉阶规格能把这个上限抬高，但抬不过炉壁与供热。

供热方块的物品提示框以「供热方块」起头，写出它的两个数——一行「可提供的最高炉温」、一行「升温速度」。方块自己实现供热接口时提示框不写数字，只说可提供的热量由方块自身状态决定。丹炉核心那一件的提示框列主药 / 辅药 / 药引三档格数与容量，炉型规格写了 `max_temperature` 时再多一行「炉型上限」；`3×3×3` 与供热格那两行搭建说明收在 Shift 后面，不按 Shift 时提示框以「按住 Shift 查看搭建说明」结尾。

投料仓与核心都不接受漏斗，供热方块也不是容器；产物仓只能从它的下侧面抽出，而那一面成型后正对着中层中心那块炉壁，所以那里放不进漏斗。活动批次里拆炉壁或拆一座仓，这一批按失败结算一次，已经投进去的材料不返还；拆一座仓只掉这座仓自己的物品。

丹药吃完会累计丹毒：服丹的药效、阈值与过量后剩多少写在 [pill](../datapack/json/pill.md) 里，本体只负责记账。默认丹毒不会自己退；服务端配置「炼丹 → 每秒丹毒自然消退」设成正数后，已经有丹毒的活跃实体每累计 20 刻退一次，离线不退，也不会给没服过丹的实体建一份空账。

## 符笔与颜料

符笔 `mxt:talisman_brush` **不叠放**——一支笔就是一口自己的颜料存量，记在物品组件 `mxt:brush_pigment` 里：一个非负整数，**1 单位就是 1 像素弧长**，没写这个组件与写 `0` 是一回事（都是空笔）。物品格里那一小条就是还剩多少（只在有颜料时出现），提示框另有一行「颜料：已存 / 上限」，上限是**服务端配置「符箓 → 符笔容量」**（默认 4000，约能描满 3–5 张符）。

加料就是**蘸料**，和原版储物袋（`minecraft:bundle`）同一套点击：**光标提着符笔，对着颜料物品点一下**（左键右键都行），点一次笔吸进**一份**（一个物品），点几下就蘸几份；笔满时一次都不吃。**它不挑界面**——背包、箱子、画符工作站里的格子都行，界面里没有专门的颜料槽，也不必跑去某个界面合成。一份颜料给多少由**服务端配置「符箓 → 一份颜料的点数」**说了算（默认 1000）。

颜料是用来画符的：在画符工作站里按每一笔的长度从这口存量里扣，见 [`mxt:talisman_drawing`](/datapack/json/talisman_drawing)。

## 数据组件示例

组件值可以直接在物品组件语法或 KubeJS 中写入，引用的数据包注册表 ID 会由原版注册表 Codec 解析：

```mcfunction
give @s mxt:contract_scroll[mxt:contract_scroll={contract_type:"mxt_test:master_servant"}]
give @s mxt:formation_plate[mxt:formation_plate={formation:"mxt_test:spirit_gathering"}]
give @s mxt:secret_realm_token[mxt:secret_realm_token={realm:"mxt_test:trial_realm"}]
give @s mxt:rift[mxt:rift={target:"minecraft:the_nether",color:16729156}]
give @s mxt:spirit_vessel[mxt:resource_container={"mxt_test:qi":25.0}]
give @s mxt:talisman[mxt:talisman={talismans:["mxt_test:flame_sigil"]}]
give @s mxt:physique[mxt:physique="mxt_test:sword_bone"]
give @s mxt:spirit_root[mxt:spirit_root="mxt_test:fire_root"]
give @s mxt:cultivation_jade_slip[mxt:technique="mxt_test:azure_water_manual"]
```

最后一行是**手册**的做法：堆上带 `mxt:technique` 组件时，这一叠才教那门功法；不带组件、也没有任何声明的 `items` 认领的玉简什么都不教、Tooltip 里也不显示功法。功法声明（`technique_binding`）只决定**怎么读**，以及 `/picker mxt:technique` 替它生成的载体用哪个物品（**创造模式物品栏不生成载体**）；把物品写进声明的 `items` 也可以让那一叠不带组件就当手册，见[功法绑定](/datapack/json/technique_binding)。

倒数第二、第三行是**灵根物品**与**体质物品**的做法：组件里写定义 ID，右键即授予（灵根被拒的理由是"已持有 / 元素互斥"，体质是"已持有 / 条件不满足 / 互斥标签冲突"），成功消耗 1 个、**创造模式不消耗**，见 [spirit_root](/datapack/json/spirit_root#holding) 与 [physique](/datapack/json/physique#holding)。

注意 `mxt:resource_container` 的值是**裸 map**，键就是资源 ID，**没有** `values` 外壳；写错外壳会被当作一个无法解析的键**静默忽略**（只留一条 WARN 日志），容器仍是空的。

铭刻好的符箓还可以带上一部分灌注进度（`mxt:spirit_storage` 与灵石共用，按 aura 记已灌单位，缺省表示一点都没灌）：

```mcfunction
give @s mxt:talisman[mxt:talisman={talismans:["mxt_test:common_sigil"]},mxt:spirit_storage={amounts:{"mxt:common":3}}]
```

阵盘也可以在游戏内绑定：主手持有阵盘时执行 `/mxt formation bind <formation>`（需要 gamemaster 权限）。绑定不再是取得可用阵盘的前提——**没绑定的阵盘右键时会自己认出脚下的阵法**（见 [未绑定的阵盘会自动识别](/datapack/json/formation)），命令与组件语法的用处变成了**限制**这块盘能立哪一座。组件语法要求先知道注册表 ID 和 NBT 结构，命令则由服务端做 Tab 补全并在 ID 不存在时拒绝。

契约卷轴、阵盘和秘境令牌没有绑定定义时会安全失败，并显示提示；灵兽袋、灵力容器和令牌的状态保存在 ItemStack 数据组件中，服务端是唯一权威。

## 另见

- 裂隙方块与裂隙锚的完整机制见[裂隙](./rift.md)。
- 管理单个裂隙的命令见[命令](./commands/mxt.md)。
