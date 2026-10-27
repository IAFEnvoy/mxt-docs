---
title: 内置物品
---

# 内置物品

MiXianTu 不为每个玩法预设具体数值，但提供少量通用承载物品和组件。数据驱动物品玩法通常通过绑定表或物品键注册表挂到现有物品上（见[物品绑定与组件](./item-bindings.md)）。

## 通用物品

当前内置内容包括灵石系列、灵铁锭、灵木、朱砂、符纸、符箓、契约卷轴、召回符、御兽铃、令牌、灵石袋、戒指、锻造台、丹炉部件、丹药载体、药渣、杂质、奖励箱和展示架等。具体注册名以 `src/main/java/com/iafenvoy/mxt/registry` 和资源文件为准。**灵植方块不在其中**：灵植定义用 `blocks` 认领已有方块、用 `growth.drops` 认领自己的果实，本体不注册任何草方块。

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

以下物品由本体提供统一服务端实现。物品只保存数据包 Holder 或持久化状态，不复制对应模块的规则；具体契约、阵法、秘境和资源数值仍由数据包定义。它们各自组件怎么手写见[物品绑定与组件](./item-bindings.md#数据组件示例)。

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
| 符笔 | `mxt:talisman_brush` | `mxt:brush_pigment` | 符笔装自己的颜料存量，加料是原版储物袋那套点击（提着符笔点一下颜料就蘸）。颜料就是物品标签 `#mxt:brush_pigment` 里的物品，主资源包里只有朱砂 `mxt:cinnabar`；一份颜料给多少由服务端配置说了算（见[符笔与颜料](./alchemy-and-brush.md#符笔与颜料)）。 |
| 符箓 | `mxt:talisman` | `mxt:talisman` + `mxt:spirit_storage` | 保存**已铭刻的那条符箓**：一个 `talisman` 定义条目（缺省就是刚做出来的空载体），加上一个模式字段 `mode`（`"fire"` 缺省／`"store"`）；一张载体只铭刻一条，再刻一条会顶掉前一条。手持按住右键灌注灵气（容量 = 一次发动的灵气用量 × 铭刻定义的 `capacity` 倍率，实际倍率还要跟载体剩余使用次数取小，按灵气分别计量），灌满那一刻铭刻的能力全部发动并消耗一件本体（`store` 模式除外：它只积累，不自动发动）。存量够付清一次发动的灵气条目时，**右键即发动**——写了 `durability` / `consume` 再配大倍率，就能灌满一次连打好几次（见 [灌注与激发](/datapack/json/talisman)）。**潜行 + 右键切换模式**，`store` 且已灌满时潜行使用不切换而是**直接发动**。摆在展示架上被填满时按模式处理，并以展示架的位置作为激发地点——公式与位置类行为都用它（见 [灌注与激发](/datapack/json/talisman)）。铭刻（写符）服务尚未接入，`mxt:talisman` 组件目前可以手写或用物品组件语法直接写入（`/talisman give` 也能发）；灌注进度与灵石共用同一个存储组件 `mxt:spirit_storage`（按灵气记已灌单位，缺省表示一点都没灌）。**徒手右键与灌满自动发动走同一个入口**，但两条规则各按"在哪"分：**冷却只是手上的闸门**（服务端配置「符箓 → 使用冷却」，默认 20 刻、0 关闭），一次**尝试**就进冷却，窗口内长按灌注不会发动、那一 tick 的灵气也不会被灌进去；**消耗则按位置分**——手上一次发动消耗一件本体（**创造模式不消耗**），摆在展示架上的**永远消耗**、且不查也不记冷却。两条规则都由 `SpiritSource.consumedByHand()` 区分。**铭刻的定义可以声明耐久**（`durability` / `consume`）：上限写进原版组件（`max_damage` 加 `max_stack_size: 1` 与 `damage: 0`，物品上就有耐久条），每次发动改成扣耐久、扣满那一次销毁载体；没声明耐久的载体照旧一次一张本体。 |

功法书的页用原版书写书的页组件 `minecraft:writable_book_content`。它的 `pages` 是一串**纯字符串**，放不进 `translate` 组件，所以书上印出来的正文只有数据包写下时用的**那一种语言**——`custom_name`（物品名）不受影响，照常跟随语言切换。本体只把页读出来原样发进聊天栏，不做任何翻译。**这层限制得由本体改动才能解决**，数据包侧无解。

玉简不走那条路：它存的是一个完整的文本组件（`mxt:stored_text`），裸字符串就是翻译键，所以玉简的正文可以跟着语言切换。

## 另见

- 裂隙与裂隙锚的完整机制见[裂隙](./rift.md)。
- 管理单个裂隙的命令见[命令](./commands/mxt.md)。
