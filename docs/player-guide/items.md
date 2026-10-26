---
title: 内置物品与组件
---

# 内置物品与组件

MiXianTu 不为每个玩法预设具体数值，但提供少量通用承载物品和组件。数据驱动物品玩法通常通过绑定表或物品键注册表挂到现有物品上。

## 通用物品

当前内置内容包括灵石系列、灵铁锭、灵木、朱砂、符纸、符箓、契约卷轴、召回符、御兽铃、令牌、灵石袋、戒指、锻造台、丹炉部件、丹药载体、药渣、杂质、奖励箱和展示架等。具体注册名以 `src/main/java/com/iafenvoy/mxt/registry` 和资源文件为准。**灵植方块不在其中**：灵植定义用 `blocks` 认领已有方块、用 `growth.drops` 认领自己的果实，本体不注册任何草方块。

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
| 身份与记录 | `mxt:wooden_token`、`mxt:stone_token`、`mxt:blank_talisman` |
| 固定道具 | `mxt:contract_scroll`、`mxt:recall_talisman`、`mxt:beast_taming_bell` |

## 统一功能载体

以下物品由本体提供统一服务端实现。物品只保存数据包 Holder 或持久化状态，不复制对应模块的规则；具体契约、阵法、秘境和资源数值仍由数据包定义。

| 物品 | ID | 持久化组件 | 统一行为 |
| --- | --- | --- | --- |
| 契约卷轴 | `mxt:contract_scroll` | `mxt:contract_scroll` | 保存 `contract_type`，对生物使用时由 `ContractService` 校验并签订契约。 |
| 御兽铃 | `mxt:beast_taming_bell` | `mxt:contract_bell` | 保存"对准的那只灵宠"（UUID、显示名、它认的行为）。右键灵宠＝对准它，右键空处＝打开轮盘「契约灵兽」那一页，点一格给这只灵宠下跟随 / 游荡 / 驻守 / 召回的命令。 |
| 灵兽袋 | `mxt:spirit_beast_bag` | `mxt:spirit_beast` | 保存一只已契约生物的完整持久化实体数据（契约与档案附件也在里面），另外记着它的类型、当时的名字、契约类型与主人——这几项让提示框不必加载实体就能说清袋里是谁。对灵宠右键收纳，**对着方块右键在方块上方放出**。 |
| 阵盘 | `mxt:formation_plate` | `mxt:formation_plate` | 保存 `allowed`（允许激活哪些阵法，支持 `#标签`）与 `formation`（当前选中）；对方块使用时调用 `FormationWorldService`。没绑定阵法时会**自动识别**脚下这座阵法。 |
| 秘境令牌 | `mxt:secret_realm_token` | `mxt:secret_realm_token` | 右键召唤通往绑定秘境的门；秘境中召返回门，接触后按进出条件与成员上限传送。 |
| 奖励箱 | `mxt:reward_box` | `mxt:reward_box` | 保存一张掉落物表的 id；右键按这张表抽一次，抽到的东西直接进背包。这次抽取的位置是玩家脚下、上下文里带着开箱的玩家（`luck` 也算进去），所以按运气或按开箱者判的条件照常生效；一次消耗 1 个箱子，**创造模式不消耗**。没绑表、或当前数据包没有这张表时拒绝打开并给出提示，不会白吃掉箱子。 |
| 裂隙编辑器 | `mxt:rift` | `mxt:rift` | 与裂隙锚共用平面门编辑器，需要 2 级 OP。见[裂隙](./rift.md)。 |
| 灵力容器 | `mxt:spirit_vessel` | `mxt:resource_capacity`、`mxt:resource_container` | 保存任意 `resource`，每种资源各自一份上限（上限表里没写的资源存不进）；**按住右键**把它倒进持有者账户（每 tick 每种资源 1 单位），**没有模式**、也没有"存入"的右键；往里灌靠展示架的灵力射线，或者**把它拿在主手发射灵力**（那一次灵力直接充进容器，不射出射线）。 |
| 功法书 | `mxt:technique_book` | `mxt:technique` | 保存一份 `technique` 定义；**提示框里印功法名与描述**（描述取生成键的翻译，包没翻译就不印），**右键把它读进聊天栏**——先印书上写的页（`minecraft:writable_book_content`），再印同样的名字与描述。功法自己写了 `learn_time` 的仍然是长按读完才学会；创造栏里的空书没有组件，右键会说它没写明是哪一门功法。 |
| 玉简 | `mxt:jade_slip` | `mxt:stored_text`、`mxt:jade_slip_reading` | 存一段文字（一个文本组件，所以可以写成 `translate`），**按住右键读满才把它整段打进聊天栏**：默认 40 tick（两秒），这一堆要快些慢些就写 `mxt:jade_slip_reading`（单位 tick），写 `0` 与**潜行右键**都是一点即读。读的过程里手臂是阅读的姿势，没写字的玉简读出来是一句提示。 |
| 木/石令牌 | `mxt:wooden_token`、`mxt:stone_token` | `mxt:token` | 统一承载 `kind`、`value`、`owner`，供秘境和交易等权限系统共用。**在铁砧里给它改名即认主**：`owner` 记成改名那个玩家的 UUID，原来记着的主人会被覆盖；`owner` 不进提示框（提示框只印 `kind` 与 `value`）。 |
| 鉴定镜 | `mxt:identification_mirror` | 消费 `mxt:identification` | 统一解析带有鉴定组件的物品；具体待鉴定物品由内容包或其他模组提供。 |
| 灵根 | `mxt:spirit_root` | `mxt:spirit_root` | 保存一份 `spirit_root` 定义；右键获得这条灵根（"已持有"与元素互斥照旧被拒，见 [spirit_root](/datapack/json/spirit_root#holding)），授予成功时消耗 1 个，**创造模式不消耗**。 |
| 体质 | `mxt:physique` | `mxt:physique` | 保存一份 `physique` 定义；右键获得这项体质（"已持有"、`holder_condition` 不满足与互斥标签冲突照旧被拒，见 [physique](/datapack/json/physique#holding)），授予成功时消耗 1 个，**创造模式不消耗**。 |
| 符笔 | `mxt:talisman_brush` | `mxt:brush_pigment` | 符笔装自己的颜料存量，加料是原版储物袋那套点击（提着符笔点一下颜料就蘸）。颜料就是物品标签 `#mxt:brush_pigment` 里的物品，主资源包里只有朱砂 `mxt:cinnabar`；一份颜料给多少由服务端配置说了算（见[符笔与颜料](#符笔与颜料)）。 |
| 符箓 | `mxt:talisman` | `mxt:talisman` + `mxt:spirit_storage` | 保存**已铭刻的那条符箓**：一个 `talisman` 定义条目（缺省就是刚做出来的空载体），加上一个模式字段 `mode`（`"fire"` 缺省／`"store"`）；一张载体只铭刻一条，再刻一条会顶掉前一条。手持按住右键灌注灵气（容量 = 一次发动的灵气用量 × 铭刻定义的 `capacity` 倍率，实际倍率还要跟载体剩余使用次数取小，按灵气分别计量），灌满那一刻铭刻的能力全部发动并消耗一件本体（`store` 模式除外：它只积累，不自动发动）。存量够付清一次发动的灵气条目时，**右键即发动**——写了 `durability` / `consume` 再配大倍率，就能灌满一次连打好几次（见 [灌注与激发](/datapack/json/talisman)）。**潜行 + 右键切换模式**，`store` 且已灌满时潜行使用不切换而是**直接发动**。摆在展示架上被填满时按模式处理，并以展示架的位置作为激发地点——公式与位置类行为都用它（见 [灌注与激发](/datapack/json/talisman)）。铭刻（写符）服务尚未接入，`mxt:talisman` 组件目前可以手写或用物品组件语法直接写入（`/talisman give` 也能发）；灌注进度与灵石共用同一个存储组件 `mxt:spirit_storage`（按灵气记已灌单位，缺省表示一点都没灌）。**徒手右键与灌满自动发动走同一个入口**，但两条规则各按"在哪"分：**冷却只是手上的闸门**（服务端配置「符箓 → 使用冷却」，默认 20 刻、0 关闭），一次**尝试**就进冷却，窗口内长按灌注不会发动、那一 tick 的灵气也不会被灌进去；**消耗则按位置分**——手上一次发动消耗一件本体（**创造模式不消耗**），摆在展示架上的**永远消耗**、且不查也不记冷却。两条规则都由 `SpiritSource.consumedByHand()` 区分。**铭刻的定义可以声明耐久**（`durability` / `consume`）：上限写进原版组件（`max_damage` 加 `max_stack_size: 1` 与 `damage: 0`，物品上就有耐久条），每次发动改成扣耐久、扣满那一次销毁载体；没声明耐久的载体照旧一次一张本体。 |

功法书的页用原版书写书的页组件 `minecraft:writable_book_content`。它的 `pages` 是一串**纯字符串**，放不进 `translate` 组件，所以书上印出来的正文只有数据包写下时用的**那一种语言**——`custom_name`（物品名）不受影响，照常跟随语言切换。本体只把页读出来原样发进聊天栏，不做任何翻译。**这层限制得由本体改动才能解决**，数据包侧无解。

玉简不走那条路：它存的是一个完整的文本组件（`mxt:stored_text`），裸字符串就是翻译键，所以玉简的正文可以跟着语言切换。

## 炼丹与灵植

丹炉不是一件方块：它是一座手搭的固定 3×3×3。核心带炉型规格，两个投料仓分放主药与辅药药引，产物仓只负责出货，其余 18 格砌成炉壁（底层只放四角）。

| 方块 | ID | 用途 |
| --- | --- | --- |
| 丹炉核心 | `mxt:alchemy_furnace` | 正面中层那一块。炉温读数与「设定 / 开炉 / 终止」在这块打开的页面上。 |
| 主药投料仓 | `mxt:alchemy_main_input` | 面向正面时在左侧，两个主药格。 |
| 辅药投料仓 | `mxt:alchemy_auxiliary_input` | 面向正面时在右侧，两个辅药格加一个药引格。 |
| 丹炉产物仓 | `mxt:alchemy_output` | 顶部中心，四个输出格，只能取出。 |
| 丹炉炉壁 | `mxt:alchemy_furnace_casing` | 底层四角与上面两层，共 18 格，每块带自己的炉壁材料；炉壁不打开界面。 |
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

## 另见

- 裂隙与裂隙锚的完整机制见[裂隙](./rift.md)。
- 管理单个裂隙的命令见[命令](./commands/mxt.md)。
